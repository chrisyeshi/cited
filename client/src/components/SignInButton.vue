<template>
  <v-layout fill-height>
    <v-menu
      v-show="$store.state.currUser === null" offset-y
      :close-on-content-click="false"
      v-model="isSignInMenuVisible">
      <v-btn slot="activator" flat key="text">SIGN IN</v-btn>
      <v-card>
        <v-card-title>
          <v-form @submit.prevent="signIn">
            <v-text-field
              ref="email"
              label="E-mail"
              value="test@test.com"
              required
            ></v-text-field>
            <v-text-field
              ref="password"
              label="Password"
              type="password"
              value="password"
              id="id"
            ></v-text-field>
            <v-btn type="submit" color="primary">submit</v-btn>
          </v-form>
        </v-card-title>
      </v-card>
    </v-menu>
    <v-menu v-show="$store.getters.isSignedIn" offset-y>
      <v-btn slot="activator" large icon>
        <v-icon large color="grey darken-2" key="icon">account_circle</v-icon>
      </v-btn>
      <v-list>
        <v-list-tile @click="logout">
          <v-list-tile-title>Logout</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
  </v-layout>
</template>

<script>
export default {
  name: 'SignInButton',
  data () {
    return {
      isSignInMenuVisible: false
    }
  },
  methods: {
    signIn () {
      this.isSignInMenuVisible = false
      this.$store.dispatch(
        'signIn',
        { email: this.$refs.email.value, password: this.$refs.password.value })
    },
    logout () {
      this.$store.dispatch('logout')
    }
  }
}
</script>

<style scoped>
</style>
