import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { bot, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionCommand, accessCheckMiddleware, userCheckMiddleware, handleSubscriptionProcessQuery, handleAccountCommand } from './bot';

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

bot.use(createConversation(handleContactsCommand));

bot.command('start', handleStartCommand);

bot.use(userCheckMiddleware);
bot.command('help', handleHelpCommand);
bot.command('subscription', handleSubscriptionCommand);
bot.command('account', handleAccountCommand);
bot.hears('💳 Подписка', handleSubscriptionCommand);
bot.hears('❓ Помощь', handleHelpCommand);
bot.hears('👤 Аккаунт', handleAccountCommand);
bot.callbackQuery('process_subscription', handleSubscriptionProcessQuery);

bot.use(accessCheckMiddleware);
bot.command('contacts', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});
bot.hears('📞 Контакты', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});

bot.start();
