import _ from 'lodash'
import createArtHash from './createarthash.js'
import fs from 'fs'
import readline from 'readline'
import parsePdf from './grobid.js'
import path from 'path'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const pdfPath = process.argv[2]
const pdfFullPath = path.resolve(pdfPath)
parsePdf(pdfFullPath).then(async art => {
  const title = await askDefaultQuestion('title:', art.title)
  const year = _.toNumber(await askDefaultQuestion('year:', art.year))
  const firstAuthorSurname =
    await askDefaultQuestion(
      'first author surname:', _.property('authors[0].surname')(art))
  const artHash = createArtHash(firstAuthorSurname, year, title)
  const newArt = {
    ...art,
    title,
    year,
    artHash
  }
  fs.writeFileSync(
    `${process.argv[3] || '.'}/${newArt.artHash}.json`,
    JSON.stringify(newArt, null, 2))
  rl.close()
}).catch(err => {
  console.error(err)
  rl.close()
})

async function askQuestion (question) {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => {
      resolve(answer)
    })
  })
}

async function askDefaultQuestion (question, defaultAnswer) {
  const answer = await askQuestion(`${question} (${defaultAnswer}) `)
  return answer || defaultAnswer
}
