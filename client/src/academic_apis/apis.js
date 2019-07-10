import _ from 'lodash'
import queryArxiv from './arxiv.js'
import queryCrossref from './crossref.js'
import querySemanticScholar from './semanticscholar.js'
import xxhash from 'xxhashjs'

const [ , , ...args ] = process.argv
const title = _.join(args, ' ')
console.log(title)
query(title).then(art => console.log(art))

async function query (title) {
  try {
    const [ resCrossref, resArxiv ] = await Promise.all([
      queryCrossref({ query: title, rowsPerPage: 1 }),
      queryArxiv({ searchQuery: title, maxResults: 1 })
    ])
    // crossref
    const titleCrossref = _.property('message.items[0].title[0]')(resCrossref)
    const itemCrossref =
      _.toLower(titleCrossref) === _.toLower(title) &&
      _.property('message.items[0]')(resCrossref)
    // arxiv
    const titleArxiv =
      removeExtraSpaces(_.property('feed.entry[0].title[0]')(resArxiv))
    const itemArxiv =
      _.toLower(titleArxiv) === _.toLower(title) &&
      _.property('feed.entry[0]')(resArxiv)
    // doi
    const doiCrossref = _.property('DOI')(itemCrossref)
    const doiArxiv = _.property('arxiv:doi[0]._')(itemArxiv)
    const doi = doiCrossref || doiArxiv
    // arxivId
    const arxivId =
      _.property('[1]')(_.split(_.property('id[0]')(itemArxiv), /abs\/|v\d/))
    // semantic scholar
    const resSemanticScholar =
      await querySemanticScholar({ arxiv: arxivId, doi: doi })
    const itemSemanticScholar = resSemanticScholar || null
    // merge the results
    return mergeExterns({
      crossref: itemCrossref,
      arxiv: itemArxiv,
      semanticScholar: itemSemanticScholar
    })
  } catch (err) {
    console.error(err)
  }
}

function mergeExterns ({ arxiv, crossref, semanticScholar }) {
  const crossrefArt = fromCrossref(crossref)
  const arxivArt = fromArxiv(arxiv)
  const semanticScholarArt = fromSemanticScholar(semanticScholar)
  return {
    ...crossrefArt,
    ...arxivArt,
    ...semanticScholarArt,
    externs: {
      ..._.property('externs')(crossrefArt),
      ..._.property('externs')(arxivArt),
      ..._.property('externs')(semanticScholarArt)
    }
  }
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

function fromSemanticScholar (semanticScholar) {
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
    abstract: null,
    year: year,
    authors: authors,
    venue: _.property('venue')(semanticScholar) &&
      { name: _.property('venue')(semanticScholar) },
    nReferences: _.isArray(references) && _.size(references),
    references: _.isArray(references) &&
      _.map(references, fromSemanticScholar),
    nCitedBys: _.isArray(citedBys) && _.size(citedBys),
    citedBys: _.isArray(citedBys) && _.map(citedBys, fromSemanticScholar)
  })
}

function createArtHash (firstAuthorSurname, year, title) {
  if (_.isNil(firstAuthorSurname) || _.isNil(year) || _.isNil(title)) {
    return null
  }
  const seed = 0xC
  const radix = 16
  const hash =
    xxhash.h64(_.toLower(removeExtraSpaces(title)), seed).toString(radix)
  return `${_.toLower(firstAuthorSurname)}-${year}-${hash}`
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
