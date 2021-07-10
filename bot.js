const {
  Telegraf,
  Markup,
  Composer,
  Scenes,
  session,
} = require('telegraf')

const OPTIONS_KEYBOARD = Markup.inlineKeyboard([
  Markup.button.callback('به شدت', 'extremely'),
  Markup.button.callback('کمی زیاد', 'quite a bit'),
  Markup.button.callback('متوسط', 'moderately'),
  Markup.button.callback('کم', 'a little'),
  Markup.button.callback('خیلی کم یا کلا به هیچ مقدار', 'zero'),
])

const questions = [
  'q1',
  'q2',
  'q3',
]

const answered_point = point => (ctx, next) => {
  ctx.session.value.push(point)
  const step_number = ctx.session.value.length
  if(step_number == questions.length){
    ctx.deleteMessage()
    return ctx.reply('done')
  }
  // const message_reference = ctx.session.message_id
  ctx.editMessageText(questions[step_number], OPTIONS_KEYBOARD)
  return next()
}

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

bot.command('start', async (ctx) => {
  ctx.session ?? {
    state: 'init',
  }
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
  ctx.session = {
    state: 'quiz',
    value: [],
  }
  const sended_first_question = await ctx.reply(questions[0], OPTIONS_KEYBOARD)
  ctx.session.message_id = sended_first_question.message_id
})


console.log(answered_point(0))
bot.action('extremely', answered_point(5))
bot.action('quite a bit', answered_point(4))
bot.action('moderately', answered_point(3))
bot.action('a little', answered_point(2))
bot.action('zero', answered_point(1))

bot.on('message', async (ctx) => {
  console.log('hoy')
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
