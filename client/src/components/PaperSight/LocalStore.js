import Dexie from 'dexie'

export default class LocalDb {
  constructor () {
    this.db = new Dexie('PaperDb')
    this.db.version(2).stores({
      collections: '++id, name, paperIds',
      papers: '++id, title, year, authors, venue, citedByCount, references, abstract, keywords',
      authors: '++id, name',
      citations: '++id, from, to',
      venues: '++id, name, type'
    })
  }

  checkIfPaperExist (paper) {
    return this.db.papers.where('title').equalsIgnoreCase(paper.title).count()
  }

  insertPaper (paper) {
    return new Promise((resolve, reject) => {
      return this.db.papers
        .where('title').equalsIgnoreCase(paper.title)
        .toArray()
        .then(matches => {
          if (matches.length === 0) {
            if (Array.isArray(paper.references) && paper.references.length) {
              paper.references.map(ref => {
                return this.addCitation({from: paper.id, to: ref})
              })
            }
            return this.db.papers.add(paper)
          } else {
            resolve(matches[0].id)
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  isAuthorExist (author) {
    return this.db.papers.where('name').equalsIgnoreCase(author.name).count()
  }

  insertAuthor (author) {
    return new Promise((resolve, reject) => {
      return this.db.authors
        .where('name').equalsIgnoreCase(author.name)
        .toArray()
        .then(matches => {
          if (matches.length === 0) {
            return this.db.authors.add(author)
          } else {
            resolve(matches[0].id)
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  addCitation (citation) {
    return new Promise((resolve, reject) => {
      return this.db.citations
        .where({from: citation.from, to: citation.to})
        .toArray()
        .then(matches => {
          if (matches.length === 0) {
            return this.db.citations.add(citation)
          } else {
            resolve(matches[0].id)
          }
        })
        .catch(err => {
          reject(err)
        })
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

  getPapers () {
    return this.db.papers.toArray()
  }

  getPaperById (paperId) {
    return this.db.papers.where('id').equal(paperId).first()
  }
}
