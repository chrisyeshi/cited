<template>
  <v-app>
    <v-app-bar app clipped-left flat color="#f5f5f5" class="app-header">
      <v-toolbar-title>Cited</v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <UserMenu />
      </v-toolbar-items>
    </v-app-bar>
    <v-content>
      <CollectionList ref="UserCollections" />
    </v-content>
  </v-app>
</template>

<script>
import AuthMixin from '@/components/authmixin'
import CollectionList from '@/components/CollectionList'
import UserMenu from '@/components/UserMenu'
import { users } from '@/firebase/database'

export default {
  name: 'UserPage',
  components: {
    UserMenu,
    CollectionList
  },
  mixins: [ AuthMixin ],
  data: () => ({
    activeTab: 'paper',
    localStore: null,
    collection: {
      name: 'Progressive visual analysis',
      description: null
    }
  }),
  watch: {
    currUser () {
      if (this.currUser) {
        users.getCollections().then(collections => {
          this.$refs.UserCollections.collections = collections
        })
      }
    }
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
