import _ from 'lodash'
import gql from 'graphql-tag'
import { chunkOp } from './appsyncUtil.js'

const batchDeleteLimit = 25

export default async function (client, userId, collId) {
  // get all article ids and reference ids
  const arts = await getAllCollArts(client, userId, collId)
  // get all article relations
  const relations = _.flatten(_.map(arts, art => {
    const artId = art.artId
    const refIds = _.map(art.references.articles, art => art.artId)
    return _.map(refIds, refId => ({
      referenceId: refId,
      citedById: artId
    }))
  }))
  // delete all article relations
  await deleteCollRelations(client, userId, collId, relations)
  // get all article ids
  const artIds = _.map(arts, art => art.artId)
  // delete all articles
  await deleteCollArts(client, userId, collId, artIds)
  // delete the collection
  await deleteColl(client, userId, collId)
}

async function getAllCollArts (client, userId, collId) {
  const GetAllUserCollectionArticles = `
    query getUserCollection($userId: ID!, $collId: ID!) {
      getUserCollection(userId: $userId, collId: $collId) {
        userId
        collId
        articles {
          userId
          collId
          artId
          references {
            articles {
              userId
              collId
              artId
            }
          }
        }
      }
    }
  `
  const result = await client.query({
    query: gql(GetAllUserCollectionArticles),
    variables: {
      userId: userId,
      collId: collId
    }
  })
  return result.data.getUserCollection.articles
}

async function deleteCollRelations (client, userId, collId, relations) {
  const DeleteUserCollectionArticleRelations = `
    mutation deleteUserCollectionArticleRelations($userId: ID!, $collId: ID!, $input: [ArticleRelationInput!]!) {
      deleteUserCollectionArticleRelations(userId: $userId, collId: $collId, input: $input) {
        referenceId
        citedById
      }
    }
  `
  return chunkOp(relations, batchDeleteLimit, async relationChunk => {
    const result = await client.mutate({
      mutation: gql(DeleteUserCollectionArticleRelations),
      variables: {
        userId: userId,
        collId: collId,
        input: relationChunk
      }
    })
    return result.data.deleteUserCollectionArticleRelations
  })
}

async function deleteCollArts (client, userId, collId, artIds) {
  const DeleteUserCollectionArticles = `
    mutation deleteUserCollectionArticles($userId: ID!, $collId: ID!, $artIds: [ID!]!) {
      deleteUserCollectionArticles(userId: $userId, collId: $collId, artIds: $artIds) {
        userId
        collId
        artId
      }
    }
  `
  return chunkOp(artIds, batchDeleteLimit, async artIdChunk => {
    const result = await client.mutate({
      mutation: gql(DeleteUserCollectionArticles),
      variables: {
        userId: userId,
        collId: collId,
        artIds: artIdChunk
      }
    })
    return result.data.deleteUserCollectionArticles
  })
}

async function deleteColl (client, userId, collId) {
  const DeleteUserCollection = `
    mutation deleteUserCollection($userId: ID!, $collId: ID!) {
      deleteUserCollection(userId: $userId, collId: $collId) {
        userId
        collId
      }
    }
  `
  const result = await client.mutate({
    mutation: gql(DeleteUserCollection),
    variables: {
      userId: userId,
      collId: collId
    }
  })
  return result.data.deleteUserCollection
}
