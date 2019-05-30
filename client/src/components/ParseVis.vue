<template>
  <v-app overflow-hidden>
    <v-toolbar app flat clipped-left>
      <v-toolbar-side-icon v-if="enableToolbarDrawerIcon"
        @click="toggleDrawer()">
      </v-toolbar-side-icon>
      <v-toolbar-title>Discovery Engine</v-toolbar-title>
      <v-text-field flat solo hide-details single-line append-icon="search"
        :append-outer-icon="searchTextFieldOuterIcon" class="mx-3"
        placeholder="search or add local papers" v-model="searchText"
        @click:append="search(searchText)" @keyup.enter="search(searchText)">
      </v-text-field>
      <v-toolbar-items>
        <sign-in-button></sign-in-button>
      </v-toolbar-items>
    </v-toolbar>
    <v-navigation-drawer app floating stateless clipped :width="drawerWidth"
      v-model="isDrawerOpen" style="overflow: visible;">
      <pv-drawer-toggle-button v-model="isDrawerOpen"></pv-drawer-toggle-button>
      <component :is="drawerComponent" style="height: 100%; overflow: auto;">
      </component>
    </v-navigation-drawer>
    <pv-vis-view v-if="isVisViewVisible"
      :collection-article-ids="collectionArticleIds"
      :current-drawer-article-id="currArticleId"
      :isDrawerOpen.sync="isDrawerOpen"
      :drawerPageQuery="pageQuery"
      @add-to-vis="onAddArticleToGraph"
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
        <v-btn flat small slot="activator">toggle graph</v-btn>
        <v-list>
          <v-list-tile @click="loadInSituGraph">
            <v-list-tile-title>in situ</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="clearGraph">clear</v-list-tile>
        </v-list>
      </v-menu>
      <v-btn flat small @click="selectImportCollJsonFile">import</v-btn>
      <v-btn flat small @click="exportCollection">export</v-btn>
    </v-footer>
  </v-app>
</template>

<script>
import _ from 'lodash'
import PvDrawerCollectionList from '@/components/PvDrawerCollectionList.vue'
import PvDrawerCollectionView from '@/components/PvDrawerCollectionView.vue'
import PvDrawerToggleButton from '@/components/PvDrawerToggleButton.vue'
import PvListView from './PvListView.vue'
import PvVisView from './PvVisView.vue'
import SignInButton from './SignInButton.vue'
import theArticlePool from './pvarticlepool.js'
import { AffiliatedAuthor, Article, Paper, Venue, SourceArticle } from './pvmodels.js'
import { mapState } from 'vuex'

export default {
  name: 'ParseVis',
  components: {
    PvDrawerCollectionList,
    PvDrawerCollectionView,
    PvDrawerToggleButton,
    PvListView,
    PvVisView,
    SignInButton
  },
  props: {
    input: String,
    inputUserId: String,
    inputCollId: String,
    inputArtId: String
  },
  data () {
    return {
      collectionArticleIds: [],
      currArticleId: null,
      drawerWidth: 450,
      enableToolbarDrawerIcon: false,
      isDrawerOpen: false,
      pageQuery: null,
      searchText: ''
    }
  },
  computed: {
    ...mapState('parseVis', [
      'articleEditable', 'contentState', 'drawerState'
    ]),
    drawerComponent () {
      switch (this.drawerState) {
        case 'collection-list':
          return 'pv-drawer-collection-list'
        case 'collection-view':
          return 'pv-drawer-collection-view'
      }
      return {
        template: '<div>Unknown Drawer State</div>'
      }
    },
    isVisViewVisible () {
      return this.contentState === 'vis-view'
    },
    isListViewVisible () {
      return this.contentState === 'list-view'
    },
    searchTextFieldOuterIcon () {
      return this.articleEditable ? 'library_add' : ''
    }
  },
  methods: {
    articleEdited (curr) {
      theArticlePool.setArticle(curr)
    },
    clearGraph () {
      this.collectionArticleIds = []
    },
    async exportCollection () {
      const artIds = this.collectionArticleIds
      const srcArts =
        _.map(artIds, artId => theArticlePool.getSourceArticle(artId))
      const relations = []
      _.forEach(srcArts, srcArt => {
        _.forEach(srcArt.article.references, referenceId => {
          relations.push({
            referenceId: referenceId,
            citedById: srcArt.id
          })
        })
      })
      const output = {
        collId: 'in-situ-collection',
        title: 'Collection',
        description: 'Collection Description',
        articles: _.map(srcArts, srcArt => SourceArticle.flatten(srcArt)),
        relations: relations
      }
      const data = JSON.stringify(output, null, 2)
      const blob = new Blob([ data ], { type: 'text/plain' })
      const e = document.createEvent('MouseEvents')
      let a = document.createElement('a')
      a.download = `${output.collId}.json`
      a.href = window.URL.createObjectURL(blob)
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
      e.initEvent(
        'click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false,
        0, null)
      a.dispatchEvent(e)
    },
    importCollection (flatColl) {
      const srcArts =
        _.map(flatColl.articles, art => SourceArticle.fromFlat(art))
      const srcArtMap =
        Object.assign(
          {}, ..._.map(srcArts, srcArt => ({ [srcArt.id]: srcArt })))
      _.forEach(flatColl.relations, ({ referenceId, citedById }) => {
        const srcArt = srcArtMap[citedById]
        srcArt.article.references = srcArt.article.references || []
        srcArt.article.references.push(referenceId)
      })
      _.forEach(srcArts, srcArt => {
        srcArt.sources = { userEdited: Date.now() }
      })
      theArticlePool.setSourceArticles(srcArts)
      this.collectionArticleIds = _.keys(srcArtMap)
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
      this.collectionArticleIds = articleIds
    },
    onAddArticleToGraph (artId) {
      this.collectionArticleIds = _.union(this.collectionArticleIds, [ artId ])
    },
    search (text) {
      this.$router.push(`/demo/${text}`)
    },
    selectImportCollJsonFile (arg) {
      let input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.oninput = () => {
        const file = input.files[0]
        const reader = new FileReader()
        reader.onload = e => {
          const text = e.target.result
          const coll = JSON.parse(text)
          this.importCollection(coll)
        }
        reader.readAsText(file)
      }
      let event = document.createEvent('MouseEvents')
      event.initEvent(
        'click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false,
        0, null)
      input.dispatchEvent(event)
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
    },
    updateInputIds () {
      this.$store.commit('parseVis/set', {
        currUserId: this.inputUserId,
        currCollId: this.inputCollId,
        currArtId: this.inputArtId
      })
    }
  },
  watch: {
    inputUserId: { immediate: true, handler () { this.updateInputIds() } },
    inputCollId: { immediate: true, handler () { this.updateInputIds() } },
    inputArtId: { immediate: true, handler () { this.updateInputIds() } }
  },
  created () {
    if (this.inputUserId && this.inputCollId && !this.inputArtId) {
      this.$store.commit('parseVis/set', { drawerState: 'collection-view' })
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
.drawer-toggle-button {
  position: absolute;
  left: 100%;
  top: 1em;
  background: gainsboro;
  width: 1.5em;
  height: 3.5em;
  line-height: 3.5em;
  border-radius: 0em 0.5em 0.5em 0em;
}
</style>
