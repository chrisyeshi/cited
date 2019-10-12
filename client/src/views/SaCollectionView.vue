<template>
  <v-app overflow-hidden>
    <sa-search-app-bar />
    <pv-app-navigation-drawer />
    <pv-vis-view />
  </v-app>
</template>

<script>
import SaSearchAppBar from '@/components/SaSearchAppBar.vue'
import PvAppNavigationDrawer from '@/components/PvAppNavigationDrawer.vue'
import PvVisView from '@/components/PvVisView.vue'

export default {
  name: 'SaCollectionView',
  components: { SaSearchAppBar, PvAppNavigationDrawer, PvVisView },
  props: {
    ssId: String
  },
  methods: {
    fetchData () {
      this.$store.dispatch('parseVis/fetchSemanticScholar', this.ssId)
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
