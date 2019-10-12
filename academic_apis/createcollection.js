import _ from 'lodash'

export default function createCollection (arts) {
  return {
    articles: _.map(arts, parseArticle),
    relations: createRelations(arts)
  }
}

function createRelations (arts) {
  const relations = []
  _.forEach(arts, citedByArt => {
    _.forEach(citedByArt.references, aRefArt => {
      _.forEach(arts, bRefArt => {
        if (isSameArtHash(aRefArt.artHash, bRefArt.artHash)) {
          relations.push({
            reference: getFirstArtHash(bRefArt),
            citedBy: getFirstArtHash(citedByArt)
          })
        }
      })
    })
  })
  return relations
}

function parseArticle (art) {
  return {
    artHash: getFirstArtHash(art),
    title: _.isArray(art.title) ? art.title[0] : art.title,
    abstract: _.truncate(art.abstract, { length: 280 }),
    year: _.toNumber(art.year),
    firstAuthor: _.first(art.authors),
    venue: art.venue,
    nReference: art.nReference || art.nReferences,
    nCitedBy: art.nCitedBy || art.nCitedBys
  }
}

function getFirstArtHash (art) {
  return _.isArray(art.artHash) ? art.artHash[0] : art.artHash
}

function isSameArtHash (aArtHash, bArtHash) {
  if (_.isNil(aArtHash) || _.isNil(bArtHash)) {
    return false
  }
  return !_.isEmpty(_.intersection(_.concat(aArtHash), _.concat(bArtHash)))
}
