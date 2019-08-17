<template>
  <v-app overflow-hidden>
    <pv-app-bar />
    <pv-app-navigation-drawer />
    <pv-vis-view />
  </v-app>
</template>

<script>
import PvAppBar from '@/components/PvAppBar.vue'
import PvAppNavigationDrawer from '@/components/PvAppNavigationDrawer.vue'
import PvVisView from '@/components/PvVisView.vue'

export default {
  name: 'PvCollectionView',
  components: { PvAppBar, PvAppNavigationDrawer, PvVisView },
  props: {
    collId: String,
    artId: String
  },
  data: () => ({}),
  computed: {},
  methods: {
    fetchData () {
      this.$store.dispatch(
        'parseVis/setCollArt',
        { collId: this.collId || null, artId: this.artId || null })
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
