async function request (uri, query, variables) {
  const res = await fetch(uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query, variables: variables })
  })
  const json = await res.json()
  return json.data
}

export default {
  async searchRefObjs (text, { offset, count }) {
    const query = `
      query getSearch ($text: String!) {
        search (text: $text) {
          id
          title
          authors {
            family
            given
          }
          abstract
          venue {
            name
          }
          year
          referenceCount
          references { id }
          citedByCount
          citedBys { id }
        }
      }
    `
    const res = await request('/api/graphql', query, { text })
    return res.search
  },

  async getRefObj (refObjId) {
    const query = `
      query getRefObj ($id: String!) {
        refObj (id: $id) {
          id
          title
          authors {
            family
            given
          }
          abstract
          venue {
            name
          }
          year
          referenceCount
          references {
            id
            title
            authors {
              family
              given
            }
            abstract
            venue {
              name
            }
            year
            referenceCount
            references { id }
            citedByCount
            citedBys { id }
          }
          citedByCount
          citedBys { id }
        }
      }
    `
    const res = await request('/api/graphql', query, { id: refObjId })
    return res.refObj
  },

  async getReferences (refObjId, { offset, count }) {
    const query = `
      query getRefObj ($id: String!) {
        refObj (id: $id) {
          id
          title
          authors {
            family
            given
          }
          abstract
          venue {
            name
          }
          year
          referenceCount
          references {
            id
            title
            authors {
              family
              given
            }
            abstract
            venue {
              name
            }
            year
            referenceCount
            references { id }
            citedByCount
            citedBys { id }
          }
          citedByCount
          citedBys { id }
        }
      }
    `
    const res = await request('/api/graphql', query, { id: refObjId })
    return {
      refObj: res.refObj,
      references: res.refObj.references
    }
  },

  async getCitedBys (refObjId, { offset, count }) {
    const query = `
      query getRefObj ($id: String!) {
        refObj (id: $id) {
          id
          title
          authors {
            family
            given
          }
          abstract
          venue {
            name
          }
          year
          referenceCount
          references { id }
          citedByCount
          citedBys {
            id
            title
            authors {
              family
              given
            }
            abstract
            venue {
              name
            }
            year
            referenceCount
            references { id }
            citedByCount
            citedBys { id }
          }
        }
      }
    `
    const res = await request('/api/graphql', query, { id: refObjId })
    return {
      refObj: res.refObj,
      citedBys: res.refObj.citedBys
    }
  },

  async getCommonRelatives (refObjIds, opt) {
    return Promise.resolve()
  }
}
