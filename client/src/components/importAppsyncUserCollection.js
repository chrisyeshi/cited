import _ from 'lodash'
import gql from 'graphql-tag'
import { chunkOp } from './appsyncUtil.js'

const batchPutLimit = 25

export default async function (client, flatColl) {
  const userId = flatColl.userId || 'me'
  const collId = flatColl.collId
  if (!collId) {
    throw new Error('collId is required to import a collection')
  }
  const resColl =
    await updateUserCollection(
      client, userId, collId, flatColl.title, flatColl.description)
  if (resColl.collId !== collId) {
    throw new Error(
      `the returned collection ID does not match the input collectionID: ${resColl.collId} vs. ${collId}`)
  }
  const arts =
    await createUserCollectionArticles(client, userId, collId, flatColl.articles)
  const artIds = _.map(arts, art => art.artId)
  const flatArtIds = _.map(flatColl.articles, flatArt => flatArt.artId)
  if (!_.isEqual(_.sortBy(artIds), _.sortBy(flatArtIds))) {
    throw new Error(
      'the returned article IDs do not match the input article IDs')
  }
  await createUserCollectionArticleRelations(
    client, userId, collId, flatColl.relations)
  return resColl
}

async function updateUserCollection (
  client, userId, collId, title, description) {
  const UpdateUserCollection = `
    mutation updateUserCollection($userId: ID!, $collId: ID!, $input: CollectionInput!) {
      updateUserCollection(userId: $userId, collId: $collId, input: $input) {
        userId
        collId
        title
        description
      }
    }
  `
  const result = await client.mutate({
    mutation: gql(UpdateUserCollection),
    variables: {
      userId: userId,
      collId: collId,
      input: {
        title: title,
        description: description
      }
    }
  })
  return result.data.updateUserCollection
}

async function createUserCollectionArticles (client, userId, collId, flatArts) {
  const CreateUserCollectionArticles = `
    mutation createUserCollectionArticles($userId: ID!, $collId: ID!, $input: [UserCollectionArticleInput!]!) {
      createUserCollectionArticles(userId: $userId, collId: $collId, input: $input) {
        userId
        collId
        artId
        type
        title
        abstract
        year
        authors {
          surname
          given
        }
        venues {
          name
        }
      }
    }
  `
  const getArtId = art => {
    if (_.isNil(art.artId)) {
      throw new Error('article has not artId', art)
    }
    return art.artId
  }
  return chunkOp(flatArts, batchPutLimit, async flatArtChunk => {
    const result = await client.mutate({
      mutation: gql(CreateUserCollectionArticles),
      variables: {
        userId: userId,
        collId: collId,
        input: _.map(flatArtChunk, flatArt => ({
          artId: getArtId(flatArt),
          type: flatArt.type,
          title: flatArt.title,
          abstract: flatArt.abstract,
          year: flatArt.year,
          authors: _.map(flatArt.authors, flatAuthor => ({
            surname: flatAuthor.surname,
            given: flatAuthor.given
          })),
          venues: flatArt.venue
            ? [ { name: flatArt.venue.name } ]
            : flatArt.venues,
          nReferences: flatArt.nReferences,
          nCitedBys: flatArt.nCitedBys
        }))
      }
    })
    return result.data.createUserCollectionArticles
  })
}

async function createUserCollectionArticleRelations (
  client, userId, collId, flatRelations) {
  const CreateUserCollectionArticleRelations = `
    mutation createUserCollectionArticleRelations($userId: ID!, $collId: ID!, $input: [ArticleRelationInput!]!) {
      createUserCollectionArticleRelations(userId: $userId, collId: $collId, input: $input) {
        referenceId
        citedById
      }
    }
  `
  return chunkOp(flatRelations, batchPutLimit, async relationChunk => {
    const result = await client.mutate({
      mutation: gql(CreateUserCollectionArticleRelations),
      variables: {
        userId: userId,
        collId: collId,
        input: _.map(relationChunk, flatRelation => ({
          referenceId: flatRelation.referenceId,
          citedById: flatRelation.citedById
        }))
      }
    })
    return result.data.createUserCollectionArticleRelations
  })
}
