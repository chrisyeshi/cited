import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import query from './apis.js'
import stringSimilarity from 'string-similarity'

const titles = require(path.join(__dirname, process.argv[2]))
let arts = []
try {
  arts = require(path.join(__dirname, process.argv[3] || 'articles.json'))
} catch (err) {
  console.log('failed to open existing file, creating articles array.')
}

run(titles, arts)

async function run (titles, arts) {
  for (let i = 0; i < _.size(titles); ++i) {
    if (isSameTitle(titles[i], _.property('title')(arts[i])) &&
      // !_.isNil(_.property('externs')(arts[i])) &&
      !_.property('error')(arts[i])) {
      continue
    }
    const duration = Math.floor(Math.random() * 5000) + 1000
    console.log(`waiting ${duration} ms to dodge rate limiting`)
    await sleep(duration)
    const title = titles[i]
    try {
      console.log(`processing ${i + 1}/${_.size(titles)}: ${title}`)
      const art = (await query(title)) || { title: title }
      console.log('finished processing with externs', art.externs)
      arts[i] = art
      fs.writeFile(
        process.argv[3] || 'articles.json',
        JSON.stringify(arts, null, 2),
        () => {})
    } catch (err) {
      console.error(err)
      arts[i] = { title: title, error: true }
    }
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isSameTitle (title, existingRawTitle) {
  if (_.isString(existingRawTitle)) {
    return isSameTwoTitle(_.toLower(title), _.toLower(existingRawTitle))
  }
  if (_.isArray(existingRawTitle)) {
    const existingTitles = _.map(existingRawTitle, _.toLower)
    return _.find(existingTitles, existingTitle => {
      return isSameTwoTitle(_.toLower(title), _.toLower(existingTitle))
    })
  }
  return false
}

function isSameTwoTitle (a, b) {
  const percentage =
    stringSimilarity.compareTwoStrings(_.toLower(a), _.toLower(b))
  return percentage > 0.95
}
