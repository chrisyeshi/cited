<template>
  <v-list :two-line="!dense" :one-line="dense" dense>
    <v-subheader v-if="!dense">My Collections</v-subheader>
    <v-divider v-if="!dense"></v-divider>
    <v-list-tile
      v-for="(collection, index) in $store.getters.myCollections" :key="index"
      @click="$emit('onCollectionClicked', collection.id)">
      <v-list-tile-action v-if="dense">
        <v-checkbox></v-checkbox>
      </v-list-tile-action>
      <v-list-tile-content>
        <v-list-tile-title>
          <a>{{ collection.title }}</a>
        </v-list-tile-title>
        <v-list-tile-sub-title v-if="!dense">Li et al. (2018), Heer et al. (2012), ...</v-list-tile-sub-title>
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
