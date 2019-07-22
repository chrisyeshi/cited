<template>
  <landing-page v-if="isLandingPageVisible"></landing-page>
  <v-app v-else overflow-hidden>
    <v-toolbar app flat clipped-left>
      <v-toolbar-title @click="toHome" class="page-title">
        Cited
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <sign-in-button></sign-in-button>
      </v-toolbar-items>
    </v-toolbar>
    <v-navigation-drawer v-if="isDrawerVisible" app stateless clipped
      :width="drawerWidth" v-model="isDrawerOpen" style="overflow: visible;">
      <pv-drawer-toggle-button v-model="isDrawerOpen"></pv-drawer-toggle-button>
      <component :is="drawerState.name" v-bind="drawerState.props"
        style="height: 100%; overflow: auto;">
      </component>
    </v-navigation-drawer>
    <pv-home-collection-list v-if="isHomeViewVisible"></pv-home-collection-list>
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
  </v-app>
</template>

<script>
import _ from 'lodash'
import { Hub } from 'aws-amplify'
import LandingPage from '@/components/LandingPage.vue'
import PvDrawerCollectionList from '@/components/PvDrawerCollectionList.vue'
import PvDrawerCollectionView from '@/components/PvDrawerCollectionView.vue'
import PvDrawerArticleView from '@/components/PvDrawerArticleView.vue'
import PvDrawerRelativeListView from '@/components/PvDrawerRelativeListView.vue'
import PvDrawerToggleButton from '@/components/PvDrawerToggleButton.vue'
import PvHomeCollectionList from '@/components/PvHomeCollectionList.vue'
import PvListView from './PvListView.vue'
import PvVisView from './PvVisView.vue'
import SignInButton from './SignInButton.vue'
import theArticlePool from './pvarticlepool.js'
import { SourceArticle } from './pvmodels.js'
import { mapState } from 'vuex'

export default {
  name: 'ParseVis',
  components: {
    LandingPage,
    PvDrawerArticleView,
    PvDrawerCollectionList,
    PvDrawerCollectionView,
    PvDrawerRelativeListView,
    PvDrawerToggleButton,
    PvHomeCollectionList,
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
  data: () => ({
    collectionArticleIds: [],
    currArticleId: null,
    enableToolbarDrawerIcon: false,
    isDrawerOpen: true,
    isFooterVisible: false,
    isSignedIn: true,
    pageQuery: null,
    searchText: ''
  }),
  computed: {
    ...mapState('parseVis', [
      'articleEditable', 'contentState', 'drawerState'
    ]),
    drawerWidth () {
      if (this.$vuetify.breakpoint.xs) {
        return undefined
      }
      return 450
    },
    isLandingPageVisible () {
      return !this.isSignedIn && !this.inputUserId
    },
    isVisViewVisible () {
      return this.contentState === 'vis-view'
    },
    isListViewVisible () {
      return this.contentState === 'list-view'
    },
    isHomeViewVisible () {
      return this.contentState === 'home-view'
    },
    isDrawerVisible () {
      return this.isListViewVisible || this.isVisViewVisible
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
    onAddArticleToGraph (artId) {
      this.collectionArticleIds = _.union(this.collectionArticleIds, [ artId ])
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
    toHome () {
      this.$router.push({ name: 'parsevis' })
      this.$store.commit('parseVis/reset')
    },
    toVisView () {
      this.$store.commit('parseVis/set', { contentState: 'vis-view' })
    },
    toListView () {
      this.$store.commit('parseVis/set', { contentState: 'list-view' })
    }
  },
  async beforeCreate () {
    this.$Amplify.Auth.currentAuthenticatedUser().then(() => {
      this.isSignedIn = true
    }).catch(error => {
      if (error !== 'not authenticated') {
        console.log(error)
        return
      }
      this.isSignedIn = false
    })
    Hub.listen('auth', data => {
      if (data.payload.event === 'signIn') {
        this.isSignedIn = true
      }
    })
  },
  created () {
    if (this.inputUserId && this.inputCollId && !this.inputArtId) {
      this.$store.commit('parseVis/set', {
        contentState: 'vis-view',
        currUserId: this.inputUserId,
        currCollId: this.inputCollId,
        drawerState: { name: 'pv-drawer-collection-view' }
      })
    } else if (this.inputUserId && this.inputCollId && this.inputArtId) {
      this.$store.commit('parseVis/set', {
        contentState: 'vis-view',
        currUserId: this.inputUserId,
        currCollId: this.inputCollId,
        currArtId: this.inputArtId,
        drawerState: { name: 'pv-drawer-article-view' }
      })
    }
  }
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

.page-title {
  cursor: pointer;
  font-family: 'Lora', serif;
  font-size: 26px;
}
</style>
