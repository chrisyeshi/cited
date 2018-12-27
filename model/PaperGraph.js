export class Author {
  constructor({id, name}) {
    this.id = id
    this.name = name
  }
}

export class Venue {
  constructor({id, name}) {
    this.id = id
    this.name = name
  }
}

export class Paper {
  constructor(paperObj) {
    Object.assign(this, paperObj)
  }

  validate () {
    let check = this.title.length > 3
      && (Array.isArray(this.authors) && this.authors.length > 0)
    return check
  }
}

export class PaperGraph {
  static entities() {
    return {
      papers: {key: 'title'},
      authors: {key: 'name'},
      venues: {key: 'name'}
    }
  }

  constructor({graph = {papers: [], authors: [], venues: []}}) {
    this.graph = graph
  }

  isValidEntity (entity) {
    return Object.keys(PaperGraph.entities()).indexOf(entity) !== -1
  }
  
  insert (entity, entityItem) {
    let itemId = this.getId(entity, entityItem)
    if (itemId === -1 && this.isValidEntity(entity)) {
      itemId = this.graph[entity].length
      entityItem.id = itemId
      this.graph[entity].push(entityItem)
    }
    return itemId
  }

  insertPaper (paper) {
    let normalizedPaperTitle = paper.title.toLowerCase().normalize()
    let matchedPapers = this.graph.papers.filter( p => p.title.toLowerCase().normalize() == normalizedPaperTitle )
    return (matchedPapers.length) ? matchedPapers[0].id : this.insert('papers', new Paper(paper))
  }

  insertAuthor (author) {
    return this.insert('authors', new Author(author))
  }

  insertVenue (venue) {
    return this.insert('venues', new Venue(venue))
  }

  get (entity) {
    return this.graph[entity]
  }

  getId (entity, newRecord) {
    if (this.isValidEntity (entity)) {
      let keyAttr = PaperGraph.entities()[entity].key
      return this.graph[entity]
        .map(entity => entity[keyAttr])
        .indexOf(newRecord[keyAttr])
    } else {
      return -1
    }
  }

  getAuthorById (authorId) {
    return this.graph.authors.filter((author) => author.id == authorId)[0]
  }

  getPaperById (paperId) {
    return this.graph.papers[paperId]
  }

  getCitedBys (paperId) {
    return this.getPapers().filter( paper => {
      if (Array.isArray(paper.references)) {
        return paper.references.indexOf(paperId) !== -1
      } else {
        return false
      }
    })
  }

  getReferences (paperId) {
    let paper = this.graph.papers[paperId]
    console.log(paper.title, paper.references)
    if (Array.isArray(paper.references)) {
      return paper.references.map(ref => {
        return this.graph.papers[ref]
      })
    } else {
      return []
    }

  }

  getPapers () {
    let papers = this.graph.papers
    for (let paper of papers) {
      if(paper.authors) {
        paper.authors = paper.authors.map((author) => this.getAuthorById(author))
      }
    }
    return papers
  }
}
