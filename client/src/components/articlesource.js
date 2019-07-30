import _ from 'lodash'
import { Article, Paper } from './pvmodels.js'

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
