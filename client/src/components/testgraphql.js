import _ from 'lodash'

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
  async signIn (email, password) {
    const mutation = `
      mutation signIn ($email: String!, $password: String!) {
        login (email: $email, password: $password) {
          id
          email
          collections {
            id
            title
            nodes {
              refObj {
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
                citedByCount
              }
              inCollectionReferences
              inCollectionCitedBys
            }
          }
        }
      }
    `
    const res = await request('/api/graphql', mutation, { email, password })
    return res.login
  },

  async logout () {
    const mutation = `
      mutation {
        logout {
          id
        }
      }
    `
    const res = await request('/api/graphql', mutation)
    return res.logout
  },

  async me () {
    const query = `
      query {
        me {
          id
          email
          collections {
            id
            title
            nodes {
              refObj {
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
                citedByCount
              }
              inCollectionReferences
              inCollectionCitedBys
            }
          }
        }
      }
    `
    const res = await request('/api/graphql', query)
    return res.me
  },

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
          citedByCount
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
          ...commonFields
          references {
            ...commonFields
          }
        }
      }

      fragment commonFields on RefObj {
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
        citedByCount
      }
    `
    const res = await request('/api/graphql', query, { id: refObjId })
    return res.refObj
  },

  async getReferences (refObjId, { offset, count }) {
    const query = `
      query getRefObj ($id: String!) {
        refObj (id: $id) {
          ...commonFields
          references {
            ...commonFields
          }
        }
      }

      fragment commonFields on RefObj {
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
        citedByCount
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
          ...commonFields
          citedBys {
            ...commonFields
          }
        }
      }

      fragment commonFields on RefObj {
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
        citedByCount
      }
    `
    const res = await request('/api/graphql', query, { id: refObjId })
    return {
      refObj: res.refObj,
      citedBys: res.refObj.citedBys
    }
  },

  async getCommonRelatives (refObjIds, opt) {
    const query = `
      query getRefObjs ($ids: [String!]!) {
        refObjs (ids: $ids) {
          ...commonFields
          references {
            ...commonFields
          }
          citedBys {
            ...commonFields
          }
        }
      }

      fragment commonFields on RefObj {
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
        citedByCount
      }
    `
    const res = await request('/api/graphql', query, { ids: refObjIds })
    const commonReferences =
      _.intersectionBy(
        ...(_.map(res.refObjs, refObj => refObj.references)),
        refObj => refObj.id)
    const commonCitedBys =
      _.intersectionBy(
        ...(_.map(res.refObjs, refObj => refObj.citedBys)),
        refObj => refObj.id)
    return [ ...commonReferences, ...commonCitedBys ]
  }
}