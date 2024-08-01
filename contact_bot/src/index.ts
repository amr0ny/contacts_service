import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { bot, BotContext, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionConversation, accessCheckMiddleware, userCheckMiddleware, handleAccountCommand } from './bot';


bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(conversations());

bot.use(createConversation(handleContactsCommand));
bot.use(createConversation(handleSubscriptionConversation));

bot.command('start', handleStartCommand);

bot.use(userCheckMiddleware);
bot.command('help', handleHelpCommand);
bot.command('account', handleAccountCommand);

bot.command('subscription', async (ctx) => {
  await ctx.conversation.enter('handleSubscriptionConversation');
});
bot.hears('💳 Подписка', async (ctx) => {
  await ctx.conversation.enter('handleSubscriptionConversation');
});

bot.hears('❓ Помощь', handleHelpCommand);
bot.hears('👤 Аккаунт', handleAccountCommand);

bot.use(accessCheckMiddleware);
bot.command('search', async (ctx: BotContext) => {
  await ctx.conversation.enter('handleContactsCommand');
});
bot.hears('🔍 Поиск', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});

bot.start();