const axios = require('axios')
const http = require('http')
const https = require('https')
const cheerio = require('cheerio')
const fs = require('fs-extra')
const glob = require('glob')
const sharp = require('sharp')
const twemoji = require('twemoji')

const saveDir = 'emojis'
const resizeDir = 'emojis'
const validateDir = 'output'

function download(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename)
    const request = https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close(() => {
          resolve(true)
        })
      })
    }).on('error', async (err) => {
      await fs.remove(filename)
      console.log('Cannot download ' + url + ' as ' + filename)
      resolve(false)
    })
  })
  const file = fs.createWriteStream(filename)
  const request = http.get(url, (response) => response.pipe(file))
}

async function main() {
  await fs.ensureDir(`./${saveDir}`)
  const { data } = await axios('http://emojipedia.org/apple/ios-12.1/')
  const $ = cheerio.load(data)
  const emojis = $('.emoji-grid > li').map((i, el) => {
    let image = $(el).children('a').children('img').attr('src')
    if ($(el).hasClass('lazyparent')) {
      image = $(el).children('a').children('img').attr('data-src')
    }
    return {
      link: $(el).children('a').attr('href').replace('/apple/ios-12.1/', 'http://emojipedia.org/'),
      image,
    }
  }).get()

  let i = 1
  let promise = Promise.resolve()
  emojis.forEach(({ link, image }) => {
    promise = promise.then(() => new Promise(async (resolve, reject) => {
        const { data } = await axios(link)
        const $ = cheerio.load(data)
        const filename = $('h2:contains("Codepoints") + ul > li').map((i, el) => {
          return $(el).text().split('+')[1].toLowerCase()
        }).get().join('-')
        console.log(`Loaded ${link} (${i}/${emojis.length}) [${filename}, ${image}]`)
        let downloaded = false
        while (!downloaded) {
          downloaded = await download(image, `./${saveDir}/${filename}.png`)
        }
        i++
        resolve()
    }))
  })
  promise = promise.then(() => {
    console.log('Process done')
  })
}

async function resize() {
  await fs.ensureDir(`./${resizeDir}`)
  await fs.ensureDir(`./${resizeDir}/output`)
  glob(`./${resizeDir}/*.png`, (err, files) => {
    if (err) {
      return console.log(err)
    }
    let promise = Promise.resolve()
    files.forEach((file) => {
      promise = promise.then(() => new Promise(async (resolve, reject) => {
        await sharp(file).resize(64, 64).toFile(file.replace(`${resizeDir}/`, `${resizeDir}/output/`), (err, info) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      }))
    })
    promise = promise.then(() => console.log('Resize completed'))
  })
}

async function validate() {
  glob(`./${validateDir}/*.png`, async (err, files) => {
    if (err) {
      return console.log(err)
    }
    await fs.remove('./validated')
    await fs.ensureDir('./validated')
    const codePoints = files
      .map((x) => x.match(/\/([0-9a-f-]{2,})\.png/)[1])
      .map((x) => 
        x.split('-')
        .map((hex) => parseInt(hex, 16))
        .map((x) => String.fromCodePoint(x))
        .join('')
      )
    for (let i = 0; i < codePoints.length; i++) {
      const file = files[i]
      const emoji = codePoints[i]
      const parsed = twemoji.parse(emoji)
      if (!parsed.startsWith('<img')) {
        // icon missing
        // do nothing
      } else {
        // final validated
        const renameTo = `./validated/${parsed.match(/\/([0-9a-f-]{2,})\.png/)[1]}.png`
        await fs.copy(file, renameTo)
        console.log(`[${emoji}]: ${file} -> ${renameTo}`)
      }
    }
    console.log('Validate completed')
  })
}

// uncomment below to start scraping
// main()

// uncomment below to resize scrapped images
// resize()

// uncomment below to validate with twemoji
// validate()
