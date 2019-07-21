Command line scripts to grab paper information from crossref, arxiv, semantic scholar, and grobid.

### Usages:

```
node -r esm process_title.js Sample Paper Title
```

Search crossref and arxiv for the exact same title.

```
node -r esm process_titles.js titles.json
```

Search for titles in a JSON array in the input json file

```
node -r esm query_semantic_scholar.js --arxiv=arxivPaperId --semanticScholar=semanticScholarPaperId --doi=DOI
```

Query semantic scholoar with one of the paper ids for detail paper information.

```
node -r esm create_art_hash.js firstAuthorSurname year Sample Paper Title
```

Creates an article hash with first author surname, year, and paper title.

```
node -r esm process_pdf.js ./paper.pdf
```

Use grobid to parse the input pdf for detailed paper information. Grobid web service has to be running for this to work. Follow (https://grobid.readthedocs.io/en/latest/Install-Grobid/) to install Grobid and run the web service.