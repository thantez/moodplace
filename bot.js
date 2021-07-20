const axios = require('axios')
const fs = require('fs')
const {
  Telegraf,
  Markup,
  session,
} = require('telegraf')
const { route_calculator, download_file } = require('./route')

const BOT_TOKEN = process.env.BOT_TOKEN
const MAP_TOKEN = process.env.MAP_TOKEN
const MAP_BASE_URL = 'https://api.geoapify.com/v2' 
const MAP_PLACE_API = MAP_BASE_URL+'/places?bias=proximity:51.6672222,32.7038826&lang=fa&apiKey='+MAP_TOKEN

const OPTIONS_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('کمی زیاد', 'q5'),
    Markup.button.callback('به شدت', 'q4'),
  ],
  [
    Markup.button.callback('متوسط', 'q3'),
  ],
  [
    Markup.button.callback('خیلی کم یا اصلا', 'q2'),
    Markup.button.callback('کم', 'q1'),
  ],    
])

const questions = [
  ['۱' ,'احساس می‌کنم به چیزی علاقه‌مند شده‌ام 😍.', 1],
  ['۲' ,'پریشان هستم 😰.', -1],
  ['۳' ,'هیجان‌زده هستم 🤩.', 1],
  ['۴' ,'از چیزی ناراحتم 😔.', -1],
  ['۵' ,'احساس قدرت می‌کنم 💪.', 1],
  ['۶' ,'احساس گناه می‌کنم 😞.', -1],
  ['۷' ,'ترسیده‌ام 😱.', -1],
  ['۸' ,'از چیزی متنفرم 🤢.', -1],
  ['۹' ,'برای کاری مشتاق هستم، حس اشتیاق دارم 😃.', 1],
  ['۱۰' ,'احساس غرور می‌کنم 😎.', 1],
  ['۱۱' ,'کج‌خلق و تندخو هستم 😒.', -1],
  ['۱۲' ,'گوش‌به‌زنگم، مراقب هستم 👀.', 1],
  ['۱۳' ,'شرمگینم 😓.', -1],
  ['۱۴' ,'الان طوری هستم که گویی به من الهام شده‌است 😲.', 1],
  ['۱۵' ,'عصبانی هستم، اعصاب ندارم 😡.', -1],
  ['۱۶' ,'عزمی راسخ دارم، مصمم هستم 😌.', 1],
  ['۱۷' ,'نسبت به کاری که می‌کنم مراقب و مواظب هستم 😯.', 1],
  ['۱۸' ,'اضطراب دارم 😥.', -1],
  ['۱۹' ,'پر کار و پر تحرک هستم 🥵.', 1],
  ['۲۰' ,'حس وحشت دارم 😨.', -1],
]

const POSITIVE_PLACES = [
  'education',
  'sport',
  'building.place_of_worship',
  'building.holiday_house',
  'tourism',
  'catering',
  'commercial.food_and_drink',
  'commercial.hobby',
  'commercial.gift_and_souvenir',
]

const MOD_POSITIVE_PLACES = [
  'building.entertainment',
  'entertainment',
  'entertainment.escape_game',
  'entertainment.cinema',
  'entertainment.amusement_arcade',
  'leisure',
  'service.beauty',
  'building.place_of_worship',
  'childcare',
]

const MEDIUM_PLACES = [
  'entertainment.escape_game',
  'entertainment.cinema',
  'entertainment.amusement_arcade',
  'leisure',
  'commercial.shopping_mall',
  'commercial.books',
  'commercial.smoking',
]

const MOD_NEGATIVE_PLACES = [
  'entertainment.museum',
  'entertainment.zoo',
  'entertainment.aquarium',
  'entertainment.water_park',
  'childcare',
  'natural',
  'building.place_of_worship',
  'building.holiday_house',
]

const NEGATIVE_PLACES = [
  'commercial.shopping_mall',
  'commercial.books',
  'commercial.smoking',
  'catering',
  'healthcare.clinic_or_praxis',
  'leisure',
  'natural',
  'heritage',
]

const shuffle = array => {
  return array.sort(() => Math.random() - 0.5);
}

const bot = new Telegraf(BOT_TOKEN)
bot.use(session())

bot.command('start', async (ctx) => {
  ctx.session ?? {
    state: 'init',
  }
  return await ctx.reply(
    'سلام. به ربات پیشنهاد مکان بر اساس احساسات خوش آمدید. لطفا از طریق منوی پایین، گزینه مورد نظر خود را انتخاب فرمایید.',
    Markup.keyboard([
      Markup.button.text('تشخیص احساسات با صوت'),
      Markup.button.text('تشخیص احساسات با پرسشنامه'),
    ])
    .resize()
    .oneTime())
})

