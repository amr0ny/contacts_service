import config, { logger } from './config';
import { Context, NextFunction, Keyboard, Bot, InlineKeyboard } from 'grammy';
import { type Other } from 'grammy/out/core/api.d';
import { type RawApi } from 'grammy/out/core/client.d';
import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { ContactPresentable } from './schemas';
import { apiService } from './requests/apiService';
import { getRequestWord } from './utils/wording';
import { CallbackQuery } from "@grammyjs/types";


export type BotContext = Context &
  ConversationFlavor;

const sendLargeMessageContacts = (bot: Bot<BotContext>, limit: number) => async (
  chatId: string | number,
  contacts: ContactPresentable[],
  cityName: string,
  reply_markup: Other<RawApi, 'sendMessage', 'chat_id' | 'text'> | undefined
) => {
  let currentMessage = `📋 Список РПК в городе ${cityName}:\n\n`;

  const formatValue = (value: any): string | null => {
    if (value === null || value === undefined || String(value).toLowerCase() === 'nan') {
      return null;
    }
    return String(value);
  };

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactParts = [
      formatValue(contact.name) ? `${formatValue(contact.name)}` : null,
      formatValue(contact.description) ? `${formatValue(contact.description)}` : null,
      formatValue(contact.city) ? `${formatValue(contact.city)}` : null,
      contact.phone_1 ? formatValue(parseFloat(contact.phone_1).toString()) : null
    ].filter(Boolean);

    const contactInfo = contactParts.join(' – ') + '\n\n';

    if (currentMessage.length + contactInfo.length > limit) {
      await bot.api.sendMessage(chatId, currentMessage.trim(), {});
      currentMessage = contactInfo;
    } else {
      currentMessage += contactInfo;
    }
  }

  // Send the last message with reply_markup
  if (currentMessage.trim()) {
    await bot.api.sendMessage(chatId, currentMessage.trim(), reply_markup);
  }
};

const TELEGRAM_MESSAGE_LIMIT = 4096;
export const bot = new Bot<BotContext>(config.token);

