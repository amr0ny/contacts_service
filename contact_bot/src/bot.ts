import config, { logger } from './config';
import { Context, NextFunction, Keyboard, Bot } from 'grammy';
import { type Other } from 'grammy/out/core/api.d';
import { type RawApi } from 'grammy/out/core/client.d';

import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { User, ContactPresentable } from './schemas';
import { apiService } from './requests/apiService';

interface BotConfig {
  user: User;
}

export type BotContext = Context &
  ConversationFlavor & {
    config: BotConfig;
  };


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

export const constraintMiddleware = async (ctx: BotContext, next: NextFunction) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) throw new Error('User id is undefined');

    const user = await apiService.fetchUser({ userId });
    if (!user) {
      await ctx.reply('User not found. Please start the conversation with the /start command to use the bot.');
      return;
    }

    // Check if user object is empty
    if (Object.keys(user).length === 0) {
      await ctx.reply('User data is incomplete. Please start the conversation with the /start command to set up your account.');
      return;
    }

    const now = new Date();

    if (user.trial_state > 0) {
      await apiService.updateUser(userId, { trial_state: user.trial_state - 1 });
      ctx.config = { user: { ...user, trial_state: user.trial_state - 1 } };
      await next();
    } else if (user.subscription_expiration_date && user.subscription_expiration_date > now) {
      ctx.config = { user };
      await next();
    } else {
      const message = `Your access has expired. ${user.trial_state === 0 ? 'You have used all your trial attempts. ' : ''}${user.subscription_expiration_date && user.subscription_expiration_date <= now ? 'Your subscription has expired. ' : ''}Please use the /subscription command to renew your access.`;
      await ctx.reply(message);
    }
  } catch (e) {
    logger.error(`An error occurred while running middleware: ${e}`);
    await ctx.reply('An error occurred. Please try again later or contact support.');
  }
};

export const handleStartCommand = async (ctx: BotContext) => {
  try {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!userId || !chatId) throw new Error('User or chat id is undefined');
    logger.debug(config.api_base_url);
    let user = await apiService.fetchUser({ userId });
    if (!user) {
      user = await apiService.createUser({
        user_id: userId,
        username: ctx.from?.username ?? '',
        first_name: ctx.from?.first_name ?? undefined,
        last_name: ctx.from?.last_name ?? undefined
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
  await ctx.reply('Здесь будет информация о подписке и ее управлении.');
};