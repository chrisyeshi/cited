<template>
  <v-btn v-if="!isSignedIn" flat small @click="signIn">Sign In</v-btn>
  <v-menu v-else offset-y>
    <v-btn slot="activator" large icon>
      <v-icon v-if="!userImg" large color="grey darken-2" key="icon">
        account_circle
      </v-icon>
      <v-avatar size="36px">
        <img :src="userImg">
      </v-avatar>
    </v-btn>
    <v-list>
      <v-subheader>{{ userEmail }}</v-subheader>
      <v-list-tile @click="signOut">
        <v-list-tile-title>Logout</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import _ from 'lodash'
import AuthMixin from '@/components/authmixin.js'

export default {
  name: 'SignInButton',
  mixins: [ AuthMixin ],
  computed: {
    userEmail () {
      return _.property('email')(this.currUser)
    },
    userImg () {
      return _.property('photoURL')(this.currUser)
    }
  }
}
</script>

<style scoped>
</style>
