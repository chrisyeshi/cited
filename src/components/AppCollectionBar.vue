<template>
  <app-bar :fixed="fixed" full-logo>
    <!-- <v-hover>
      <v-text-field
        solo hide-details label="Collection Title"
        slot-scope="{ hover }" :flat="!hover"
        :value="$store.state.collectionTitle">
      </v-text-field>
    </v-hover> -->
  </app-bar>
</template>

<script>
import AppBar from './AppBar.vue'

export default {
  name: 'AppCollectionBar',
  props: {
    fixed: {
      type: Boolean,
      default: false
    }
  },
  components: {
    AppBar
  }
}
</script>

<style scoped>
</style>
