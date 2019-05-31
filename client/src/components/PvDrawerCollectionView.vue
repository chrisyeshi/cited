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
            <v-list-tile v-if="currUserId !== 'sample'"
              @click="deleteCollection">
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
      <pv-drawer-article-list-tile v-for="art in collArts" :key="art.artId"
        :article="art" class="my-3" @click="onClickArticle(art.artId)">
      </pv-drawer-article-list-tile>
    </v-list>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import {
  serializeSampleCollection, serializeAppsyncUserCollection
} from './serializecollection.js'
import gql from 'graphql-tag'
import deleteUserCollection from './deleteAppsyncUserCollection.js'
import ExpandableText from '@/components/ExpandableText.vue'
import getSampleCollection from './getsamplecollection.js'
import PvDrawerArticleListTile from '@/components/PvDrawerArticleListTile.vue'

export default {
  name: 'PvDrawerCollectionView',
  components: { ExpandableText, PvDrawerArticleListTile },
  data: () => ({
    descriptionLimit: 200
  }),
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId' ]),
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
  asyncComputed: {
    async coll () {
      if (!this.currUserId || !this.currCollId) {
        return null
      }
      if (this.currUserId === 'sample') {
        return getSampleCollection(this.currCollId)
      }
      if (this.currUserId === 'me') {
        const GetMyCollection = `
          query getMyCollection($collId: ID!) {
            getMyCollection(collId: $collId) {
              userId
              collId
              title
              description
              articles {
                artId
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
          }
        `
        const result = await this.$apollo.query({
          query: gql(GetMyCollection),
          variables: {
            collId: this.currCollId
          }
        })
        return result.data.getMyCollection
      }
      throw new Error(
        `invalid userId (${this.currUserId}) and/or` +
        ` collId (${this.currCollId})`)
    }
  },
  methods: {
    back () {
      this.$store.commit('parseVis/set', { drawerState: 'collection-list' })
    },
    async deleteCollection () {
      if (this.currUserId === 'sample') {
        throw new Error(`cannot delete sample collection ${this.currCollId}`)
      }
      await deleteUserCollection(this.$apollo, this.currUserId, this.currCollId)
      this.$router.push(`/demo`)
      this.$store.commit('parseVis/set', { drawerState: 'collection-list' })
    },
    async exportCollection () {
      const output = this.currUserId === 'sample'
        ? serializeSampleCollection(this.coll)
        : await serializeAppsyncUserCollection(
          this.$apollo, this.currUserId, this.currCollId)
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
      this.$router.push(
        `/demo?user=${this.currUserId}&coll=${this.currCollId}&art=${artId}`)
      this.$store.commit('parseVis/set', { drawerState: 'article-view' })
    }
  }
}
</script>
