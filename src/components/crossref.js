import axios from 'axios'

const crossref = 'https://api.crossref.org'
const mailto = 'chrisyeshi@gmail.com'
// const hasReferences = 'has-references:true'
// const referenceVisibility = 'reference-visibility:open'
const hasReferences = ''
const referenceVisibility = ''
const rowsPerPage = 20

export function search (text, page = 0) {
  const url = `${crossref}/works?mailto=${mailto}&filter=${hasReferences},${referenceVisibility}&rows=${rowsPerPage}&offset=${page * rowsPerPage}&query=${text}`
  return axios.get(url).then(response => {
    const papers = response.data.message.items.map(formatPaper)
    return {
      papers: papers,
      totalPapers: response.data.message['total-results']
    }
  })
}

export function getPaperByDOI (doi) {
  const url = `${crossref}/works/${doi}?mailto=${mailto}`
  return axios.get(url).then(response => {
    const unPaper = response.data.message
    const paper = formatPaper(unPaper)
    return paper
  })
}

function formatPaper (crossrefPaper) {
  return {
    doi: crossrefPaper.DOI,
    title: crossrefPaper.title.join(),
    abstract: crossrefPaper.abstract ? crossrefPaper.abstract : '',
    year: +crossrefPaper.created['date-parts'][0][0],
    citationCount: crossrefPaper['is-referenced-by-count'],
    citedBy: !crossrefPaper.relation ? [] : !crossrefPaper.relation.cites ? [] : crossrefPaper.relation.cites,
    authors: formatAuthors(crossrefPaper.author),
    references: crossrefPaper.reference ? crossrefPaper.reference.map(ref => ({ doi: ref.DOI })).filter(v => v.doi !== undefined) : []
  }
}

function formatAuthor (crossrefAuthor) {
  return {
    family: crossrefAuthor.family ? crossrefAuthor.family : '',
    given: crossrefAuthor.given ? crossrefAuthor.given : ''
  }
}

function formatAuthors (crossrefAuthors) {
  const authors = crossrefAuthors ? crossrefAuthors.map(formatAuthor) : []
  return authors.filter(author => {
    if (!author.family && !author.given) {
      return false
    }
    return true
  })
}
