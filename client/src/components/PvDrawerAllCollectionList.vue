<template>
  <v-list three-line>
    <v-subheader>All Collections</v-subheader>
    <v-list-item v-for="coll in colls" :key="coll.collId"
      :style="getCollTileStyle(coll)"
      @click="navToCollView(coll.collId)">
      <v-list-item-content>
        <v-list-item-title>{{ coll.title }}</v-list-item-title>
        <v-list-item-subtitle>{{ coll.description }}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import * as firebase from 'firebase/app'
import 'firebase/firestore'

export default {
  name: 'PvDrawerAllCollectionList',
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId' ])
  },
  data: () => ({
    colls: null
  }),
  methods: {
    getCollTileStyle (coll) {
      const style = {}
      if (this.currCollId === coll.collId) {
        style.background = '#EBF5FB'
      }
      return style
    },
    navToCollView (collId) {
      this.$router.push(`/coll/${collId}`)
    }
  },
  async created () {
    const fireColl =
      firebase.firestore().collection('collMetas')
        .orderBy('nArticle', 'desc').limit(10)
    const snapshot = await fireColl.get()
    this.colls = _.map(snapshot.docs, docSnap => ({
      ...docSnap.data(),
      collId: docSnap.id
    }))
  }
}
</script>
