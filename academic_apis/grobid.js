import _ from 'lodash'
import axios from 'axios'
import createArtHash from './createarthash.js'
import FormData from 'form-data'
import fs from 'fs'
import xml2js from 'xml2js'

// workaround for an axios bug
const followRedirects = require('follow-redirects')
followRedirects.maxBodyLength = 500 * 1024 * 1024 * 1024 // 500 GB

export default async function parsePdf (fullPath) {
  let formData = new FormData()
  formData.append('input', fs.createReadStream(fullPath))
  const grobid = 'http://localhost:8070'
  const res =
    await axios.post(`${grobid}/api/processFulltextDocument`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Math.Infinity
    })
  const pdf = await parseXml(res.data)
  const authors = getAuthors(pdf)
  const firstAuthorSurname = _.property('surname')(_.head(authors))
  const year = getYear(pdf)
  const title = getTitle(pdf)
  return _.pickBy({
    artHash: createArtHash(firstAuthorSurname, year, title),
    externs: getExterns(pdf),
    title: title,
    abstract: _.property(
      'TEI.teiHeader[0].profileDesc[0].abstract[0].div[0].p[0]')(pdf),
    year: year,
    authors: authors,
    venue: getVenue(pdf),
    nReferences: getBiblStruct(pdf) && _.size(getBiblStruct(pdf)),
    references: getReferences(pdf),
    nCitedBys: null,
    citedBys: null
  })
}

function getReferences (pdf) {
  const references = _.map(getBiblStruct(pdf), item => {
    const authors = getReferenceAuthors(item)
    const firstAuthorSurname = _.property('surname')(_.head(authors))
    const year = getReferenceYear(item)
    const title = _.property('analytic[0].title[0]._')(item) ||
      _.property('monogr[0].title[0]._')(item)
    return _.pickBy({
      artHash: createArtHash(firstAuthorSurname, year, title),
      externs: null,
      title: title,
      abstract: null,
      year: year,
      authors: authors,
      venue: getReferenceVenue(item),
      nReferences: null,
      references: null,
      nCitedBys: null,
      citedBys: null
    })
  })
  return _.isEmpty(references) ? null : references
}

function getReferenceAuthors (refItem) {
  const authors = _.property('analytic[0].author')(refItem) ||
    _.property('monogr[0].author')(refItem)
  const res = _.map(authors, parseAuthor)
  return _.isEmpty(res) ? null : res
}

function getReferenceVenue (refItem) {
  const name = _.property('monogr[0].title[0]._')(refItem) ||
    _.property('monogr[0].editor[0]')(refItem)
  return name && { name }
}

function getReferenceYear (refItem) {
  const dateText = _.property('monogr[0].imprint[0].date[0].$.when')(refItem)
  return dateText && (new Date(dateText).getFullYear())
}

function getBiblStruct (pdf) {
  const divs = _.property('TEI.text[0].back[0].div')(pdf)
  const div = _.find(divs, div => _.property('$.type')(div) === 'references')
  return _.property('listBibl[0].biblStruct')(div)
}

function getExterns (pdf) {
  const ids = _.property('biblStruct[0].idno')(getSourceDesc(pdf))
  const externs = _.pickBy({
    doi: _.property('_')(_.find(ids, id => _.property('$.type')(id) === 'DOI'))
  })
  return _.isEmpty(externs) ? null : externs
}

function getVenue (pdf) {
  const name =
    _.property('biblStruct[0].monogr[0].title[0]._')(getSourceDesc(pdf))
  return name ? { name } : null
}

function getTitle (pdf) {
  return _.property('title[0]._')(getTitleStmt(pdf)) ||
    _.property('biblStruct[0].analytic[0].title[0]._')(getSourceDesc(pdf))
}

function getTitleStmt (pdf) {
  return _.property('TEI.teiHeader[0].fileDesc[0].titleStmt[0]')(pdf)
}

function getSourceDesc (pdf) {
  return _.property('TEI.teiHeader[0].fileDesc[0].sourceDesc[0]')(pdf)
}

function getAuthors (pdf) {
  const sourceDesc =
    _.property('TEI.teiHeader[0].fileDesc[0].sourceDesc[0]')(pdf)
  const rawAuthors = _.property('biblStruct[0].analytic[0].author')(sourceDesc)
  const authors = _.map(rawAuthors, parseAuthor)
  // console.log(authors)
  return _.uniqBy(authors, author => JSON.stringify(author))
}

function parseAuthor (author) {
  return {
    surname: _.property('persName[0].surname[0]')(author),
    given: _.property('_')(
      _.find(
        _.property('persName[0].forename')(author),
        item => _.property('$.type')(item) === 'first'))
  }
}

function getYear (pdf) {
  const dateText =
    _.property(
      'TEI.teiHeader[0].fileDesc[0].publicationStmt[0].date[0].$.when')(pdf)
  return dateText && (new Date(dateText).getFullYear())
}

async function parseXml (xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, res) => {
      if (err) {
        return reject(err)
      }
      return resolve(res)
    })
  })
}