bot.command('voices', async (ctx, next) => {
  if (ctx.message.chat.id != '277164073')
    return next()
  const dir = 'files/voices/'
  fs.readdir(dir, async (err, files) => {
    if (err)
      return await ctx.reply('متاسفانه ربات دچار مشکل شده‌است.')
    if (files.length === 0)
      return await ctx.reply('صوتی برای دریافت وجود ندارد.')
    files.forEach(async file => {
      if (file === '.gitkeep')
        return
      const id = file.split('_')[0]
      await ctx.replyWithVoice({ source: dir + file }, { caption: `id: ${id}` })
    });
  });
})
 
bot.hears('تشخیص احساسات با پرسشنامه', async (ctx) => {
  ctx.session = {
    state: 'quiz',
    value: [],
  }
  await ctx.replyWithMarkdown('پرسشنامه زیر بر اساس پرسشنامه خانم [Bridget McHugh](https://ucf.qualtrics.com/jfe/form/SV_836JK0HMArJ74fX?Q_JFE=qdg) تنظیم شده‌است و شامل ۲۰ سوال در مورد احساسات شما می‌شود.')
  await ctx.reply('لطفا احساسات فعلی خود را نسبت به هر یک از مواردی که مشخص شده‌است از طریق دکمه‌های زیر پیام، بیان کنید.', Markup.removeKeyboard())
  return await ctx.reply(`حس ${questions[0][0]}. ${questions[0][1]}`, OPTIONS_KEYBOARD.resize())
})

bot.hears('تشخیص احساسات با صوت', async (ctx) => {
  ctx.session = {
    state: 'voice',
  }
  await ctx.reply('لطفا یک صوت از خود ضبط کنید و برای ربات ارسال کنید. در این صوت کمی راجع به خودتان صحبت کنید.', Markup.removeKeyboard())
  return await ctx.reply('توجه کنید که صوت شما برای پردازش‌های مرتبط با تشخیص احساسات و تقویت الگوریتم‌ها در مراکز داده ما ذخیره خواهد شد.')
})

const question_regex = new RegExp('q.$')
bot.action(question_regex, async (ctx) => {
  const data = ctx.update.callback_query.data
  const point = parseInt(data[1])
  const step_number = ctx.session.value.length + 1
  ctx.session.value.push(point * questions[step_number - 1][2])
  if (step_number > questions.length)
    return
  if (step_number == questions.length) {
    await ctx.deleteMessage()
    const values = ctx.session.value
    const positives = values.filter(v => v > 0).reduce((acc, cv) => acc + cv, 0)
    const negatives = values.filter(v => v < 0).reduce((acc, cv) => acc + cv, 0) * -1
    ctx.session.result = positives - negatives
    const result = (positives - negatives) >= 0? 'خوب' : 'بد'
    await ctx.replyWithPhoto({
        source: 'Thermometer.jpg',
      }, {
        caption: `پرسشنامه تکمیل شد. مجموع امتیازات احساسات مثبت شما برابر با ${positives} و مجموع احساسات منفی شما برابر با ${negatives} است. مطابق با امتیازهای به‌دست‌آمده حال شما ${result} است. بر اساس همین وضعیت این ربات به شما مکان‌هایی را پیشنهاد خواهد داد.`,
      })
   return await ctx.reply('لطفا از طریق ارسال مکان تلگرام، مکان فعلی خود را ارسال کنید تا نزدیک‌ترین مکان‌ها مطابق با وضعیت احساسات شما برایتان ارسال گردد.')
  }
  return await ctx.editMessageText(`حس ${questions[step_number][0]}. ${questions[step_number][1]}`, OPTIONS_KEYBOARD)
})

const map_regex = new RegExp('map_.*$')
bot.action(map_regex, async (ctx) => {
  const data = ctx.update.callback_query.data
  const [_, lon, lat, user_lon, user_lat] = data.split('_')
  const loc = `${lon}_${lat}_${user_lon}_${user_lat}`
  for (const place_message of ctx.session.place_messages){
    await ctx.telegram.deleteMessage(ctx.update.callback_query.from.id, place_message)
  }
  await ctx.reply('مختصات مکان مورد علاقه شما برایتان ارسال شده‌است. علاوه بر مسیریابی ربات، از مسیریابی تلگرام که با استفاده از نقشه‌های گوگل انجام می‌شود هم می‌توانید استفاده کنید. برای اینکار روی نقشه ضربه بزنید.')
  await ctx.replyWithLocation(lat, lon)
  return await ctx.reply(
    'با چه وسیله‌ای مسیریابی انجام شود؟',
    Markup.inlineKeyboard([
      Markup.button.callback('ماشین', `rd_${loc}`),
      Markup.button.callback('دوچرخه', `rb_${loc}`),
      Markup.button.callback('پیاده', `rw_${loc}`),
    ])
  )
})

