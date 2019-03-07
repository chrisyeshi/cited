<template>
  <v-app overflow-hidden>
    <v-toolbar app flat clipped-left>
      <v-toolbar-side-icon v-if="enableToolbarDrawerIcon"
        @click="toggleDrawer()">
      </v-toolbar-side-icon>
      <v-toolbar-title>Discovery Engine</v-toolbar-title>
      <v-text-field flat solo hide-details single-line append-icon="search"
        append-outer-icon="library_add" class="mx-3"
        placeholder="search or add local papers" v-model="searchText"
        @click:append="search(searchText)">
      </v-text-field>
      <v-toolbar-items>
        <sign-in-button></sign-in-button>
      </v-toolbar-items>
    </v-toolbar>
    <pv-vis-view v-if="isVisViewVisible" :graph="graph"
      :isDrawerOpen.sync="isDrawerOpen"
      :drawerArticleIdsPromise="searchArticleIdsPromise"
      @article-edited="articleEdited">
    </pv-vis-view>
    <pv-list-view v-if="isListViewVisible" :isDrawerOpen="isDrawerOpen">
    </pv-list-view>
    <v-footer app>
      <span class="px-3 error--text caption">Footer for development only</span>
      <v-btn flat small @click="toggleDrawer">toggle drawer</v-btn>
      <v-btn flat small @click="toVisView">vis view</v-btn>
      <v-btn flat small @click="toListView">list view</v-btn>
      <v-menu offset-y>
        <v-btn flat slot="activator">toggle graph</v-btn>
        <v-list>
          <v-list-tile @click="loadInSituGraph">
            <v-list-tile-title>in situ</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="clearGraph">clear</v-list-tile>
        </v-list>
      </v-menu>
    </v-footer>
  </v-app>
</template>

<script>
import _ from 'lodash'
import PvListView from './PvListView.vue'
import PvVisView from './PvVisView.vue'
import SignInButton from './SignInButton.vue'
import theArticlePool from './pvarticlepool.js'
import { AffiliatedAuthor, Article, Graph, Paper, Venue, SourceArticle } from './pvmodels.js'
import { mapState } from 'vuex'

export default {
  name: 'ParseVis',
  components: {
    PvListView,
    PvVisView,
    SignInButton
  },
  data () {
    return {
      enableToolbarDrawerIcon: false,
      graph: new Graph(),
      isDrawerOpen: false,
      searchArticleIdsPromise: null,
      searchText: ''
    }
  },
  computed: {
    isVisViewVisible () {
      return this.contentState === 'vis-view'
    },
    isListViewVisible () {
      return this.contentState === 'list-view'
    },
    isPaperViewVisible () {
      return this.drawerState === 'paper-view'
    },
    isSearchListVisible () {
      return this.drawerState === 'search-list'
    },
    ...mapState('parseVis', [ 'contentState' ])
  },
  methods: {
    articleEdited (curr, prev) {
      // TODO: create new article object if there is new ones
      _.forEach(curr.references, reference => {
        if (!_.isString(reference)) {
          throw new Error(
            'TODO: create new article object if there is new ones')
        }
      })
      // update the article pool
      theArticlePool.setArticle(curr)
      // update graph
      const graphArticleIds = _.map(this.graph.nodes, node => node.article.id)
      const newArticles =
        _.map(graphArticleIds, id => theArticlePool.getArticle(id))
      this.graph = Graph.fromArticles(newArticles)
    },
    clearGraph () {
      this.graph = new Graph()
    },
    async loadInSituGraph () {
      const data = await import('./insitupdf.json')
      const papers = data.references
      const relations = data.relations
      const articleIds = _.map(papers, createArticleId)
      const articles = createArticles(articleIds, papers, relations)
      const srcArts =
        _.map(
          articles, art => new SourceArticle(art, { userEdited: Date.now() }))
      theArticlePool.setSourceArticles(srcArts)
      this.graph = Graph.fromArticles(articles)
    },
    search (text) {
      this.searchArticleIdsPromise = theArticlePool.query(text)
    },
    trace (value) {
      console.log(value)
      return value
    },
    toggleDrawer () {
      this.isDrawerOpen = !this.isDrawerOpen
    },
    toVisView () {
      this.$store.commit('parseVis/set', { contentState: 'vis-view' })
    },
    toListView () {
      this.$store.commit('parseVis/set', { contentState: 'list-view' })
    }
  }
}

function createArticles (ids, papers, relations) {
  const articles = new Array(ids.length)
  for (let iArticle = 0; iArticle < ids.length; ++iArticle) {
    const refRelations =
      _.filter(relations, relation => relation.citedBy === iArticle)
    const refIndexes = _.map(refRelations, relation => relation.citing)
    const refIds = _.map(refIndexes, index => ids[index])
    const jsonPaper = papers[iArticle]
    const jsonAuthors = _.split(jsonPaper.authors, ', ')
    const authors = _.map(jsonAuthors, createAuthor)
    articles[iArticle] = new Article(
      ids[iArticle] /* id */,
      'paper' /* type */,
      new Paper(
        jsonPaper.title /* title */,
        jsonPaper.abstract /* abstract */,
        jsonPaper.year /* year */,
        authors /* authors */,
        new Venue(jsonPaper.journal) /* venue */),
      refIds.length /* nReferences */,
      refIds /* references */,
      jsonPaper.citationCount /* nCitedBys */)
  }
  return articles
}

function createArticleId (jsonPaper) {
  const jsonAuthors = _.split(jsonPaper.authors, ', ')
  const firstAuthor = createAuthor(jsonAuthors[0])
  return `paper-${firstAuthor.surname}${jsonPaper.year}-hash0008`
}

function createAuthor (text) {
  const tokens = _.split(text, ' ')
  const given = _.first(tokens)
  const surname = _.last(tokens)
  return AffiliatedAuthor.fromName(surname, given, '')
}
</script>

<style scoped>

</style>