const createMainKeyboard = () => new Keyboard()
  .text('🔍 Поиск').text('💳 Подписка')
  .row().text('❓ Помощь').text('👤 Аккаунт')
  .resized();

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
          await next();
          await apiService.updateUser(userId, { trial_state: user.trial_state - 1 });
        } else {
          ctx.reply('Срок действия вашей пробной подписки истек. Чтобы продолжить пользоваться сервисом, вам нужно оформить новую подписку.');
        }
      } else {
        await next()
        await apiService.updateUser(userId, { trial_state: user.trial_state - 1 });
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
      await ctx.reply(`🎉 Добро пожаловать в бот для поиска РПК!

🔍 Доступные команды:
/search – Поиск РПК по городу
/account – Информация о подписке
/subscription – Оформление подписки

🎁 У вас ${user.trial_state} ${getRequestWord(user.trial_state)}.
Удачного поиска!`, { reply_markup: createMainKeyboard() });
    } else {
      await ctx.reply(`👋 С возвращением!


🔍 Доступные команды:
/search – Поиск РПК по городу
/account – Информация о подписке
/subscription – Оформление подписки

${user.subscription_expiration_date ? `✅ Доступно запросов: ${user.trial_state}` : ''}
Удачного поиска!`, { reply_markup: createMainKeyboard() });
    }
  } catch (e) {
    logger.error(`An error occurred while starting bot communication: ${e}`);
    await ctx.reply('😔 Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь в поддержку.').catch((replyError) => logger.error(`Failed to send error message to user: ${replyError}`));
  }
};
export const handleContactsCommand = async (conversation: Conversation<BotContext>, ctx: BotContext) => {
  try {
    await ctx.reply('🏙️ Введите название города:', {
      reply_markup: new Keyboard().text('⬅️ Назад').resized(),
    });

    const { message } = await conversation.wait();

    if (!message?.text) {
      await ctx.reply('😕 Извините, не удалось распознать название города. Попробуйте еще раз с помощью /search.', {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const userResponse = message.text.trim();

    if (userResponse === '⬅️ Назад') {
      await ctx.reply('👌 Вы вернулись в главное меню.', {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    if (!userResponse) {
      await ctx.reply('❗ Название города не может быть пустым. Попробуйте еще раз с помощью /search.', {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const contacts = await apiService.fetchContactsByCity({ cityName: userResponse });

    if (contacts.length === 0) {
      await ctx.reply(`😔 К сожалению, РПК для города "${userResponse}" не найдены.`, {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error('Chat ID not found');
    }

    const sendMessage = sendLargeMessageContacts(bot, TELEGRAM_MESSAGE_LIMIT);  // 4096 - максимальная длина сообщения в Telegram

    await sendMessage(chatId, contacts, userResponse, {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    logger.error(`An error occurred while handling the contacts command: ${error}`);
    await ctx.reply('😔 Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь в поддержку.', {
      reply_markup: createMainKeyboard(),
    });
  }
};

export const handleHelpCommand = async (ctx: BotContext) => {
  await ctx.reply(`ℹ️ Доступные команды:

🚀 /start - Начать работу с ботом
🔍 /search - Поиск РПК по городу
💳 /subscription - Управление подпиской
👤 /account - Информация о подписке

Если у вас остались вопросы, обратитесь в поддержку.`);
};
export const handleSubscriptionCommand = async (ctx: BotContext) => {
  await ctx.conversation.enter('subscriptionConversation');
};

export const handleSubscriptionConversation = async (conversation: Conversation<BotContext>, ctx: BotContext) => {
  // Шаг 1: Показываем информацию о подписке
  await ctx.reply(`🎁 Бот предоставляет ${config.userTrialState} бесплатных ${getRequestWord(config.userTrialState)}.

💼 Для неограниченного доступа оформите подписку:`, {
    reply_markup: new InlineKeyboard()
      .text(`✅ Купить за ${parseFloat((config.paymentAmount / 100).toString()).toString()} ₽`, 'confirm_subscription')
      .text('❌ Отмена', 'cancel_subscription')
  });

  // Шаг 2: Ждем подтверждения покупки
  const response = await conversation.waitForCallbackQuery(['confirm_subscription', 'cancel_subscription']);

  if (response.callbackQuery.data === 'cancel_subscription') {
    await ctx.answerCallbackQuery();
    await ctx.reply('🚫 Оформление подписки отменено.');
    return;
  }

  await ctx.answerCallbackQuery();

  // Шаг 3: Запрашиваем email
  await ctx.reply('📧 Пожалуйста, введите ваш адрес электронной почты:');

  const { message } = await conversation.wait();

  if (!message?.text) {
    await ctx.reply('😕 Извините, не удалось распознать email. Попробуйте оформить подписку заново.');
    return;
  }

  const email = message.text.trim();

  // Простая валидация email
  if (!email.includes('@') || !email.includes('.')) {
    await ctx.reply('❗ Некорректный формат email. Попробуйте оформить подписку заново.');
    return;
  }

  // Шаг 4: Сохраняем email и инициируем оплату
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('🤔 Не удалось идентифицировать пользователя. Пожалуйста, попробуйте еще раз.');
    return;
  }

  try {
    await apiService.updateUser(userId, { email: email });

    const user = await apiService.fetchUser({ userId });
    if (!user) {
      await ctx.reply('Пользователь не найден, пожалуйста, перезапустите бота: /start');
      return;
    }

    if (user.subscription_expiration_date && new Date(user.subscription_expiration_date) > new Date()) {
      await ctx.reply('✅ У вас уже есть активная подписка.');
      return;
    }

    const res = await apiService.initUserPayment({ userId: userId, email: email });
    if (!res || !res.payment_url) {
      throw new Error('Payment link is unavailable');
    }

    await ctx.reply('💳 Оплата банковской картой РФ', {
      reply_markup: new InlineKeyboard().url('💸 Перейти к оплате', res.payment_url)
    });

  } catch (error) {
    logger.error(`An error occurred while handling subscription process: ${error}`);
    await ctx.reply('😔 Произошла ошибка при оформлении подписки. Пожалуйста, попробуйте позже или обратитесь в поддержку.');
  }
};

export const handleAccountCommand = async (ctx: BotContext) => {
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
    const subscriptionExpirationDate = user.subscription_expiration_date
      ? new Date(user.subscription_expiration_date)
      : null;

    let subscriptionStatus = '';
    if (subscriptionExpirationDate && subscriptionExpirationDate > now) {
      subscriptionStatus = 'Активна';
    } else {
      subscriptionStatus = 'Не активна';
    }

    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const expirationMessage = subscriptionExpirationDate
      ? `📅  Заканчивается: ${formatDate(subscriptionExpirationDate)}`
      : '';

    const message = `
📊 <b>Состояние подписки:</b> ${subscriptionStatus}
📅 <b>${expirationMessage}</b>
🔄 <b>Доступные запросы:</b> ${user.trial_state}
    `;

    await ctx.reply(message, { parse_mode: 'HTML' });
  } catch (error) {
    logger.error('Error in handleAccountCommand:', error);
    await ctx.reply('Произошла ошибка. Попробуйте еще раз позже или обратитесь в службу поддержки.');
  }
};