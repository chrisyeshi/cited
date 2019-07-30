<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-side-icon @click="back">
        <v-icon>arrow_back</v-icon>
      </v-toolbar-side-icon>
      <v-toolbar-title>{{ artLabel }}</v-toolbar-title>
    </v-toolbar>
    <v-list three-line>
      <v-card flat tile>
        <v-card-text class="body-2 font-weight-bold">
          {{ titleText }}
        </v-card-text>
      </v-card>
      <pv-drawer-article-list-tile v-for="art in relatives" :key="art.artId"
        :user-id="currUserId" :coll-id="currCollId" :art-id="art.artId"
        class="my-3" @click="onClickArticle(art.artId)">
      </pv-drawer-article-list-tile>
    </v-list>
  </div>
</template>

<script>
import _ from 'lodash'
import getSampleCollection from './getsamplecollection.js'
import { mapState } from 'vuex'
import PvDrawerArticleListTile from '@/components/PvDrawerArticleListTile.vue'

export default {
  name: 'PvDrawerRelativeListView',
  components: { PvDrawerArticleListTile },
  props: {
    relationProp: String
  },
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId', 'currArtId' ]),
    artLabel () { return `${this.firstAuthorSurname} ${this.year}` },
    authors () { return this.art ? this.art.authors : [] },
    firstAuthorSurname () {
      return this.art && this.art.authors && this.art.authors[0] &&
        this.art.authors[0].surname
    },
    relatives () {
      return this[this.relationProp]
    },
    citedBys () {
      return _.property('citedBys.articles')(this.art) || []
    },
    references () {
      return _.property('references.articles')(this.art) || []
    },
    nCitedBys () { return this.art && this.art.nCitedBys },
    nReferences () { return this.art && this.art.nReferences },
    title () { return this.art && this.art.title },
    titleText () {
      return this.relationProp === 'references'
        ? `References of "${this.title}"`
        : `"${this.title}" is cited by`
    },
    year () { return this.art && this.art.year }
  },
  asyncComputed: {
    art: {
      watch: [ 'userId', 'collId', 'artId' ],
      async get () {
        if (this.currUserId === 'sample') {
          const coll = await getSampleCollection(this.currCollId)
          const flatArtsMap =
            Object.assign(
              {}, ..._.map(coll.articles, art => ({ [art.artId]: art })))
          const flatArt =
            _.find(coll.articles, art => art.artId === this.currArtId)
          const art = {
            ...flatArt,
            references: { articles: [] },
            citedBys: { articles: [] }
          }
          _.forEach(coll.relations, relation => {
            if (relation.referenceId === art.artId) {
              art.citedBys.articles.push(flatArtsMap[relation.citedById])
            } else if (relation.citedById === art.artId) {
              art.references.articles.push(flatArtsMap[relation.referenceId])
            }
          })
          return art
        }
        throw new Error('no backend yet at PvDrawerRelativeListView.vue:art')
      }
    }
  },
  methods: {
    back () {
      this.$router.push({
        name: 'parsevis',
        query: {
          user: this.currUserId,
          coll: this.currCollId,
          art: this.currArtId
        }
      })
      this.$store.commit('parseVis/set', {
        drawerState: { name: 'pv-drawer-article-view' }
      })
    },
    onClickArticle (artId) {
      this.$router.push({
        name: 'parsevis',
        query: { user: this.currUserId, coll: this.currCollId, art: artId }
      })
      this.$store.commit('parseVis/set', {
        currUserId: this.currUserId,
        currCollId: this.currCollId,
        currArtId: artId,
        drawerState: { name: 'pv-drawer-article-view' },
        temporaryArticleIds:
          _.union(this.$store.state.temporaryArticleIds, [ artId ]),
        selectedArticleIds:
          _.union(this.$store.state.selectedArticleIds, [ artId ])
      })
    }
  }
}
</script>
