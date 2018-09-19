import axios from 'axios'
import _ from 'lodash'
import { Paper } from './paper.js'

const crossref = 'https://api.crossref.org'
const mailto = 'chrisyeshi@gmail.com'
// const hasReferences = 'has-references:true'
// const referenceVisibility = 'reference-visibility:open'
const hasReferences = ''
const referenceVisibility = ''
const rowsPerPage = 20

// TODO: use an event loop so that rapid user interactions don't fire multiple API calls.

export function search (text, page = 0) {
  const url = `${crossref}/works?mailto=${mailto}&filter=${hasReferences},${referenceVisibility}&rows=${rowsPerPage}&offset=${page * rowsPerPage}&query=${text}`
  return axios.get(url).then(response => {
    const papers = response.data.message.items.map(Paper.fromCrossref)
    return {
      papers: papers,
      totalPapers: response.data.message['total-results']
    }
  })
}

export function getPaperByDOI (doi) {
  // TODO: better validation of DOI
  if (_.isEmpty(doi)) {
    throw new Error('a DOI should not be empty.')
  }
  const url = `${crossref}/works/${doi}?mailto=${mailto}`
  return axios.get(url).then(response => {
    const unPaper = response.data.message
    const paper = Paper.fromCrossref(unPaper)
    return paper
  })
}
