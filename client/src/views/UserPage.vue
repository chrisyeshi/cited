<template>
  <v-app>
    <v-content>
      <v-toolbar clipped-left flat class="app-header">
        <!-- <v-toolbar-side-icon></v-toolbar-side-icon> -->
        <v-toolbar-title>Cited</v-toolbar-title>
        <v-spacer></v-spacer>
        <UserMenu></UserMenu>
      </v-toolbar>
      <v-container
        fluid
        fill-height
      >
        <v-layout row align-top justify-center>
        <CollectionList ref="UserCollections" />
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import CollectionList from '@/components/CollectionList'
import UserMenu from '@/components/UserMenu'
import { users } from '@/firebase/database'

export default {
  name: 'UserPage',
  components: {
    UserMenu,
    CollectionList
  },
  data: () => ({
    user: null,
    activeTab: 'paper',
    localStore: null,
    collection: {
      name: 'Progressive visual analysis',
      description: null
    }
  }),
  mounted () {
    users.getCollections().then(collections => {
      this.$refs.UserCollections.collections = collections
    })
  },
  methods: {
  }
}
</script>

<style scoped>
.hidden {
  display: none;
}

.container {
  max-width: 1280px;
}
</style>
