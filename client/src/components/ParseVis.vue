<template>
  <v-app overflow-hidden>
    <v-toolbar app flat clipped-left>
      <v-toolbar-side-icon v-if="enableToolbarDrawerIcon"
        @click="toggleDrawer()">
      </v-toolbar-side-icon>
      <v-toolbar-title>Discovery Engine</v-toolbar-title>
      <v-text-field flat solo hide-details single-line append-icon="search"
        append-outer-icon="library_add" class="mx-3"
        placeholder="search or add local papers">
      </v-text-field>
      <v-toolbar-items>
        <sign-in-button></sign-in-button>
      </v-toolbar-items>
    </v-toolbar>
    <pv-vis-view v-if="isVisViewVisible" :graph="graph"
      :isDrawerOpen.sync="isDrawerOpen">
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
import { Article, AffiliatedAuthor, Graph, Node, Paper, Venue } from './pvmodels.js'
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
      isDrawerOpen: false
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
    clearGraph () {
      this.graph = new Graph()
    },
    async loadInSituGraph () {
      const data = await import('./insitupdf.json')
      const papers = data.references
      const relations = data.relations
      const unlinkedNodes = _.map(papers, createUnlinkedGraphNode)
      const linkedNodes = linkNodes(unlinkedNodes, relations)
      this.graph = new Graph(linkedNodes)
      // this.$http.get('/api/static/insitupdf.json').then(function (res) {
      //   const papers = res.body.references
      //   const relations = res.body.relations
      //   const unlinkedNodes = _.map(papers, createUnlinkedGraphNode)
      //   const linkedNodes = linkNodes(unlinkedNodes, relations)
      //   this.graph = new Graph(linkedNodes)
      // })
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

function createAuthor (text) {
  const tokens = _.split(text, ' ')
  const given = _.first(tokens)
  const surname = _.last(tokens)
  return new AffiliatedAuthor(surname, given, '')
}

function createUnlinkedGraphNode (jsonPaper) {
  const jsonAuthors = _.split(jsonPaper.authors, ', ')
  const authors = _.map(jsonAuthors, createAuthor)
  const article = new Article(
    'paper' /* type */,
    new Paper(
      jsonPaper.title /* title */,
      jsonPaper.abstract /* abstract */,
      jsonPaper.year /* year */,
      authors /* authors */,
      new Venue(jsonPaper.journal) /* venue */),
    0 /* nReferences */,
    [] /* references */,
    jsonPaper.citationCount /* nCitedBys */,
    [] /* citedBys */)
  const node = new Node(article, [], [])
  return node
}

function linkNodes (unlinkedNodes, relatedIndexes) {
  const articles = _.map(unlinkedNodes, node => new Article(
    'paper' /* type */,
    node.article.data /* data */,
    0 /* nReferences */,
    [] /* references */,
    node.article.nCitedBys /* nCitedBys */,
    [] /* citedBys */))
  const nodes = _.map(articles, article => new Node(
    article /* article */,
    [] /* inGraphReferences */,
    [] /* inGraphCitedBys */))
  _.forEach(relatedIndexes, related => {
    const referenceNode = nodes[related.citing]
    const referenceArticle = articles[related.citing]
    const citedByNode = nodes[related.citedBy]
    const citedByArticle = articles[related.citedBy]
    nodes[related.citing].inGraphCitedBys.push(citedByNode)
    articles[related.citing].citedBys.push(citedByArticle)
    nodes[related.citedBy].inGraphReferences.push(referenceNode)
    articles[related.citedBy].references.push(referenceArticle)
  })
  _.forEach(articles, article => {
    article.nReferences = article.references.length
  })
  return nodes
}
</script>

<style scoped>

</style>
