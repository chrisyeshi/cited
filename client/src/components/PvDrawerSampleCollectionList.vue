<template>
  <v-list two-line>
    <v-subheader>Sample Collections</v-subheader>
    <v-list-tile v-for="coll in colls" :key="coll.collId"
      :style="getCollTileStyle(coll)"
      @click="navToCollView(coll.collId)">
      <v-list-tile-content>
        <v-list-tile-title>{{ coll.title }}</v-list-tile-title>
        <v-list-tile-sub-title>{{ coll.description }}</v-list-tile-sub-title>
      </v-list-tile-content>
    </v-list-tile>
  </v-list>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'PvDrawerSampleCollectionList',
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId' ])
  },
  data: () => ({
    colls: [
      {
        collId: 'in-situ-collection',
        title: 'In Situ Visualization',
        description: 'In situ visualization means transforming data into visualization without saving the data first.'
      }
    ]
  }),
  methods: {
    getCollTileStyle (coll) {
      const style = {}
      if (this.currUserId === 'sample' && this.currCollId === coll.collId) {
        style.background = '#EBF5FB'
      }
      return style
    },
    navToCollView (collId) {
      this.$router.push(`/demo?user=sample&coll=${collId}`)
      this.$store.commit('parseVis/set', { drawerState: 'collection-view' })
    }
  }
}
</script>
