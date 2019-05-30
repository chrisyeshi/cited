import _ from 'lodash'
import gql from 'graphql-tag'

export function serializeSampleCollection (coll) {
  const resColl = _.clone(coll)
  delete resColl.userId
  return resColl
}

export async function serializeAppsyncUserCollection (client, userId, collId) {
  const GetUserCollection = `
    query getUserCollection($userId: ID!, $collId: ID!) {
      getUserCollection(userId: $userId, collId: $collId) {
        userId
        collId
        title
        description
        articles {
          artId
          type
          title
          abstract
          year
          references {
            articles {
              userId
              collId
              artId
            }
          }
          nReferences
          nCitedBys
          authors {
            surname
            given
          }
          venues {
            name
          }
        }
      }
    }
  `
  const result = await client.query({
    query: gql(GetUserCollection),
    variables: {
      userId: userId,
      collId: collId
    }
  })
  const coll = result.data.getUserCollection
  const arts = _.map(coll.articles, art => ({
    artId: art.artId,
    type: art.type,
    title: art.title,
    abstract: art.abstract,
    year: art.year,
    authors: _.map(art.authors, author => ({
      surname: author.surname,
      given: author.given
    })),
    venues: _.map(art.venues, venue => ({
      name: venue.name
    })),
    nReferences: art.nReferences,
    nCitedBys: art.nCitedBys
  }))
  const relations = _.flatten(_.map(coll.articles, art => {
    return _.map(art.references.articles, ref => {
      return { referenceId: ref.artId, citedById: art.artId }
    })
  }))
  const output = {
    collId: coll.collId,
    title: coll.title,
    description: coll.description,
    articles: arts,
    relations: relations
  }
  return output
}
