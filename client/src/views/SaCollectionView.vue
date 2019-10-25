<template>
  <v-app overflow-hidden>
    <sa-search-app-bar />
    <pv-app-navigation-drawer />
    <v-content>
      <div style="height: 100%; display: flex; flex-direction: column;">
        <v-toolbar flat style="flex-shrink: 0; flex-grow: 0;">
          <v-toolbar-title>
            <span>References of </span>
            <router-link :to="collLink">{{ currCollTitle }}</router-link>
          </v-toolbar-title>
        </v-toolbar>
        <pv-vis-view style="flex-grow: 1; flex-shrink: 1;" />
      </div>
    </v-content>
  </v-app>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import SaSearchAppBar from '@/components/SaSearchAppBar.vue'
import PvAppNavigationDrawer from '@/components/PvAppNavigationDrawer.vue'
import PvVisView from '@/components/PvVisView.vue'

export default {
  name: 'SaCollectionView',
  components: { SaSearchAppBar, PvAppNavigationDrawer, PvVisView },
  props: {
    collId: String,
    artId: String
  },
  computed: {
    ...mapState('parseVis', [ 'currCollId', 'currColl' ]),
    collLink () {
      return `/coll/${this.currCollId}`
    },
    currCollTitle () {
      return _.property('citedBy.title')(this.currColl)
    }
  },
  methods: {
    fetchData () {
      this.$store.dispatch(
        'parseVis/fetchCollArt', { collId: this.collId, artId: this.artId })
    }
  },
  created () {
    this.fetchData()
  },
  watch: {
    '$route': 'fetchData'
  }
}
</script>
