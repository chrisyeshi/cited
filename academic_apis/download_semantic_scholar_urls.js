import _ from 'lodash'
import cheerio from 'cheerio'
import fs from 'fs'
import puppeteer from 'puppeteer'

(async function () {
  const arts = require(__dirname + '/' + process.argv[2])
  const ssIds = _.map(arts, art => art.externs.semanticScholar)
  const ssUrls = _.map(ssIds, ssId => `https://api.semanticscholar.org/${ssId}`)

  console.log('launching puppeteer')
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  for (let i = 0; i < ssUrls.length; ++i) {
    const duration = Math.floor(Math.random() * 5000) + 1000
    console.log(`waiting ${duration} ms to dodge rate limiting`)
    await sleep(duration)
    console.log(`processing ${i + 1}/${ssUrls.length}: ${arts[i].title}`)
    const url = ssUrls[i]
    await page.goto(url)
    const html = await page.content()
    const $ = cheerio.load(html)
    const abstract = $('[name=description]')[0].attribs.content
    console.log(`abstract: ${abstract}`)
    arts[i].abstract = arts[i].abstract || abstract
    fs.writeFileSync(
      __dirname + '/' + process.argv[2], JSON.stringify(arts, null, 2))
  }

  browser.close()
})()

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
