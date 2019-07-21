import _ from 'lodash'
import createArtHash from './createarthash.js'
import queryArxiv from './arxiv.js'
import queryCrossref from './crossref.js'
import querySemanticScholar, { fromSemanticScholar } from './semanticscholar.js'
import stringSimilarity from 'string-similarity'

export default async function query (title) {
  const [ resCrossref, resArxiv ] = await Promise.all([
    queryCrossref({ query: title, rowsPerPage: 1 }),
    queryArxiv({ searchQuery: title, maxResults: 1 })
  ])
  // crossref
  const titleCrossref = _.property('message.items[0].title[0]')(resCrossref)
  const itemCrossref =
    isSameTitle(titleCrossref, title) &&
    _.property('message.items[0]')(resCrossref)
  // arxiv
  const titleArxiv =
    removeExtraSpaces(_.property('feed.entry[0].title[0]')(resArxiv))
  const itemArxiv =
    isSameTitle(titleArxiv, title) &&
    _.property('feed.entry[0]')(resArxiv)
  // doi
  const doiCrossref = _.property('DOI')(itemCrossref)
  const doiArxiv = _.property('arxiv:doi[0]._')(itemArxiv)
  const doi = doiCrossref || doiArxiv
  // arxivId
  const arxivId =
    _.property('[1]')(_.split(_.property('id[0]')(itemArxiv), /abs\/|v\d/))
  // semantic scholar
  const resSemanticScholar = _.isNil(arxivId) && _.isNil(doi)
    ? null
    : await querySemanticScholar({ arxiv: arxivId, doi: doi })
  const itemSemanticScholar = resSemanticScholar || null
  // merge the results
  return mergeExterns({
    crossref: itemCrossref,
    arxiv: itemArxiv,
    semanticScholar: itemSemanticScholar
  })
}

function mergeExterns ({ arxiv, crossref, semanticScholar }) {
  if (!arxiv && !crossref && !semanticScholar) {
    return null
  }
  const crossrefArt = fromCrossref(crossref)
  const arxivArt = fromArxiv(arxiv)
  const semanticScholarArt = fromSemanticScholar(semanticScholar)
  const externArts = [ arxivArt, semanticScholarArt, crossrefArt ]
  return {
    ...crossrefArt,
    ...arxivArt,
    ...semanticScholarArt,
    artHash: mergeStrs(_.map(externArts, _.property('artHash'))),
    title: mergeStrs(_.map(externArts, _.property('title'))),
    externs: {
      ..._.property('externs')(crossrefArt),
      ..._.property('externs')(arxivArt),
      ..._.property('externs')(semanticScholarArt)
    }
  }
}

function mergeStrs (strs) {
  const uniques = _.filter(_.uniqBy(strs, _.toLower))
  return _.size(uniques) === 1 ? _.head(uniques) : uniques
}

function isSameTitle (a, b) {
  const percentage =
    stringSimilarity.compareTwoStrings(_.toLower(a), _.toLower(b))
  return percentage > 0.95
}

function fromCrossref (crossref) {
  const crossrefAuthors = _.property('author')(crossref)
  const authors = _.isArray(crossrefAuthors) &&
    _.map(crossrefAuthors, author => ({
      surname: _.property('family')(author),
      given: _.property('given')(author)
    }))
  const firstAuthorSurname = _.property('[0].surname')(authors)
  const year = _.property('published-print.date-parts[0][0]')(crossref)
  const title = _.property('title[0]')(crossref)
  return _.pickBy({
    artHash: createArtHash(firstAuthorSurname, year, title),
    externs: _.pickBy({
      doi: _.property('DOI')(crossref)
    }),
    title: title,
    abstract: null,
    year: year,
    authors: authors,
    venue: _.property('event.name')(crossref) &&
      { name: _.property('event.name')(crossref) },
    nReferences: _.property('reference-count')(crossref),
    references: null,
    nCitedBys: _.property('is-referenced-by-count')(crossref),
    citedBys: null
  })
}

function fromArxiv (arxiv) {
  const arxivId =
      _.property('[1]')(_.split(_.property('id[0]')(arxiv), /abs\/|v\d/))
  const doiArxiv = _.property('arxiv:doi[0]._')(arxiv)
  const arxivAuthors = _.property('author')(arxiv)
  const authors = _.isArray(arxivAuthors) &&
    _.map(arxivAuthors, author => fromFullName(author.name[0]))
  const firstAuthorSurname = _.property('[0].surname')(authors)
  const year = new Date(_.property('published[0]')(arxiv)).getFullYear()
  const title = _.property('title[0]')(arxiv)
  return _.pickBy({
    artHash: createArtHash(firstAuthorSurname, year, title),
    externs: _.pickBy({
      arxiv: arxivId,
      doi: doiArxiv
    }),
    title: title,
    abstract: removeExtraSpaces(_.property('summary[0]')(arxiv)),
    year: year,
    authors: authors,
    venue: null,
    nReferences: null,
    references: null,
    nCitedBys: null,
    citedBys: null
  })
}

function removeExtraSpaces (text) {
  return _.trim(_.replace(text, /\s+/g, ' '))
}

function fromFullName (name) {
  const tokens = _.split(name, ' ')
  return {
    surname: _.last(tokens),
    given: _.head(tokens)
  }
}
