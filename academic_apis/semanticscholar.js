import _ from 'lodash'
import axios from 'axios'
import createArtHash from './createarthash.js'

export default async function query ({ arxiv, doi, semanticScholar }) {
  if (_.isNil(arxiv) && _.isNil(doi) && _.isNil(semanticScholar)) {
    throw new Error('no id provided')
  }
  const url = 'https://api.semanticscholar.org/v1/paper/'
  const idStr = semanticScholar || (arxiv ? `arxiv:${arxiv}` : null) || doi
  try {
    const res = await axios.get(`${url}${idStr}`)
    return res.data
  } catch (err) {
    if (err.response.status === 404) {
      return null
    } else {
      throw err
    }
  }
}

export function fromSemanticScholar (semanticScholar) {
  const semanticScholarAuthors = _.property('authors')(semanticScholar)
  const authors = _.isArray(semanticScholarAuthors) &&
    _.map(semanticScholarAuthors, author => fromFullName(author.name))
  const firstAuthorSurname = _.property('[0].surname')(authors)
  const year = _.toNumber(_.property('year')(semanticScholar))
  const title = _.property('title')(semanticScholar)
  const references = _.property('references')(semanticScholar)
  const citedBys = _.property('citations')(semanticScholar)
  return _.pickBy({
    artHash: createArtHash(firstAuthorSurname, year, title),
    externs: _.pickBy({
      arxiv: _.property('arxivId')(semanticScholar),
      doi: _.property('doi')(semanticScholar),
      semanticScholar: _.property('paperId')(semanticScholar)
    }),
    title: title,
    abstract: _.property('abstract')(semanticScholar),
    year: year,
    authors: authors,
    venue: _.property('venue')(semanticScholar) &&
      { name: _.property('venue')(semanticScholar) },
    nReferences: _.isArray(references) && _.size(references),
    references: _.isArray(references) &&
      _.map(references, fromSemanticScholar),
    nCitedBys: _.isArray(citedBys) && _.size(citedBys),
    citedBys: _.isArray(citedBys) && _.map(citedBys, fromSemanticScholar)
  }, prop => {
    if (_.isBoolean(prop)) {
      return prop
    }
    return !_.isNil(prop)
  })
}

function fromFullName (name) {
  const tokens = _.split(name, ' ')
  return {
    surname: _.last(tokens),
    given: _.head(tokens)
  }
}
