import _ from 'lodash'
import queryArxiv from './arxivwrapper.js'
import { AffiliatedAuthor, Paper, SourceArticle, Venue } from './pvmodels.js'

class ArticlePool {
  constructor (sourceArticles = []) {
    this.sourceArticles = sourceArticles
  }

  static createArticleId (type, firstAuthorSurname, year) {
    return `${type}-${_.toLower(firstAuthorSurname)}${year}-${Math.random().toString(36).replace('0.', '').slice(0, 8)}`
  }

  get articles () {
    return _.map(this.sourceArticles, srcArt => srcArt.article)
  }

  findSourceArticle (externs) {
    return findSourceArticle(this.sourceArticles, externs)
  }

  getSourceArticle (artId) {
    return _.find(this.sourceArticles, srcArt => srcArt.id === artId)
  }

  getArticle (artId) {
    return this.getSourceArticle(artId).article
  }

  insertExternSourceArticle (externSrcArt) {
    const refArtIds =
      externSrcArt.references
        ? _.map(
          externSrcArt.references,
          subExternSrcArt => this.insertExternSourceArticle(subExternSrcArt))
        : null
    const citedByArtIds =
      externSrcArt.citedBys
        ? _.map(
          externSrcArt.citedBys,
          subExternSrcArt => this.insertExternSourceArticle(subExternSrcArt))
        : null
    const existingSrcArt = this.findSourceArticle(externSrcArt.externs)
    let resArtId = null
    if (existingSrcArt) {
      // merge with existing source article
      const srcArt =
        SourceArticle.mergeExtern(
          existingSrcArt, externSrcArt, refArtIds)
      const srcArtIndex = _.indexOf(this.sourceArticles, existingSrcArt)
      this.sourceArticles =
        Object.assign([], this.sourceArticles, { [srcArtIndex]: srcArt })
      resArtId = srcArt.id
    } else {
      // create new source article
      const firstAuthor = _.first(externSrcArt.data.authors)
      const firstAuthorSurname = firstAuthor ? firstAuthor.surname : 'unknown'
      // TODO: create article id in SourceArticle static function
      const artId =
        ArticlePool.createArticleId(
          'paper', firstAuthorSurname, externSrcArt.data.year)
      const srcArt =
        SourceArticle.fromExtern(artId, externSrcArt, refArtIds, citedByArtIds)
      this.sourceArticles = [ ...this.sourceArticles, srcArt ]
      resArtId = srcArt.id
    }
    // add this article as a reference to the citedBy articles
    _.forEach(citedByArtIds, artId => {
      const citedBySrcArt = this.getSourceArticle(artId)
      citedBySrcArt.article.references =
        _.union(citedBySrcArt.article.references, [ resArtId ])
    })
    return resArtId
  }

  insertExternSourceArticles (externSrcArts) {
    return _.map(
      externSrcArts,
      externSrcArt => this.insertExternSourceArticle(externSrcArt))
  }

  async updateSourceArticleWithExterns (artId) {
    const srcArt = this.getSourceArticle(artId)
    const externSrcArt =
      await getExternSourceArticle(srcArt.article.externs, srcArt.sources)
    if (_.isNil(externSrcArt)) {
      return
    }
    this.insertExternSourceArticle(externSrcArt)
  }

  async getMeta (artId) {
    await this.updateSourceArticleWithExterns(artId)
    return this.getArticle(artId)
  }

  async getReferenceIds (artId) {
    await this.updateSourceArticleWithExterns(artId)
    return this.getArticle(artId).references || []
  }

  async getCitedByIds (artId) {
    await this.updateSourceArticleWithExterns(artId)
    const srcArts =
      _.filter(
        this.sourceArticles,
        srcArt => _.includes(srcArt.article.references, artId))
    return _.map(srcArts, srcArt => srcArt.id)
  }

  getPageQuery (text, nArticlesPerPage = 10) {
    const thePool = this
    let iPage = 0
    let totalArticleCount = Math.Infinity
    return new PageQuery({
      async next () {
        const start = iPage * nArticlesPerPage
        const maxResults = nArticlesPerPage
        const arxivRes = await queryArxiv({
          searchQuery: text,
          start: start,
          maxResults: maxResults
        })
        totalArticleCount =
          _.toNumber(arxivRes.feed['opensearch:totalResults'][0]._)
        const externSrcArts =
          _.map(arxivRes.feed.entry, createExternSourceArticleFromArxivEntry)
        const artIds = thePool.insertExternSourceArticles(externSrcArts)
        ++iPage
        return artIds
      },
      isDone () {
        return totalArticleCount !== 0 &&
          iPage * nArticlesPerPage >= totalArticleCount
      },
      isEmpty () { return totalArticleCount === 0 },
      getTotalArticleCount () { return totalArticleCount },
      async start () {
        iPage = 0
        return this.next()
      }
    })
  }

  includes (artId) {
    return !_.isNil(this.getSourceArticle(artId))
  }

  // TODO: need to change this to the new design of article pool, currenly only used in PvArticleCombo.vue for autocompletion
  get metas () {
    throw new Error(
      'TODO: need to change this to the new design of article pool, currenly only used in PvArticleCombo.vue for autocompletion')
  }

  // TODO: need to change this to the new design of article pool, currenly only used in ParseVis.vue after an article is edited
  setArticle (newArt) {
    throw new Error(
      'TODO: need to change this to the new design of article pool, currenly only used in ParseVis.vue after an article is edited')
  }

  setSourceArticles (srcArts) {
    this.sourceArticles = srcArts
  }
}

