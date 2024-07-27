import config, { logger } from './config';
import { Context, NextFunction, Keyboard, Bot, InlineKeyboard } from 'grammy';
import { type Other } from 'grammy/out/core/api.d';
import { type RawApi } from 'grammy/out/core/client.d';

import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { ContactPresentable } from './schemas';
import { apiService } from './requests/apiService';


export type BotContext = Context &
  ConversationFlavor;

const sendLargeMessage = (bot: Bot<BotContext>, limit: number) => async (chatId: string | number, text: string, reply_markup: Other<RawApi, 'sendMessage', 'chat_id' | 'text'> | undefined) => {
  const parts = text.match(new RegExp(`(.|[\r\n]){1,${limit}}`, 'g')) || [];
  for (let i = 0; i < parts.length; i++) {
    const isLastPart = i === parts.length - 1;
    await bot.api.sendMessage(chatId, parts[i], isLastPart ? reply_markup : {});
  }
};

const TELEGRAM_MESSAGE_LIMIT = 4096;
export const bot = new Bot<BotContext>(config.token);
const sendMessage = sendLargeMessage(bot, TELEGRAM_MESSAGE_LIMIT);

const createMainKeyboard = () => new Keyboard().text('📞 Контакты').text('💳 Подписка').row().text('❓ Помощь').resized();

export const userCheckMiddleware = async (ctx: BotContext, next: NextFunction) => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.');
    return;
  }

  const user = await apiService.fetchUser({ userId });
  if (!user || Object.keys(user).length === 0) {
    await ctx.reply('Для того, чтобы начать работать с ботом введите /start');
    return;
  }

  await next();
};

export const accessCheckMiddleware = async (ctx: BotContext, next: NextFunction) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.');
      return;
    }

    const user = await apiService.fetchUser({ userId });
    if (!user) {
      await ctx.reply('Пользователь не найден, пожалуйста, перезапустите бота: /start');
      return;
    }

    const now = new Date();
    const expirationDate = user.subscription_expiration_date
      ? new Date(user.subscription_expiration_date)
      : undefined; // Если дата не определена, используем прошедшую дату

    if (user.trial_state > 0) {
      if (expirationDate) {
        if (expirationDate > now) {
          await apiService.updateUser(userId, { trial_state: user.trial_state - 1 });
          await next();
        } else {
          ctx.reply('Срок действия вашей пробной подписки истек. Чтобы продолжить пользоваться сервисом, вам нужно оформить новую подписку.');
        }
      } else {
        await apiService.updateUser(userId, { trial_state: user.trial_state - 1 });
        await next()
      }
    } else {
      if (expirationDate) {
        if (expirationDate > now) {
          await ctx.reply('У вас закончились запросы в рамках подписки. Чтобы продолжить пользоваться сервисом, вам нужно оформить новую подписку.');
          return;
        }
      }
      else {
        await ctx.reply('У вас закончились пробные запросы. Приобретите подписку, чтобы продолжить пользоваться сервисом.')
      }
    }
  } catch (error) {
    logger.error('Error in accessCheckMiddleware:', error);
    await ctx.reply('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.');
  }
};


export const handleStartCommand = async (ctx: BotContext) => {
  try {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!userId || !chatId) throw new Error('User or chat id is undefined');
    let user = await apiService.fetchUser({ userId });
    if (!user) {
      user = await apiService.createUser({
        user_id: userId,
        username: ctx.from?.username ?? '',
        first_name: ctx.from?.first_name ?? undefined,
        last_name: ctx.from?.last_name ?? undefined,
        trial_state: config.userTrialState
      });
      if (!user) throw new Error('Failed to create user');
      await ctx.reply(`Добро пожаловать в бот для поиска РПК.\nСписок доступных комманд: \n
        /search – Получить список рекламно-производственных компаний по указанному городу
        /account – Посмотреть информацию о вашей подписке
        /subscription – Оформить платную подписку на сервис

        Вам доступно пробных запросов: ${user.trial_state}
        `, { reply_markup: createMainKeyboard() });
    } else {
      await ctx.reply(`Добро пожаловать назад!\nСписок доступных комманд: \n
        /search – Получить список рекламно-производственных компаний по указанному городу
        /account – Посмотреть информацию о вашей подписке
        /subscription – Оформить платную подписку на сервис

        ${user.subscription_expiration_date ? `Вам доступно запросов: ${user.trial_state}` : ''}
        `, { reply_markup: createMainKeyboard() });
    }
  } catch (e) {
    logger.error(`An error occurred while starting bot communication: ${e}`);
    await ctx.reply('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.').catch((replyError) => logger.error(`Failed to send error message to user: ${replyError}`));
  }
};

