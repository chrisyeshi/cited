var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app);

var port = process.env.PORT || 8000,
    host = process.env.HOST || 'localhost';

var struct = require('../data/struct');

// Static files
app.use(express.static('../frontend'));
app.use('/data', express.static('../data'));
app.use('/semantic', express.static('../semantic'));
app.use('/npm', express.static('../node_modules'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Load test data
var rawData = fs.readFileSync('../data/papers.csv', 'utf8').split('\n');
rawData.pop();
var data = rawData.map(function(d) {return d.split(','); });
var papers = struct({
    array: data,
    header: [ 'id', 'title', 'year', 'date', 'doi', 'venue', 'journal_id', 'conference_id', 'rank'],
    types: ['string', 'string', 'int', 'string', 'string', 'string', 'string', 'string', 'int']
}).objectArray();


var ref = fs.readFileSync('../data/reference.csv', 'utf8').split('\n');
ref.pop();

var references = struct({
    array: ref.map(function(d) {return d.split(','); }),
    header: ['paper_id', 'reference_id'],
    types: ['string', 'string']
}).objectArray();

app.get('/papers', function(req, res){
    res.json(papers);
});

app.get('/references', function(req, res){
    res.json(references);
});

server.listen(port, host, function(){
    console.log('server started, listening', host, port);
});
