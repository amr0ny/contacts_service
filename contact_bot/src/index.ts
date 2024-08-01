import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { bot, BotSession, BotContext, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionConversation, accessCheckMiddleware, userCheckMiddleware, handleAccountCommand, conversationCheckMiddleware } from './bot';



bot.use(session({
  initial: (): BotSession => ({
    currentConversation: undefined
  })
}));
bot.use(conversations());
bot.use(createConversation(handleContactsCommand));
bot.use(createConversation(handleSubscriptionConversation));

bot.use(userCheckMiddleware);
bot.use(conversationCheckMiddleware);

bot.command('start', handleStartCommand);

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