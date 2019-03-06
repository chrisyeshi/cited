import _ from 'lodash'
import queryArxiv from './arxivwrapper.js'
import { SourceArticle } from './pvmodels.js'

class ArticlePool {
  constructor (sourceArticles = []) {
    this.sourceArticles = sourceArticles
  }

  get articles () {
    return _.map(this.sourceArticles, srcArt => srcArt.article)
  }

  getSourcedArticle (artId) {
    return _.find(this.sourceArticles, srcArt => srcArt.id === artId)
  }

  getArticle (artId) {
    return this.getSourcedArticle(artId).article
  }

  async getMeta (artId) {
    const { references, ...meta } = this.getArticle(artId)
    return meta
  }

  async getReferenceIds (artId) {
    const { references } = this.getArticle(artId)
    return references
  }

  async getCitedByIds (artId) {
    const citedBySrcArts =
      _.filter(this.sourceArticles, async citedByArticle => {
        return _.includes(
          await this.getReferenceIds(citedByArticle.id),
          refArtIds => _.includes(refArtIds, artId))
      })
    return _.map(citedBySrcArts, srcArt => srcArt.id)
  }

  includes (artId) {
    return !_.isNil(this.getSourcedArticle(artId))
  }

  get metas () {
    return _.map(this.articles, art => {
      const { references, ...meta } = art
      return meta
    })
  }

  async query (text) {
    const arxivRes = await queryArxiv({ searchQuery: text })
    console.log(arxivRes)
    return arxivRes
  }

  setArticle (newArt) {
    if (_.isNil(newArt.id)) {
      throw new Error('TODO: assign new article id')
    }
    const index =
      _.findIndex(this.sourceArticles, srcArt => srcArt.id === newArt.id)
    if (index === -1) {
      const newSrcArt = new SourceArticle(newArt, { userEdited: Date.now() })
      this.sourceArticles = [ ...this.sourceArticles, newSrcArt ]
    } else {
      const oldSrcArt = this.sourceArticles[index]
      const newSrcArt =
        new SourceArticle(
          newArt, { ...oldSrcArt.sources, userEdited: Date.now() })
      this.sourceArticles =
        [ ..._.without(this.sourceArticles, oldSrcArt), newSrcArt ]
    }
  }

  setSourceArticles (srcArts) {
    this.sourceArticles = srcArts
  }
}

export default new ArticlePool()
