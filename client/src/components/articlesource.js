import _ from 'lodash'
import { Article, Paper } from './pvmodels.js'
import gql from 'graphql-tag'

export class ArticleSourceInterface {
  async getMeta (id) { return {} }
  async getReferenceIds (id) { return [] }
  async getCitedByIds (id) { return [] }
}

export class NullArticleSource extends ArticleSourceInterface {
  async getMeta (id) { return {} }
  async getReferenceIds (id) { return [] }
  async getCitedByIds (id) { return [] }
}

export class InMemoryArticleSource extends ArticleSourceInterface {
  constructor (artsMap) {
    super(artsMap)
    this.artsMap = artsMap
  }

  static fromFlatColl (flatColl) {
    const arts = _.map(flatColl.articles, flatArt => {
      return new Article(
        flatArt.artId /* id */,
        flatArt.type/* type */,
        new Paper(
          flatArt.title /* title */,
          flatArt.abstract /* abstract */,
          _.toNumber(flatArt.year) /* year */,
          flatArt.authors /* authors */,
          flatArt.venue || (flatArt.venues && flatArt.venues[0]) /* venue */
        ) /* data */,
        flatArt.nReferences /* nReferences */,
        [] /* references */,
        flatArt.nCitedBys /* nCitedBys */,
        flatArt.externs /* externs */)
    })
    const artsMap = Object.assign({}, ..._.map(arts, art => ({
      [art.id]: art
    })))
    _.forEach(flatColl.relations, relation => {
      artsMap[relation.citedById].references =
        _.union(
          artsMap[relation.citedById].references, [ relation.referenceId ])
      // TODO: this is dirty but whatever...
      artsMap[relation.referenceId].citedBys =
        _.union(artsMap[relation.referenceId].citedBys, [ relation.citedById ])
    })
    return new InMemoryArticleSource(artsMap)
  }

  async getMeta (id) { return this.artsMap[id] }

  async getReferenceIds (id) { return this.artsMap[id].references }

  async getCitedByIds (id) { return this.artsMap[id].citedBys }
}

export class AppsyncMyCollectionArticleSource extends ArticleSourceInterface {
  constructor (client, collId) {
    super()
    this.client = client
    this.collId = collId
  }

  async getMeta (artId) {
    const result = await this.client.query({
      query: gql(GetMyCollectionArticle),
      variables: {
        collId: this.collId,
        artId: artId
      }
    })
    // TODO: error checking
    const flatArt = result.data.getMyCollectionArticle
    return new Article(
      flatArt.artId /* id */,
      flatArt.type /* type */,
      new Paper(
        flatArt.title /* title */,
        flatArt.abstract /* abstract */,
        flatArt.year /* year */,
        flatArt.authors /* authors */,
        flatArt.venues && flatArt.venues[0] /* venue */)/* data */,
      flatArt.nReferences /* nReferences */,
      [] /* references */,
      flatArt.nCitedBys /* nCitedBys */,
      flatArt.externs /* externs */)
  }

  async getReferenceIds (artId) {
    const result = await this.client.query({
      query: gql(GetMyCollectionArticleReferenceIds),
      variables: {
        collId: this.collId,
        artId: artId
      }
    })
    // TODO: error checking
    const flatArt = result.data.getMyCollectionArticle
    return _.map(flatArt.references.articles, art => art.artId)
  }

  async getCitedByIds (artId) {
    const result = await this.client.query({
      query: gql(GetMyCollectionArticleCitedByIds),
      variables: {
        collId: this.collId,
        artId: artId
      }
    })
    // TODO: error checking
    const flatArt = result.data.getMyCollectionArticle
    return _.map(flatArt.citedBys.articles, art => art.artId)
  }
}

const GetMyCollectionArticle = `
  query getMyCollectionArticle($collId: ID!, $artId: ID!) {
    getMyCollectionArticle(collId: $collId, artId: $artId) {
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
      nReferences
      nCitedBys
    }
  }
`

const GetMyCollectionArticleReferenceIds = `
  query getMyCollectionArticle($collId: ID!, $artId: ID!) {
    getMyCollectionArticle(collId: $collId, artId: $artId) {
      references {
        totalCount
        articles {
          artId
        }
        nextToken
      }
    }
  }
`

const GetMyCollectionArticleCitedByIds = `
  query getMyCollectionArticle($collId: ID!, $artId: ID!) {
    getMyCollectionArticle(collId: $collId, artId: $artId) {
      citedBys {
        totalCount
        articles {
          artId
        }
        nextToken
      }
    }
  }
`
