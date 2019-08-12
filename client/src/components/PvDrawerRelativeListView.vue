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
      <v-progress-circular
        v-if="isLoading" indeterminate class="ma-4" style="width: 100%" />
      <pv-drawer-article-list-tile
        v-else v-for="art in relatives" :key="art.artHash" :art="art"
        class="my-3" @click="onClickArticle(art.artHash)" />
    </v-list>
  </div>
</template>

<script>
import _ from 'lodash'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { mapState } from 'vuex'
import { VisGraph } from '@/components/visgraph.js'
import PvDrawerArticleListTile from '@/components/PvDrawerArticleListTile.vue'

export default {
  name: 'PvDrawerRelativeListView',
  components: { PvDrawerArticleListTile },
  props: {
    relationProp: String
  },
  data: () => ({
    relatives: null
  }),
  computed: {
    ...mapState('parseVis', [
      'currCollId', 'currVisGraph', 'currArtId', 'currArt'
    ]),
    art () { return this.currArt || this.visGraph.getArt(this.currArtId) },
    artLabel () { return `${this.firstAuthorSurname} ${this.year}` },
    authors () { return this.art ? this.art.authors : [] },
    firstAuthorSurname () {
      return this.art && this.art.authors && this.art.authors[0] &&
        this.art.authors[0].surname
    },
    isLoading () { return this.relatives === null },
    nCitedBys () { return this.art && this.art.nCitedBys && this.art.nCitedBy },
    nReferences () {
      return this.art && this.art.nReferences && this.art.nReference
    },
    title () { return this.art && this.art.title },
    titleText () {
      return this.relationProp === 'references'
        ? `References of "${this.title}"`
        : `"${this.title}" is cited by`
    },
    visGraph () {
      return this.currVisGraph || new VisGraph()
    },
    year () { return this.art && this.art.year }
  },
  watch: {
    art: {
      immediate: true,
      async handler () {
        this.relatives = null
        this.relatives =
          this.relationProp === 'references'
            ? await this.fetchReferences()
            : await this.fetchCitedBys()
      }
    }
  },
  methods: {
    back () {
      this.$router.push(`/coll/${this.currCollId}/${this.currArtId}`)
    },
    async fetchCitedBys () {
      const citedBySnapshot =
        await firebase.firestore().doc(`citedBys/${this.currArtId}`).get()
      const dbCitedByIds =
        citedBySnapshot.exists ? citedBySnapshot.data().artHashes : []
      const dbCitedBys =
        await Promise.all(_.map(dbCitedByIds, async artHash => {
          const snapshot =
            await firebase.firestore().doc(`artMetas/${artHash}`).get()
          return {
            ...snapshot.data(),
            artHash: snapshot.id,
            isMeta: true
          }
        }))
      const cachedCitedBys = this.art.citedBys || []
      const inGraphCitedByIds =
        this.visGraph.getInGraphCitedByIds(this.currArtId)
      const inGraphCitedBys =
        _.map(inGraphCitedByIds, artHash => this.visGraph.getArt(artHash))
      const citedBys =
        _.uniqBy(
          [ ...dbCitedBys, ...cachedCitedBys, ...inGraphCitedBys ],
          art => art.artHash)
      return citedBys
    },
    async fetchReferences () {
      if (this.art.referenceArtHashes) {
        const dbReferences =
          Promise.all(
            _.map(this.art.referenceArtHashes, async artHash => {
              const snapshot =
                firebase.firestore().doc(`/artMetas/${artHash}`).get()
              return snapshot.data()
            }))
        return _.filter(dbReferences)
      }
      const cachedReferences = this.art.references || []
      const inGraphReferenceIds =
        this.visGraph.getInGraphReferenceIds(this.art.artHash)
      const inGraphReferences =
        _.map(inGraphReferenceIds, artHash => this.visGraph.getArt(artHash))
      const references =
        _.uniqBy(
          [ ...cachedReferences, ...inGraphReferences ], art => art.artHash)
      return references
    },
    onClickArticle (artId) {
      this.$router.push(`/coll/${this.currCollId}/${artId}`)
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>
