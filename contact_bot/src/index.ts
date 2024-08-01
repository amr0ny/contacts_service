
import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { bot, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionCommand, accessCheckMiddleware, userCheckMiddleware, handleAccountCommand, handleSubscriptionConversation } from './bot';

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

bot.use(createConversation(handleContactsCommand));
bot.use(createConversation(handleSubscriptionConversation));
bot.command('start', handleStartCommand);

bot.use(userCheckMiddleware);
bot.command('help', handleHelpCommand);
bot.command('subscription', handleSubscriptionCommand);
bot.command('account', handleAccountCommand);
bot.hears('💳 Подписка', handleSubscriptionCommand);
bot.hears('❓ Помощь', handleHelpCommand);
bot.hears('👤 Аккаунт', handleAccountCommand);

bot.use(accessCheckMiddleware);
bot.command('search', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});
bot.hears('🔍 Поиск', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});

bot.start();
