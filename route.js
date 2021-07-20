const axios = require('axios')
const exec = require('child_process').exec;
const fs = require('fs')
const shell = require('shelljs')

const MAP_API_KEY = process.env.GRAPHHOPPER_TOKEN
const MAP_ROUTE_URL =  'https://graphhopper.com/api/1/route?type=gpx&calc_points=false&key='+MAP_API_KEY

const download_file = async (file_url, output_path) => {
  const response = await axios.get(file_url)
  fs.writeFileSync(output_path, response.data)
}
const make_animation = (file_name) => {
  const script = shell.exec(`sh animate.sh ${file_name}`);
  if (script.code !== 0) {
    console.error(script.stdout + '\n' + script.stderr)
    throw new Error('file convert has problem.')
  }
  return `files/${file_name}.mp4`
}

const route = async (source_lon, source_lat, dest_lon, dest_lat, mode, ctx) => {
  await ctx.replyWithChatAction('record_video')
  const url = MAP_ROUTE_URL+`&point=${source_lat},${source_lon}&point=${dest_lat},${dest_lon}&vehicle=${mode}`
  const file_path = `${source_lon}${source_lat}${dest_lon}${dest_lat}${mode}${ctx.update.callback_query.from.id}`
  await download_file(url, `files/${file_path}.gpx`)
  const output_path = make_animation(file_path)
  await ctx.replyWithChatAction('upload_video')
  await ctx.replyWithVideo({ source: output_path })
}

module.exports = {
  route_calculator: route,
  download_file,
}
