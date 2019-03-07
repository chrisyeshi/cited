import _ from 'lodash'
import queryArxiv from './arxivwrapper.js'
import { AffiliatedAuthor, Article, Paper, SourceArticle, Venue } from './pvmodels.js'

class ArticlePool {
  constructor (sourceArticles = []) {
    this.sourceArticles = sourceArticles
  }

  get articles () {
    return _.map(this.sourceArticles, srcArt => srcArt.article)
  }

  static createArticleId (type, firstAuthorSurname, year) {
    return `${type}-${_.toLower(firstAuthorSurname)}${year}-${Math.random().toString(36).replace('0.', '').slice(0, 8)}`
  }

  findSourceArticle (externs) {
    for (let provider in externs) {
      const id = externs[provider]
      const srcArt =
        _.find(
          this.sourceArticles,
          srcArt => {
            const providerId = srcArt.article.externs[provider]
            return providerId && id && providerId === id
          })
      if (srcArt) {
        return srcArt
      }
    }
    return null
  }

  getSourceArticle (artId) {
    return _.find(this.sourceArticles, srcArt => srcArt.id === artId)
  }

  getArticle (artId) {
    return this.getSourceArticle(artId).article
  }

  async getMeta (artId) {
    const srcArt = this.getSourceArticle(artId)
    if (srcArt.sources.semanticScholar) {
      return srcArt.article
    }
    const createSourceArticle =
      ({ articleId, entry, refIds, citedByIds, sources }) => {
        const authors =
          _.map(
            entry.authors,
            author => AffiliatedAuthor.fromString(author.name))
        const externs = _.pickBy({
          arxiv: entry.arxivId,
          doi: entry.doi,
          semanticScholar: entry.paperId
        })
        const srcArt = this.findSourceArticle(externs)
        const artId =
          articleId ||
          (srcArt ? srcArt.id : null) ||
          (entry.error
            ? null
            : ArticlePool.createArticleId(
              'paper',
              _.first(authors) ? _.first(authors).surname : 'noauthor',
              entry.year))
        return new SourceArticle(
          new Article(
            artId /* id */,
            'paper' /* type */,
            new Paper(
              entry.title /* title */,
              null /* abstract */,
              entry.year /* year */,
              authors /* authors */,
              entry.venue ? new Venue(entry.venue) : null /* venue */),
            entry.references
              ? entry.references.length
              : null /* nReferences */,
            entry.references ? refIds : null /* references */,
            entry.citations ? entry.citations.length : null /* nCitedBys */,
            entry.citations ? citedByIds : null /* citedBys */,
            externs /* externs */) /* article */,
          sources || {} /* sources */)
      }
    const entry = await querySemanticScholar(srcArt.article.externs)
    const refSrcArts =
      _.map(entry.references, ref => createSourceArticle({ entry: ref }))
    const citedBySrcArts =
      _.map(
        entry.citations, citedBy => createSourceArticle({ entry: citedBy }))
    const newSrcArt = createSourceArticle({
      articleId: artId,
      entry: entry,
      refIds: _.map(refSrcArts, srcArt => srcArt.id),
      citedByIds: _.map(citedBySrcArts, srcArt => srcArt.id),
      sources: { semanticScholar: Date.now() }
    })
    this.sourceArticles =
      ArticlePool.unionSourceArticles(
        this.sourceArticles, [ newSrcArt, ...refSrcArts, ...citedBySrcArts ])
    return this.getArticle(artId)
  }

  async getReferenceIds (artId) {
    const article = await this.getMeta(artId)
    return article.references || []
  }

  async getCitedByIds (artId) {
    const article = await this.getMeta(artId)
    return article.citedBys || []
  }

  includes (artId) {
    return !_.isNil(this.getSourceArticle(artId))
  }

  get metas () {
    return _.map(this.articles, art => {
      const { references, ...meta } = art
      return meta
    })
  }

  async query (text) {
    const arxivRes = await queryArxiv({ searchQuery: text })
    const srcArts =
      await Promise.all(_.map(arxivRes.feed.entry, async arxivEntry => {
        const arxivId = _.split(arxivEntry.id[0], /abs\/|v\d/)[1]
        const authors =
          _.map(
            arxivEntry.author,
            author => AffiliatedAuthor.fromString(author.name[0]))
        const year = (new Date(arxivEntry.published[0])).getFullYear()
        const articleId =
          _.property('id')(this.findSourceArticle({ arxiv: arxivId })) ||
          ArticlePool.createArticleId('paper', authors[0].surname, year)
        return new SourceArticle(
          new Article(
            articleId /* id */,
            'paper' /* type */,
            new Paper(
              arxivEntry.title[0] /* title */,
              arxivEntry.summary[0] /* abstract */,
              year /* year */,
              authors /* authors */,
              null /* venue */),
            null /* nReferences */,
            null /* references */,
            null /* nCitedBys */,
            null /* citedBys */,
            { arxiv: arxivId } /* externs */) /* article */,
          { arxiv: Date.now() } /* sources */)
      }))
    this.sourceArticles =
      ArticlePool.unionSourceArticles(this.sourceArticles, srcArts)
    return _.map(srcArts, srcArt => srcArt.id)
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

  static unionSourceArticles (a, b) {
    const aObj = _.keyBy(a, 'id')
    const bObj = _.keyBy(b, 'id')
    const union = _.mergeWith(aObj, bObj, (x, y) => SourceArticle.merge(x, y))
    return _.values(union)
  }
}

async function querySemanticScholar ({ arxiv, doi, semanticScholar }) {
  const url = 'https://api.semanticscholar.org/v1/paper/'
  const idStr = semanticScholar || arxiv ? `arxiv:${arxiv}` : null || doi
  const res = await fetch(`${url}${idStr}`)
  return res.json()
}

export default new ArticlePool()