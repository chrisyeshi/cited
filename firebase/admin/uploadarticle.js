import _ from 'lodash'
import admin from 'firebase-admin'

export default async function uploadArticle (inputArt) {
  const artHash = inputArt.artHash
  const art = convertArticle(inputArt)
  return admin.firestore().doc(`articles/${artHash}`).set(art)
}

export function convertArticle (inputArt) {
  return {
    externs: inputArt.externs,
    title: inputArt.title,
    abstract: inputArt.abstract,
    authors: inputArt.authors,
    year: _.toNumber(inputArt.year),
    venue: inputArt.venue,
    nReference: inputArt.nReference || inputArt.nReferences,
    referenceArtHashes: _.map(inputArt.references, art => art.artHash),
    references: _.map(_.take(inputArt.references, 3), getArtMeta),
    nCitedBy: inputArt.nCitedBy || inputArt.nCitedBys,
    citedBys: _.map(_.take(inputArt.citedBys, 3), getArtMeta)
  }
}

function getArtMeta (inputArt) {
  return _.pickBy({
    artHash: inputArt.artHash,
    title: inputArt.title,
    abstract: _.truncate(inputArt.abstract, 280),
    firstAuthor: _.first(inputArt.authors),
    year: _.toNumber(inputArt.year),
    venue: inputArt.venue,
    nReference: inputArt.nReference || inputArt.nReferences,
    nCitedBy: inputArt.nCitedBy || inputArt.nCitedBys
  })
}
