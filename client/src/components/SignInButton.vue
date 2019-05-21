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
import { AmplifyEventBus } from 'aws-amplify-vue'

export default {
  name: 'SignInButton',
  data () {
    this.populateAuthState()
    return {
      user: null
    }
  },
  computed: {
    isSignedIn () {
      return this.user
    },
    userEmail () {
      return this.isSignedIn ? this.user.attributes.email : null
    },
    userImg () {
      return this.isSignedIn ? this.user.attributes.picture : null
    }
  },
  methods: {
    signIn () {
      this.$Amplify.Auth.federatedSignIn({ provider: 'Google' })
    },
    logout () {
      this.$Amplify.Auth.signOut()
    },
    async populateAuthState () {
      try {
        this.user = await this.$Amplify.Auth.currentAuthenticatedUser()
      } catch (error) {
        if (error === 'not authenticated') {
          this.user = null
        } else {
          console.log(error)
        }
      }
    }
  },
  created () {
    AmplifyEventBus.$on('authState', info => {
      console.log(info)
    })
  }
}
</script>

<style scoped>
</style>
