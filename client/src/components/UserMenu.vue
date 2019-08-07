<template>
  <v-btn v-if="!user" flat small to="/auth/signin">Sign In</v-btn>
  <v-menu v-else offset-y>
    <v-btn slot="activator" large icon>
      <v-icon v-if="!user.photo" large color="grey darken-2" key="icon">
        account_circle
      </v-icon>
      <v-avatar size="36px">
        <img :src="user.photo">
      </v-avatar>
    </v-btn>
    <v-list>
      <v-subheader>{{ user.email }}</v-subheader>
      <v-list-tile to="/user#collections">
        <v-list-tile-title>My collections</v-list-tile-title>
      </v-list-tile>
      <v-list-tile to="/user/settings">
        <v-list-tile-title>Settings</v-list-tile-title>
      </v-list-tile>
      <v-list-tile to="/help">
        <v-list-tile-title>Help</v-list-tile-title>
      </v-list-tile>
      <v-list-tile to="/auth/signout">
        <v-list-tile-title>Sign out</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import { getUser } from '@/Firebase/auth'
export default {
  name: 'UserMenu',
  data () {
    return {
      user: getUser()
    }
  }
}
</script>

<style scoped>
</style>
