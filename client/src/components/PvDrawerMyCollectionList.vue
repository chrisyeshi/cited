<template>
  <v-progress-circular
    v-if="isLoading" indeterminate class="ma-4" style="width: 100%">
  </v-progress-circular>
  <v-list v-else two-line>
    <v-subheader class="d-flex">
      <span>My Collections</span>
      <v-btn text rounded outlined color="primary" class="ml-auto"
        @click="selectImportCollFile">
        <v-icon left>mdi-plus</v-icon>Import
      </v-btn>
    </v-subheader>
    <v-list-item v-for="coll in myColls" :key="coll.collId"
      :style="getMyCollTileStyle(coll)"
      @click="navigateToCollView(coll.collId)">
      <v-list-item-content>
        <v-list-item-title>{{ coll.title }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ coll.description }}
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <v-btn icon ripple @click.stop="deleteMyColl(coll.collId)">
          <v-icon color="grey lighten-1">mdi-delete-outline</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
  </v-list>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
import AuthMixin from '@/components/authmixin.js'

export default {
  name: 'PvDrawerMyCollectionList',
  mixins: [ AuthMixin ],
  data: () => ({
    myColls: null
  }),
  computed: {
    ...mapState('parseVis', [ 'currCollId' ]),
    isLoading () {
      return this.myColls === null
    }
  },
  methods: {
    async deleteMyColl (collId) {
      if (!confirm('Are you sure you want to delete the collection?')) {
        return
      }
      try {
        await firebase.firestore().doc(`collections/${collId}`).delete()
      } catch (err) {
        console.log('Error removing my collection:', err)
      }
    },
    getMyCollTileStyle (coll) {
      const style = {}
      if (this.currCollId === coll.collId) {
        style.background = '#EBF5FB'
      }
      return style
    },
    async importJsonColl (coll) {
      try {
        await firebase.firestore().collection('collections').add({
          title: coll.title,
          description: coll.description,
          articles: coll.articles,
          relations: coll.relations,
          owner: this.currUser.uid
        })
      } catch (err) {
        console.error('Error adding document: ', err)
      }
    },
    navigateToCollView (collId) {
      this.$router.push(`/coll/${collId}`)
    },
    selectImportCollFile () {
      let input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.oninput = () => {
        const file = input.files[0]
        const reader = new FileReader()
        reader.onload = e => {
          const text = e.target.result
          const coll = JSON.parse(text)
          this.importJsonColl(coll)
        }
        reader.readAsText(file)
      }
      let event = document.createEvent('MouseEvents')
      event.initEvent(
        'click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false,
        0, null)
      input.dispatchEvent(event)
    },
    trace (value) {
      console.log(value)
      return value
    }
  },
  async created () {
    const fireColl = firebase.firestore().collection('collMetas')
    const query = fireColl.where('owner', '==', this.currUser.uid)
    query.onSnapshot(snapshot => {
      this.myColls = _.map(snapshot.docs, docSnap => ({
        ...docSnap.data(),
        collId: docSnap.id
      }))
    })
  }
}
</script>
