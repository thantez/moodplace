const {
  Telegraf,
  Markup,
  Composer,
  Scenes,
  session,
} = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

bot.on('message', async (ctx) => {
  // TODO: steps
})

bot.start(async (ctx) => {
  await ctx.reply(
    'سلام. به این بات خوش آمدید. گزینه مورد نظر را انتخاب فرمایید.',
    Markup.keyboard([
      Markup.button.text('تشخیص احساسات با صوت'),
      Markup.button.text('تشخیص احساسات با پرسشنامه'),
    ])
    .resize()
    .oneTime())
})
 
bot.hears('تشخیص احساسات با پرسشنامه', async (ctx) => {
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
