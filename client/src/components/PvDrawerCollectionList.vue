<template>
  <div>
    <pv-drawer-sample-collection-list></pv-drawer-sample-collection-list>
    <v-divider></v-divider>
    <pv-drawer-my-collection-list v-if="authUser">
    </pv-drawer-my-collection-list>
    <v-container v-else class="text-xs-center">
      <v-btn flat small color="primary" @click="signIn">
        Login to save user collections
      </v-btn>
    </v-container>
  </div>
</template>

<script>
import PvDrawerSampleCollectionList from '@/components/PvDrawerSampleCollectionList.vue'
import PvDrawerMyCollectionList from '@/components/PvDrawerMyCollectionList.vue'

export default {
  name: 'PvDrawerCollectionList',
  components: {
    PvDrawerSampleCollectionList,
    PvDrawerMyCollectionList
  },
  asyncComputed: {
    authUser: {
      default: null,
      async get () {
        try {
          const user = await this.$Amplify.Auth.currentAuthenticatedUser()
          return user
        } catch (error) {
          if (error !== 'not authenticated') {
            console.log(error)
          }
          return null
        }
      }
    }
  },
  methods: {
    signIn () {
      this.$Amplify.Auth.federatedSignIn({ provider: 'Google' })
    }
  }
}
</script>