const route_regex = new RegExp('r._.*$')
bot.action(route_regex, async (ctx) => {
  const data = ctx.update.callback_query.data
  const [route_mode, lon, lat, user_lon, user_lat] = data.split('_')
  const mode = (route_mode == 'rd' ? 'car' : (route_mode == 'rb' ? 'bike' : 'foot'))
  await ctx.reply('در حال مسیریابی... \nممکن است این عملیات کمی طولانی شود. لطفا صبر کنید.')
  return await route_calculator(user_lon, user_lat, lon, lat, mode, ctx)
})

bot.on('location', async (ctx) => {
  try {
    const lat = ctx.message.location.latitude
    const lon = ctx.message.location.longitude
    if (!ctx.session || ctx.session.result === undefined)
      return await ctx.reply('ابتدا باید وضعیت احساسات فعلی شما مشخص شود. برای شروع /start کنید.')
    const result = ctx.session.result
    const places = result > 24 ? POSITIVE_PLACES
      : result <= 24 && result > 8 ? MOD_POSITIVE_PLACES
      : result <= 8 && result > -8 ? MEDIUM_PLACES
      : result <= -8 && result > -24 ? MOD_NEGATIVE_PLACES
      : NEGATIVE_PLACES

    const urls = places.map(place => axios.get(MAP_PLACE_API+`&categories=${place}&filter=circle:${lon},${lat},5500`))
    const res = await axios.all(urls)
    const features = res.map(json => json.data.features)
    const flatten_items = features.flat()
    const clean_items = flatten_items.filter(({ properties }) => properties.name && properties.formatted && properties.street)
    const random_items = shuffle(clean_items)
    const items = random_items.slice(0, 6)
    if (items.length === 0)
      return await ctx.reply('متاسفانه در اطراف شما مکانی مناسب با احساسات فعلیتان وجود ندارد.')
    ctx.session.place_messages = []
    for (const { properties, geometry } of items) {
      const place_lat = geometry.coordinates[1]
      const place_lon = geometry.coordinates[0]
      const loc = await ctx.replyWithLocation(place_lat, place_lon)
      const mes = await ctx.reply(
`${properties.name}
واقع در خیابان ${properties.street}
آدرس کامل: ${properties.formatted}`,
        Markup.inlineKeyboard([
          Markup.button.callback('به این مورد علاقه دارم', `map_${place_lon}_${place_lat}_${lon}_${lat}`),
        ]),
      )
      ctx.session.place_messages.push(loc.message_id)
      ctx.session.place_messages.push(mes.message_id)
    }
    return await ctx.reply('مکان‌های پیشنهادی ارسال شدند. لطفا مکانی که به آن علاقه دارید را انتخاب کنید تا فرایند مسیریابی شروع شود.')
  } catch (err) {
    console.error(err)
    return await ctx.reply('متاسفانه ربات دچار مشکل شده‌است. لطفا در آینده مجددا تلاش فرمایید.')
  }
})

bot.on('voice', async (ctx, next) => {
  if (!ctx.session || ctx.session.state != 'voice')
    return next()
  const chat_id = ctx.from.id
  const file_id = ctx.message.voice.file_id
  const file_uid = (await ctx.telegram.getFile(file_id)).file_unique_id
  const file = await ctx.telegram.getFileLink(file_id)
  const url = file.href
  const voice = await (await axios.get(url, { responseType: "arraybuffer" })).data
  fs.writeFileSync(`files/voices/${chat_id}_${file_uid}.ogg`, voice)
  await ctx.reply('صوت شما دریافت شد.')
  await ctx.reply('در حال حاضر امکان تشخیص احساسات شما بر اساس صوت وجود ندارد. صدای شما برای آماده‌سازی الگوریتم تشخیص احساسات استفاده خواهد شد. پس از آماده‌سازی این بخش به شما اطلاع خواهیم داد.')
  return await ctx.reply('می‌توانید از /start دیگر بخش‌های ربات را مشاهده کنید.')
})

bot.on('message', async (ctx) => {
  return await ctx.reply('پیامی که ارسال کرده‌اید توسط ربات پشتیبانی نمی‌شود. لطفا /start کنید.')
})

bot.catch(async (err, ctx) => {
  console.err(`Ooops, encountered an error for ${ctx.updateType}`, err)
  return await ctx.reply('متاسفانه ربات دچار مشکل شده‌است. لطفا بعدا مجددا تلاش فرمایید.')
})
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
