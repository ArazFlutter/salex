import { Telegraf } from 'telegraf';
import { registerPaymentHandlers } from './paymentHandlers';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new Telegraf(token);

registerPaymentHandlers(bot);

export async function startBot() {
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    await bot.telegram.setWebhook(`${process.env.TELEGRAM_WEBHOOK_URL}/bot/webhook`);
  } else {
    await bot.launch();
  }
}
