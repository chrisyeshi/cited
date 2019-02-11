<template>
  <v-app overflow-hidden>
    <v-toolbar app flat clipped-left>
      <v-toolbar-side-icon @click="isDrawerOpen = !isDrawerOpen"></v-toolbar-side-icon>
      <v-toolbar-title>Discovery Engine</v-toolbar-title>
      <v-text-field flat solo hide-details single-line append-icon="search"
        append-outer-icon="library_add" class="mx-3"
        placeholder="search or add local papers">
      </v-text-field>
      <v-toolbar-items>
        <sign-in-button></sign-in-button>
      </v-toolbar-items>
    </v-toolbar>
    <v-navigation-drawer app floating stateless clipped :width="drawerWidth"
      v-model="isDrawerOpen">
      <v-container>
        <!-- <editable-paper-view v-show="isPaperViewVisible"></editable-paper-view> -->
        <!-- <search-list v-show="isSearchListVisible"></search-list> -->
        <div v-show="isDrawerEmpty">Drawer Empty</div>
      </v-container>
    </v-navigation-drawer>
    <v-content>
      content
    </v-content>
  </v-app>
</template>

<script>
import SignInButton from './SignInButton.vue'

export default {
  name: 'ParseVis',
  components: {
    SignInButton
  },
  data () {
    return {
      isDrawerOpen: false,
      drawerWidth: 450,
      drawerState: 'empty',
      visGraph: null
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  },
  computed: {
    isPaperViewVisible () {
      return this.drawerState === 'paper-view'
    },
    isSearchListVisible () {
      return this.drawerState === 'search-list'
    },
    isDrawerEmpty () {
      return this.drawerState === 'empty'
    }
  }
}
</script>

<style scoped>

</style>
