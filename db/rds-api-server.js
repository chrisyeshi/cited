const express = require('express')
const app = express()
const mysql = require('mysql')

let port = process.env.PORT || 8000
let host = process.env.HOST || 'localhost'

let rds = mysql.createConnection({
  host     : 'localhost',
  user     : 'disco',
  password : 'MakeBestTech:0',
  database : 'disco'
})

rds.connect();

function fetch(query, resolve) {
  rds.query(query, function (error, results, fields) {
    if (error) throw error
    resolve(results)
  });
}

app.get('/search', function(req, res){
  let text = req.query.text
  let offset = req.query.offset || 0
  let numResult = req.query.numResult || 20

  if(text !== undefined) {
    fetch(`SELECT * FROM papers WHERE title LIKE '%${text}%' LIMIT ${offset}, ${numResult};`, (r) => res.json(r))
  } else {
    res.status(404).send('Error in request.');
  }
})

app.get('/paper/:id', function(req, res){
  let paperId = req.params.id
  fetch(`SELECT * FROM papers WHERE id = ${paperId}`, (r) => res.json(r))
})

app.get('/references/:code', function(req, res){
  let paperCode = req.params.code
  fetch(`select * from papers where hexcode in ( select reference_id from paper_references where paper_id = '${paperCode}' );`, (r) => res.json(r))
})

app.get('/citedby/:code', function(req, res){
  let paperCode = req.params.code
  fetch(`select * from papers where hexcode in ( select reference_id from paper_references where reference_id = '${paperCode}' );`, (r) => res.json(r))
})

app.get('/authors', function(req, res){  
  let paperCodes = req.query.codes.split(',')
  let queryString = Array.isArray(paperCodes) ? JSON.stringify(paperCodes).slice(1, -1) : `'${paperCodes}'`
  let query = `SELECT authors.id as author_id, authors.name, paper_authors.paper_id FROM paper_authors
    inner join authors on paper_authors.author_id = authors.id 
    where paper_authors.paper_id in (${queryString});`
    fetch(query, (r) => res.json(r))
})
  

app.listen(port, host, function(){
  console.log('API server started, listening', host, port)
})