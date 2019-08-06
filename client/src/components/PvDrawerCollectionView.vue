<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-side-icon @click="back">
        <v-icon>arrow_back</v-icon>
      </v-toolbar-side-icon>
      <v-toolbar-title>{{ collTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-menu offset-y min-width="8em">
          <v-btn flat icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
          <v-list>
            <v-list-tile @click="exportCollection">
              <v-list-tile-title>Export</v-list-tile-title>
            </v-list-tile>
            <v-list-tile @click="deleteCollection">
              <v-list-tile-title>Delete</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </v-toolbar-items>
    </v-toolbar>
    <v-list three-line>
      <v-card flat tile>
        <v-card-text class="body-2 font-weight-thin">
          <expandable-text :text="collDescription"
            :textLimit="descriptionLimit">
          </expandable-text>
        </v-card-text>
      </v-card>
      <pv-drawer-article-list-tile v-for="art in collArts" :key="art.artHash"
        :art="art" class="my-3" @click="onClickArticle(art.artHash)">
      </pv-drawer-article-list-tile>
    </v-list>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import ExpandableText from '@/components/ExpandableText.vue'
import PvDrawerArticleListTile from '@/components/PvDrawerArticleListTile.vue'
import * as firebase from 'firebase/app'
import 'firebase/firestore'

export default {
  name: 'PvDrawerCollectionView',
  components: { ExpandableText, PvDrawerArticleListTile },
  data: () => ({
    descriptionLimit: 200
  }),
  computed: {
    ...mapState('parseVis', [ 'currCollId', 'currColl', 'collVisGraph' ]),
    coll () {
      return this.currColl
    },
    collTitle () {
      return this.coll && this.coll.title
    },
    collDescription () {
      return this.coll && this.coll.description
    },
    collArts () {
      return this.coll && this.coll.articles
    }
  },
  methods: {
    back () {
      this.$store.commit('parseVis/set', {
        drawerState: { name: 'pv-drawer-collection-list' }
      })
    },
    async deleteCollection () {
      if (!confirm('Are you sure you want to delete the collection?')) {
        return
      }
      try {
        await firebase.firestore().doc(`collection/${this.currCollId}`).delete()
      } catch (err) {
        console.log('Error removing collection:', err)
      }
      this.$router.push({ name: 'parsevis' })
      this.$store.dispatch('parseVis/setCurrArt', {
        collId: null, artId: null
      })
    },
    exportCollection () {
      const output = this.coll
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
    onClickArticle (artId) {
      this.$router.push({
        name: 'parsevis',
        query: { coll: this.currCollId, art: artId }
      })
      this.$store.dispatch('parseVis/setCollArt', {
        collId: this.currCollId,
        artId: artId
      })
      this.$store.commit('parseVis/set', {
        temporaryArticleIds:
          _.union(this.$store.state.temporaryArticleIds, [ artId ]),
        selectedArticleIds:
          _.union(this.$store.state.selectedArticleIds, [ artId ])
      })
    }
  }
}
</script>
