import axios from 'axios'

const crossref = 'https://api.crossref.org'
const mailto = 'chrisyeshi@gmail.com'
// const hasReferences = 'has-references:true'
// const referenceVisibility = 'reference-visibility:open'
const hasReferences = ''
const referenceVisibility = ''

export function search (text) {
  const url = `${crossref}/works?mailto=${mailto}&filter=${hasReferences},${referenceVisibility}&query=${text}`
  return axios.get(url).then(response => {
    return response.data.message.items.map(unPaper => {
      // TODO: create paper.js and use a constructor function
      const paper = {
        doi: unPaper.DOI,
        title: unPaper.title.join(),
        year: +unPaper.created['date-parts'][0][0],
        citationCount: unPaper['is-referenced-by-count'],
        authors: unPaper.author ? unPaper.author.map(author => author.family).join(' and ') : '',
        references: unPaper.reference ? unPaper.reference.map(ref => ({ doi: ref.DOI })).filter(v => v.doi !== undefined) : []
      }
      return paper
    })
  })
}

export function getPaperByDOI (doi) {
  const url = `${crossref}/works/${doi}?mailto=${mailto}`
  return axios.get(url).then(response => {
    const unPaper = response.data.message
    // TODO: create paper.js and use a constructor function
    const paper = {
      doi: unPaper.DOI,
      title: unPaper.title.join(),
      year: +unPaper.created['date-parts'][0][0],
      citationCount: unPaper['is-referenced-by-count'],
      authors: unPaper.author ? unPaper.author.map(author => author.family).join(' and ') : '',
      references: unPaper.reference ? unPaper.reference.map(ref => ({ doi: ref.DOI })).filter(v => v.doi !== undefined) : []
    }
    return paper
  })
}
