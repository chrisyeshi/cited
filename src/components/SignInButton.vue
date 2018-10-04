<template>
  <v-btn flat v-if="!$store.state.isSignedIn" @click="signIn" key="text">SIGN IN</v-btn>
  <v-btn large icon v-else @click="signIn"><v-icon large color="grey darken-2" key="icon">account_circle</v-icon></v-btn>
</template>

<script>
export default {
  name: 'SignInButton',
  methods: {
    signIn () {
      this.$store.commit('toggleIsSignedIn')
    }
  }
}
</script>

<style scoped>
</style>
