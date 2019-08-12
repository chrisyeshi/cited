import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import createArtHash from './createarthash.js'

const prev =
  require(
    path.join(__dirname, '../client/src/components/in-situ-collection.json'))

const prevArtsMap =
  Object.assign({}, ..._.map(prev.articles, art => ({ [art.artHash]: art })))

const currArtsMap = _.mapValues(prevArtsMap, prevArt => {
  return {
    artHash:
      createArtHash(
        _.property('authors[0].surname')(prevArt), prevArt.year, prevArt.title),
    title: prevArt.title,
    abstract: prevArt.abstract,
    year: prevArt.year,
    authors: prevArt.authors,
    venue: _.property('venues[0]')(prevArt),
    nReferences: prevArt.nReferences,
    nCitedBys: prevArt.nCitedBys
  }
})

console.log(currArtsMap)

const currRelations = _.map(prev.relations, prevRelation => {
  console.log(currArtsMap[prevRelation.reference])
  return {
    reference: currArtsMap[prevRelation.reference].artHash,
    citedBy: currArtsMap[prevRelation.citedBy].artHash
  }
})

const curr = {
  ...prev,
  articles: _.values(currArtsMap),
  relations: currRelations
}

fs.writeFileSync('in-situ-collection.json', JSON.stringify(curr, null, 2))
