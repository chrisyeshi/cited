<template>
  <amplify-connect :query="queryGetAllMyCollections">
    <template slot-scope="{ loading, data, errors }">
      <v-progress-circular v-if="loading" indeterminate class="ma-4"
        style="width: 100%;">
      </v-progress-circular>
      <div v-else-if="errors.length > 0">{{ errors }}</div>
      <v-list v-else-if="data" two-line>
        <v-subheader style="display: flex;">
          <span>My Collections</span>
          <v-btn flat size="1em" color="primary" style="margin-left: auto;"
            @click="selectImportCollJsonFile">
            <v-icon size="1em" class="mr-2">add</v-icon>Import
          </v-btn>
        </v-subheader>
        <v-list-tile v-for="coll in data.getAllMyCollections"
          :key="coll.collId" @click="navigateToCollectionView(coll.collId)"
          :style="getMyCollTileStyle(coll)">
          <v-list-tile-content>
            <v-list-tile-title>{{ coll.title }}</v-list-tile-title>
            <v-list-tile-sub-title>
              {{ coll.description }}
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </template>
  </amplify-connect>
</template>

<script>
import { components as AmplifyComponents } from 'aws-amplify-vue'
import { mapState } from 'vuex'
import importUserCollection from './importAppsyncUserCollection.js'

export default {
  name: 'PvDrawerMyCollectionList',
  components: {
    ...AmplifyComponents
  },
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId' ]),
    queryGetAllMyCollections () {
      return this.$Amplify.graphqlOperation(GetAllMyCollections)
    }
  },
  methods: {
    getMyCollTileStyle (coll) {
      const style = {}
      if (this.currUserId === 'me' && this.currCollId === coll.collId) {
        style.background = '#EBF5FB'
      }
      return style
    },
    async importCollection (flatColl) {
      const coll = await importUserCollection(this.$apollo, flatColl)
      this.navigateToCollectionView(coll.collId)
    },
    navigateToCollectionView (collId) {
      this.$router.push(`/demo?user=me&coll=${collId}`)
      this.$store.commit('parseVis/set', { drawerState: 'collection-view' })
    },
    selectImportCollJsonFile () {
      let input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.oninput = () => {
        const file = input.files[0]
        const reader = new FileReader()
        reader.onload = e => {
          const text = e.target.result
          const coll = JSON.parse(text)
          this.importCollection(coll)
        }
        reader.readAsText(file)
      }
      let event = document.createEvent('MouseEvents')
      event.initEvent(
        'click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false,
        0, null)
      input.dispatchEvent(event)
    }
  }
}

const GetAllMyCollections = `
  query getAllMyCollections {
    getAllMyCollections {
      userId
      collId
      title
      description
    }
  }
`
</script>