class ExternSourceArticle {
  constructor (
    sources, type, data, nReferences, references, nCitedBys, citedBys,
    externs) {
    this.sources = sources
    this.type = type
    this.data = data
    this.nReferences = nReferences
    this.references = references
    this.nCitedBys = nCitedBys
    this.citedBys = citedBys
    this.externs = externs
  }

  static merge (...externSrcArts) {
    if (externSrcArts.length === 0) {
      throw new Error('there is not enough source articles to merge')
    }
    if (externSrcArts.length === 1) {
      return _.first(externSrcArts)
    }
    const merged =
      ExternSourceArticle.mergePair(externSrcArts[0], externSrcArts[1])
    return ExternSourceArticle.merge(merged, ..._.slice(externSrcArts, 2))
  }

  static mergePair (a, b) {
    return new ExternSourceArticle(
      _.mergeWith(
        a.sources,
        b.sources,
        (x, y) => Math.max(x || 0, y || 0)) /* sources */,
      a.type || b.type /* type */,
      new Paper(
        a.data.title || b.data.title /* title */,
        a.data.abstract || b.data.abstract /* abstract */,
        a.data.year || b.data.year /* year */,
        a.data.authors || b.data.authors /* authors */,
        a.data.venue || b.data.venue /* venue */) /* data */,
      _.isNil(a.nReferences) && _.isNil(b.nReferences)
        ? null
        : Math.max(a.nReferences, b.nReferences) /* nReferences */,
      _.size(a.references) > _.size(b.references)
        ? a.references
        : b.references /* references */,
      _.isNil(a.nCitedBys) && _.isNil(b.nCitedBys)
        ? null
        : Math.max(a.nCitedBys, b.nCitedBys) /* nCitedBys */,
      _.size(a.citedBys) > _.size(b.citedBys)
        ? a.citedBys
        : b.citedBys /* citedBys */,
      _.merge(a.externs, b.externs) /* externs */)
  }
}

class PageQuery {
  constructor ({ next, isDone, isEmpty, getTotalArticleCount, start }) {
    this.next = next
    this.isDone = isDone
    this.isEmpty = isEmpty
    this.getTotalArticleCount = getTotalArticleCount
    this.start = start
  }
}

function createExternSourceArticleFromArxivEntry (entry) {
  const arxivId = _.split(entry.id[0], /abs\/|v\d/)[1]
  const authors =
    _.map(
      entry.author,
      author => AffiliatedAuthor.fromString(author.name[0]))
  const year = (new Date(entry.published[0])).getFullYear()
  return new ExternSourceArticle(
    { arxiv: Date.now() } /* sources */,
    'paper' /* type */,
    new Paper(
      entry.title[0] /* title */,
      entry.summary[0] /* abstract */,
      year /* year */,
      authors /* authors */,
      null /* venue */),
    null /* nReferences */,
    null /* references */,
    null /* nCitedBys */,
    null /* citedBys */,
    { arxiv: arxivId } /* externs */)
}

function createExternSourceArticleFromSemanticScholarEntry (entry) {
  const authors =
    _.map(
      entry.authors,
      author => AffiliatedAuthor.fromString(author.name))
  const externs = _.pickBy({
    arxiv: entry.arxivId,
    doi: entry.doi,
    semanticScholar: entry.paperId
  })
  return new ExternSourceArticle(
    { semanticScholar: Date.now() } /* sources */,
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
    entry.references
      ? _.map(
        entry.references, createExternSourceArticleFromSemanticScholarEntry)
      : null /* references */,
    entry.citations ? entry.citations.length : null /* nCitedBys */,
    entry.citations
      ? _.map(
        entry.citations, createExternSourceArticleFromSemanticScholarEntry)
      : null /* citedBys */,
    externs /* externs */)
}

function findSourceArticle (srcArts, externs) {
  for (let provider in externs) {
    const id = externs[provider]
    const srcArt = _.find(srcArts, srcArt => {
      const providerId = srcArt.article.externs[provider]
      return providerId && id && providerId === id
    })
    if (srcArt) {
      return srcArt
    }
  }
  return null
}

async function getExternSourceArticle (externs, sources) {
  const externSrcArtsPromises =
    _.filter([
      sources.arxiv ? null : getExternSourceArticleFromArxiv(externs),
      sources.semanticScholar
        ? null
        : getExternSourceArticleFromSemanticScholar(externs)
    ])
  const externSrcArtsPromise = Promise.all(externSrcArtsPromises)
  const externSrcArts = _.filter(await externSrcArtsPromise)
  if (_.isEmpty(externSrcArts)) {
    return null
  }
  const merged = ExternSourceArticle.merge(...externSrcArts)
  return merged
}

async function getExternSourceArticleFromArxiv (externs) {
  if (!externs.arxiv) {
    return null
  }
  const res = await queryArxiv({ idList: [ externs.arxiv ] })
  return createExternSourceArticleFromArxivEntry(res.feed.entry[0])
}

async function getExternSourceArticleFromSemanticScholar (externs) {
  if (!externs.arxiv && !externs.semanticScholar && !externs.doi) {
    return null
  }
  const entry = await querySemanticScholar(externs)
  if (entry.error) {
    return null
  }
  const externSrcArt = createExternSourceArticleFromSemanticScholarEntry(entry)
  return externSrcArt
}

async function querySemanticScholar ({ arxiv, doi, semanticScholar }) {
  const url = 'https://api.semanticscholar.org/v1/paper/'
  const idStr = semanticScholar || arxiv ? `arxiv:${arxiv}` : null || doi
  const res = await fetch(`${url}${idStr}`)
  return res.json()
}

export default new ArticlePool()
