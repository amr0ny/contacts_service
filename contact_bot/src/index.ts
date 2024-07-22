import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { bot, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionCommand, constraintMiddleware } from './bot';

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

bot.use(createConversation(handleContactsCommand));

bot.command('start', handleStartCommand);
bot.command('help', handleHelpCommand);
bot.command('subscription', handleSubscriptionCommand);


bot.hears('💳 Подписка', handleSubscriptionCommand);
bot.hears('❓ Помощь', handleHelpCommand);

bot.use(constraintMiddleware);
bot.command('contacts', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});
bot.hears('📞 Контакты', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});


bot.start();
