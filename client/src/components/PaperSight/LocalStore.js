import Dexie from 'dexie'

export default class LocalDb {
  constructor () {
    this.db = new Dexie('PaperDb')
    this.db.version(4).stores({
      collections: '++id, name, paperIds',
      papers: '++id, title, year, authors, venue, citedByCount, references, abstract, keywords',
      authors: '++id, name',
      citations: '[from+to]',
      venues: '++id, name, type'
    })
  }

  getCollections () {
    return this.db.collections.toArray()
  }

  getPapers (paperIds) {
    if (Array.isArray(paperIds)) {
      return this.db.papers.where('id').anyOf(paperIds).toArray()
    } else {
      return this.db.papers.toArray()
    }
  }

  getPaperById (paperId) {
    return this.db.papers.where('id').equals(paperId).first()
  }

  checkIfPaperExist (paper) {
    return this.db.papers.where('title').equalsIgnoreCase(paper.title).count()
  }

  insertPaper (paper) {
    return this.db.papers
      .where('title').equalsIgnoreCase(paper.title)
      .toArray()
      .then(matches => {
        if (matches.length === 0) {
          paper.citedByCount = 1
          return this.db.papers.add(paper)
        } else {
          paper.citedByCount = matches[0].citedByCount + 1
          this.db.papers.update(matches[0].id, paper)
          return new Promise((resolve, reject) => {
            resolve(matches[0].id)
          })
        }
      })
  }

  isAuthorExist (author) {
    return this.db.papers.where('name').equalsIgnoreCase(author.name).count()
  }

  insertAuthor (author) {
    return this.db.authors
      .where('name').equalsIgnoreCase(author.name)
      .toArray()
      .then(matches => {
        if (matches.length === 0) {
          return this.db.authors.add(author)
        } else {
          return new Promise((resolve, reject) => {
            resolve(matches[0])
          })
        }
      })
  }

  addCitation (citation) {
    return this.db.citations
      .where('[from+to]').equals([citation.from, citation.to])
      .toArray()
      .then(matches => {
        if (matches.length === 0) {
          return this.db.citations.add(citation)
        } else {
          return new Promise((resolve, reject) => {
            resolve(matches[0].id)
          })
        }
      })
  }

  getCitations (paperId) {
    return this.db.citations
      .where('to').equal(paperId)
      .toArray()
  }

  getCitedBysCount (paperId) {
    return this.db.citations.where('to').equal(paperId).count()
  }

  setCitedBys (paperId) {
    return this.db.citations
      .where('to').equal(paperId).count()
      .then(count => {
        this.db.papers.where('id').equal(paperId).modify(paper => {
          paper.citedBysCount = count
        })
      })
  }
}
