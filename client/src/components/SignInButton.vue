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
      <v-list-tile @click="logout">
        <v-list-tile-title>Logout</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import FirebaseAuth from '../FirebaseAuth'

export default {
  name: 'SignInButton',
  data () {
    return {
      firebaseAuth: null,
      user: null
    }
  },
  computed: {
    isSignedIn () {
      return this.user
    },
    userEmail () {
      return this.isSignedIn ? this.user.email : null
    },
    userImg () {
      return this.isSignedIn ? this.user.photoURL : null
    }
  },
  methods: {
    signIn () {
      this.firebaseAuth.signIn().then(response => {
        this.user = response.user
      })
    },
    logout () {
      this.user = null
      this.firebaseAuth.signOut()
    }
  },
  created () {
    this.firebaseAuth = new FirebaseAuth()
    this.user = this.firebaseAuth.getUser()
  }
}
</script>

<style scoped>
</style>
