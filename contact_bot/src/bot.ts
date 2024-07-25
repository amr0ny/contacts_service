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
    await ctx.reply('User id is undefined. Please try again later.');
    return;
  }

  const user = await apiService.fetchUser({ userId });
  if (!user || Object.keys(user).length === 0) {
    await ctx.reply('Please start the conversation with the /start command.');
    return;
  }

  await next();
};

export const accessCheckMiddleware = async (ctx: BotContext, next: NextFunction) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('User id is undefined. Please try again later.');
      return;
    }

    const user = await apiService.fetchUser({ userId });
    if (!user) {
      await ctx.reply('User not found. Please start the bot again.');
      return;
    }

    const now = new Date();
    const expirationDate = user.subscription_expiration_date || new Date(0);

    if (expirationDate) {
      if (expirationDate > now) {
        await next();
      }
      else {
        logger.debug(expirationDate.toISOString());
        logger.debug(now.toISOString());
        await ctx.reply('Your subscription expired', { reply_markup: createMainKeyboard(), });
        return;
      }
    }
    else if (user.trial_state > 0) {
      await apiService.updateUser(user.user_id, { trial_state: user.trial_state - 1 });
      await next();
    }
    else {
      await ctx.reply('You have no access to this.');
    }
  } catch (error) {
    console.error('Error in accessCheckMiddleware:', error);
    await ctx.reply('An error occurred while checking your access. Please try again later.');
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
      });
      if (!user) throw new Error('Failed to create user');
      await ctx.reply(`Welcome! You have ${user.trial_state} trial attempts`, { reply_markup: createMainKeyboard() });
    } else {
      await ctx.reply(`Welcome back ${user.first_name}! You have ${user.trial_state} attempts left`, { reply_markup: createMainKeyboard() });
    }
  } catch (e) {
    logger.error(`An error occurred while starting bot communication: ${e}`);
    await ctx.reply('Sorry, an error occurred. Please try again later or contact support.').catch((replyError) => logger.error(`Failed to send error message to user: ${replyError}`));
  }
};

export const handleContactsCommand = async (conversation: Conversation<BotContext>, ctx: BotContext) => {
  try {
    await ctx.reply('Пожалуйста, введите название города:', {
      reply_markup: new Keyboard().text('⬅️ Назад').resized(),
    });

    const { message } = await conversation.wait();

    if (!message?.text) {
      await ctx.reply('Извините, я не смог распознать название города. Попробуйте еще раз /contacts.', {
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
      await ctx.reply('Название города не должно быть пустым. Попробуйте еще раз /contacts.', {
        reply_markup: createMainKeyboard(),
      });

      return;
    }

    const contacts = await apiService.fetchContactsByCity({ cityName: userResponse });

    if (contacts.length === 0) {
      await ctx.reply(`Извините, контакты для города "${userResponse}" не найдены.`, {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const contactMessage = contacts.map((contact: ContactPresentable) => `${contact.name} – ${contact.description} – ${contact.city} – ${contact.phone_1}`).join('\n');

    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error('Chat ID not found');
    }

    await sendMessage(chatId, `Контакты для города ${userResponse}:\n\n${contactMessage}`, {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    logger.error(`An error occurred while handling the contacts command: ${error}`);
    await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.', {
      reply_markup: createMainKeyboard(),
    });
  }
};

export const handleHelpCommand = async (ctx: BotContext) => {
  await ctx.reply('Доступные команды:\n/start - Начать работу с ботом\n/contacts - Поиск контактов по городу\n/subscription - Управление подпиской');
};

export const handleSubscriptionCommand = async (ctx: BotContext) => {
  await ctx.reply('Для того, чтобы пользоваться возможностями бота без ограничений, оформите подписку.', {
    reply_markup: new InlineKeyboard().text('✅ Оформить подписку', 'process_subscription')
  });
};

export const handleSubscriptionProcessQuery = async (ctx: BotContext) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCallbackQuery('Произошла ошибка. Попробуйте еще раз.');
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
      await ctx.answerCallbackQuery('У вас уже есть активная подписка. Вы можете продлить ее позже.');
      return;
    }

    const res = await apiService.initUserPayment({ userId: userId });
    if (!res || !res.payment_url) {
      throw new Error('Payment link is unavailable');
    }

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Подписка 30 дней за 14 рублей', {
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