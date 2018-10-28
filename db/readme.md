## MAG Migrating and Extracting
The sql and python scripts in this folder is for extracting wanted papers from the Microsoft Academic Graph (MAG) dataset.
MAG's database schema and tables info can be found in the mag-schema.sql file.
The files journals.txt and conferences.txt contain the lists of top tier journals and conferences used by the extract-by-venue.py python script.
The extract-references.py script extracts the papers referenced by or cited the top conferences and journal papers.

## AWS RDS and API Server
The extracted data are upload to AWS RDS and can be accessed by a REST API.
Start API server: 
```
node rds-api-server.js
```



