import type { Telegraf } from 'telegraf';
import { createPaymentOrderForUser, confirmPaymentOrderById } from '../services/paymentService';
import { findUserByTelegramId, linkTelegramId } from '../services/userService';
import { log } from '../utils/logger';

const PLAN_STARS = {
  premium: 500,
  premiumPlus: 1000,
} as const;

const PLAN_LABELS = {
  premium: 'SALex Premium',
  premiumPlus: 'SALex Premium Plus',
} as const;

export function registerPaymentHandlers(bot: Telegraf) {
  bot.command('start', async (ctx) => {
    try {
      const text = ctx.message?.text ?? '';
      const payload = text.startsWith('/start ') ? text.slice(7).trim() : '';

      if (payload.startsWith('link_')) {
        const userId = payload.replace('link_', '');
        if (!ctx.from?.id) {
          await ctx.reply('Telegram istifadəçisini oxumaq mümkün olmadı.');
          return;
        }
        await linkTelegramId(userId, ctx.from.id);
        await ctx.reply('Telegram hesabınız SALex-ə bağlandı!');
        return;
      }

      await ctx.reply('/buy_premium və ya /buy_premiumplus yazın');
    } catch (err) {
      log.error('bot.start.failed', { err });
      await ctx.reply('Bir problem baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
  });

  for (const plan of ['premium', 'premiumPlus'] as const) {
    const cmd = plan === 'premium' ? 'buy_premium' : 'buy_premiumplus';
    const planStars = PLAN_STARS[plan];
    const title = PLAN_LABELS[plan];

    bot.command(cmd, async (ctx) => {
      try {
        await ctx.replyWithInvoice({
          title,
          description: `${title} planı — elanları platformalara paylaşmaq üçün`,
          payload: JSON.stringify({ plan, telegramId: ctx.from?.id }),
          provider_token: '',
          currency: 'XTR',
          prices: [{ label: title, amount: planStars }],
        });
      } catch (err) {
        log.error('bot.payment.invoice_failed', { err, plan });
        await ctx.reply('Ödəniş başladıla bilmədi. Zəhmət olmasa yenidən cəhd edin.');
      }
    });
  }

  bot.on('pre_checkout_query', async (ctx) => {
    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message?.successful_payment;
    if (!payment) return;

    try {
      const { plan, telegramId } = JSON.parse(payment.invoice_payload) as {
        plan: string;
        telegramId: number;
      };

      log.info('bot.payment.stars_received', {
        telegramId,
        plan,
        stars: payment.total_amount,
        chargeId: payment.telegram_payment_charge_id,
      });

      const user = await findUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('Telegram hesabınız SALex-ə bağlı deyil. Əvvəlcə /start ilə hesabı bağlayın.');
        return;
      }

      const order = await createPaymentOrderForUser(user.id, plan);
      await confirmPaymentOrderById(order.id, user.id);

      await ctx.reply(
        `Ödəniş qəbul edildi! ${PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan} planı aktivləşdirildi.`,
      );
    } catch (err) {
      log.error('bot.payment.successful_payment.failed', { err });
      await ctx.reply('Ödəniş alındı, lakin təsdiq zamanı xəta baş verdi.');
    }
  });
}
