import _ from 'lodash'

export class Author {
  constructor (family, given) {
    // TODO: validation
    this.family = family
    this.given = given
  }
}

export class Paper {
  constructor (doi, title, authors, abstract, year,
    citings, nCitings, citedBys, nCitedBys) {
    // TODO: validation
    this.doi = doi
    this.title = title
    this.authors = authors
    this.abstract = abstract
    this.year = year
    this.citings = citings
    this.nCitings = nCitings
    this.citedBys = citedBys
    this.nCitedBys = nCitedBys
  }

  static fromTestJson (testPaper) {
    const doi = ''
    const title = testPaper.title
    const authors =
      _.map(_.split(testPaper.authors, ', '), text => new Author(text, ''))
    const abstract = ''
    const year = testPaper.year
    const citings = []
    const nCitings = 0
    const citedBys = []
    const nCitedBys = testPaper.citationCount
    return new Paper(
      doi /* doi */,
      title /* title */,
      authors /* authors */,
      abstract /* abstract */,
      year /* year */,
      citings /* citings */,
      nCitings /* nCitings */,
      citedBys /* citedBys */,
      nCitedBys /* nCitedBys */)
  }

  static fromCrossref (crossrefPaper) {
    const doi = _.toLower(crossrefPaper.DOI)
    const title = crossrefPaper.title.join()
    const authors = _.map(
      crossrefPaper.author, author => new Author(author.family, author.given))
    const abstract = crossrefPaper.abstract
    const year = _.toNumber(crossrefPaper.created['date-parts'][0][0])
    const citings = _.map(
      crossrefPaper.reference, ref => ({ ...ref, doi: _.toLower(ref.DOI) }))
    const nCitings = citings.length
    const citedBys = _.map(
      _.property('relation.cites')(crossrefPaper),
      cite => ({ ...cite, doi: cite.DOI }))
    const nCitedBys = _.toNumber(crossrefPaper['is-referenced-by-count'])
    return new Paper(
      doi /* doi */,
      title /* title */,
      authors /* authors */,
      abstract /* abstract */,
      year /* year */,
      citings /* citings */,
      nCitings /* nCitings */,
      citedBys /* citedBys */,
      nCitedBys /* nCitedBys */)
  }

  get citedByCount () {
    return _.max([ this.nCitedBys, this.citedBys.length ])
  }

  get citingCount () {
    return _.max([ this.nCitings, this.citings.length ])
  }

  // backward compatibility
  get citationCount () { return this.citedByCount }

  get citedBy () { return this.citedBys }

  get references () { return this.citings }
}