export const handleContactsCommand = async (conversation: Conversation<BotContext>, ctx: BotContext) => {
  try {
    await ctx.reply('Пожалуйста, введите название города:', {
      reply_markup: new Keyboard().text('⬅️ Назад').resized(),
    });

    const { message } = await conversation.wait();

    if (!message?.text) {
      await ctx.reply('Извините, я не смог распознать название города. Попробуйте еще раз /search.', {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const userResponse = message.text.trim();

    if (userResponse === '⬅️ Назад') {
      await ctx.reply('Вы вернулись назад.', {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    if (!userResponse) {
      await ctx.reply('Название города не должно быть пустым. Попробуйте еще раз /search.', {
        reply_markup: createMainKeyboard(),
      });

      return;
    }

    const contacts = await apiService.fetchContactsByCity({ cityName: userResponse });

    if (contacts.length === 0) {
      await ctx.reply(`Извините, компании для города "${userResponse}" не найдены.`, {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const contactMessage = contacts.map((contact: ContactPresentable) => `${contact.name} – ${contact.description} – ${contact.city} – ${contact.phone_1}`).join('\n');

    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error('Chat ID not found');
    }

    await sendMessage(chatId, `Список контактов для города ${userResponse}:\n\n${contactMessage}`, {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    logger.error(`An error occurred while handling the contacts command: ${error}`);
    await ctx.reply('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.', {
      reply_markup: createMainKeyboard(),
    });
  }
};

export const handleHelpCommand = async (ctx: BotContext) => {
  await ctx.reply(`Доступные команды:\n
    /start - Начать работу с ботом
    /search - Поиск контактов по городу\n/subscription - Управление подпиской
    /account – Посмотреть информацию о вашей подписке
    `);
};

export const handleSubscriptionCommand = async (ctx: BotContext) => {
  await ctx.reply(`Бот предоставляет бесплатный лимит из ${config.userTrialState} запросов.
    Для того, чтобы пользоваться ботом без ограничений, оформите подписку.
  `, {
    reply_markup: new InlineKeyboard().text(`✅ Купить неограниченный доступ за ${config.paymentAmount} руб`, 'process_subscription')
  });
};

export const handleSubscriptionProcessQuery = async (ctx: BotContext) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCallbackQuery('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.');
    return;
  }

  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.answerCallbackQuery('Не удалось идентифицировать пользователя. Пожалуйста, попробуйте еще раз.');
      return;
    }

    const user = await apiService.fetchUser({ userId });
    if (user && user.subscription_expiration_date && new Date(user.subscription_expiration_date) > new Date()) {
      await ctx.answerCallbackQuery('У вас уже есть активная подписка. ');
      return;
    }

    const res = await apiService.initUserPayment({ userId: userId });
    if (!res || !res.payment_url) {
      throw new Error('Payment link is unavailable');
    }

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('*Оплата банковской картой РФ*', {
      reply_markup: new InlineKeyboard().url('💸 Перейти к оплате', res.payment_url)
    });

    // Обновление данных пользователя (например, установка флага "ожидает оплаты")
    // await apiService.updateUser(userId, { payment_pending: true });

  } catch (error) {
    logger.error(`An error occurred while handling initializing payment for subscription: ${error}`);

    if (error instanceof Error) {
      if (error.message === 'Payment link is unavailable') {
        await ctx.answerCallbackQuery('Извините, в данный момент сервис оплаты недоступен. Пожалуйста, попробуйте позже.');
      } else {
        await ctx.answerCallbackQuery('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
        /*
        await ctx.editMessageText('Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь в поддержку.', {
          reply_markup: createMainKeyboard()
        });
        */
      }
    } else {
      await ctx.answerCallbackQuery('Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.');
    }
  }
};