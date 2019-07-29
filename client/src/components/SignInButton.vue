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
export default {
  name: 'SignInButton',
  data () {
    return {
      auth: null,
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
      this.auth.signInWithPopup().then(response => {
        this.user = response.user
      })
    },
    logout () {
      this.auth.signOut().then(() => {
        this.user = null
      })
    }
  }
}
</script>

<style scoped>
</style>
