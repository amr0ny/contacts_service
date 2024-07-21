import { logger } from './config';
import { session } from 'grammy';
import { createConversation, conversations } from '@grammyjs/conversations';
import { initUserTable } from './queries';
import { bot, handleContactsCommand, handleStartCommand, handleHelpCommand, handleSubscriptionCommand, constraintMiddleware } from './bot';

initUserTable().then(() => logger.info('User table is OK'));

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

bot.use(createConversation(handleContactsCommand));

bot.command('start', handleStartCommand);
bot.command('help', handleHelpCommand);
bot.command('subscription', handleSubscriptionCommand);

bot.hears('📞 Контакты', async (ctx) => {
  await ctx.conversation.enter('handleContactsCommand');
});
bot.hears('💳 Подписка', handleSubscriptionCommand);
bot.hears('❓ Помощь', handleHelpCommand);

bot.use(constraintMiddleware);
bot.start();
