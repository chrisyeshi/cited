import axios from 'axios'

export default async function query ({ arxiv, doi, semanticScholar }) {
  const url = 'https://api.semanticscholar.org/v1/paper/'
  const idStr = semanticScholar || arxiv ? `arxiv:${arxiv}` : null || doi
  const res = await axios.get(`${url}${idStr}`)
  return res.data
}
