const mysql = require('mysql')

class RDS {
  constructor ({
    host = process.env.RDS_HOST,
    user = process.env.RDS_USER,
    password = process.env.RDS_PASSWORD,
    database = process.env.RDS_DATABASE,
    port = process.env.RDS_PORT
  }) {
    this.db = mysql.createConnection({host, user, password, database, port})
  }

  connect () {
    this.db.connect()
    return this.db
  }

  fetch (query) {
    let db = this.db
    return new Promise(function (resolve, reject) {
      db.query(query, function (error, results, fields) {
        if (error) {
          reject(error)
        } else {
          resolve(results, fields)
        }
      })
    })
  }

  getPaper (paperId) {
    return this.fetch(`SELECT * FROM papers WHERE id = ${paperId}`)
  }

  getAuthors (paperHashCodes) {
    let queryString = paperHashCodes.join(', ')
    let query = `SELECT authors.id as author_id, authors.name, paper_authors.paper_id FROM paper_authors
      inner join authors on paper_authors.author_id = authors.id 
      where paper_authors.paper_id in (${queryString});`
    return this.fetch(query)
  }

  getReferences (paperHashCode) {
    return this.fetch(
      `select * from papers where hexcode in (
          select reference_id from paper_references where paper_id = '${paperHashCode}' 
      );`)
  }

  getCitedBys (paperHashCode) {
    return this.fetch(`select * from papers where hexcode in (
        select paper_id from paper_references where reference_id = '${paperHashCode}'
      ) limit 10;`)
  }

  searchPaperByTitle ({text, offset = 0, numResult = 20}) {
    if (text !== undefined) {
      return this.fetch(`SELECT * FROM papers WHERE title LIKE '%${text}%' LIMIT ${offset}, ${numResult};`)
    } else {
      return null
    }
  }
}

module.exports = RDS
