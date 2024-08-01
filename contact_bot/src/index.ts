import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { bot, BotSession, BotContext, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionCommand, accessCheckMiddleware, userCheckMiddleware, handleAccountCommand } from './bot';

function initial(): BotSession {
  return { waitingForEmail: false };
}
bot.use(session({ initial }));

bot.use(conversations());

bot.use(createConversation(handleContactsCommand));
bot.command('start', handleStartCommand);

bot.use(userCheckMiddleware);
bot.command('help', handleHelpCommand);
bot.command('subscription', handleSubscriptionCommand);
bot.callbackQuery('process_subscription', handleSubscriptionProcessQuery);
bot.on('message:text', handleEmailInput);
bot.command('account', handleAccountCommand);
bot.command('subscription', handleSubscriptionCommand);
bot.hears('💳 Подписка', handleSubscriptionCommand);
bot.hears('💳 Подписка', handleSubscriptionCommand);
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
