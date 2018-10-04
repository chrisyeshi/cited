<template>
  <v-list :two-line="!dense" :one-line="dense" dense>
    <v-subheader v-if="!dense">My Collections</v-subheader>
    <v-divider v-if="!dense"></v-divider>
    <v-list-tile @click="trace">
      <v-list-tile-content>
        <v-list-tile-title>
          <a>information visualization toolkits</a>
        </v-list-tile-title>
        <v-list-tile-sub-title v-if="!dense">Li et al. (2018), Heer et al. (2012), ...</v-list-tile-sub-title>
      </v-list-tile-content>
    </v-list-tile>
    <v-list-tile @click="trace">
      <v-list-tile-content>
        <v-list-tile-title>
          <a>in situ visualization</a>
        </v-list-tile-title>
        <v-list-tile-sub-title v-if="!dense">Ye et al. (2016), Moreland et al. (2010), ...</v-list-tile-sub-title>
      </v-list-tile-content>
    </v-list-tile>
  </v-list>
</template>

<script>
export default {
  name: 'UserCollectionList',
  props: {
    dense: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
