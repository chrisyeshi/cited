<template>
  <v-content>
    <v-container grid-list-lg>
      <v-layout row wrap>
        <v-flex md6>
          <pv-drawer-sample-collection-list>
          </pv-drawer-sample-collection-list>
        </v-flex>
        <v-flex md6>
          <pv-drawer-my-collection-list v-if="authUser">
          </pv-drawer-my-collection-list>
          <v-list v-else>
            <v-subheader>My Collections</v-subheader>
            <v-btn flat small color="primary" @click="signIn">
              Login to view/save user collections
            </v-btn>
          </v-list>
        </v-flex>
      </v-layout>
    </v-container>
  </v-content>
</template>

<script>
import PvDrawerSampleCollectionList from '@/components/PvDrawerSampleCollectionList.vue'
import PvDrawerMyCollectionList from '@/components/PvDrawerMyCollectionList.vue'

export default {
  name: 'PvHomeCollectionList',
  components: { PvDrawerMyCollectionList, PvDrawerSampleCollectionList },
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
