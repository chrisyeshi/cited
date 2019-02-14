<template>
  <v-content>
    <v-navigation-drawer app floating stateless clipped :width="drawerWidth"
      v-model="isDrawerOpen">
      <v-list>
        <v-list-tile v-for="(paper, index) in papers" :key="index">
          <v-list-tile-title>Paper</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    list
  </v-content>
</template>

<script>
export default {
  name: 'PvListView',
  props: {
    isDrawerOpen: false
  },
  data () {
    return {
      papers: new Array(10),
      drawerWidth: '450',
      drawerState: 'empty'
    }
  },
  computed: {
    isDrawerEmpty () { return this.drawerState === 'empty' }
  }
}
</script>

<style scoped>

</style>
