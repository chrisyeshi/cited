<template>
  <v-btn v-if="!currUser" text small to="/auth/signin">Sign In</v-btn>
  <v-menu v-else offset-y>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" large icon>
        <v-icon v-if="!currUser.photo" large color="grey darken-2" key="icon">
          mdi-account-circle
        </v-icon>
        <v-avatar size="36px">
          <img :src="currUser.photo">
        </v-avatar>
      </v-btn>
    </template>
    <v-list>
      <v-subheader>{{ currUser.email }}</v-subheader>
      <v-list-item to="/user#collections">
        <v-list-item-title>My collections</v-list-item-title>
      </v-list-item>
      <v-list-item to="/user/settings">
        <v-list-item-title>Settings</v-list-item-title>
      </v-list-item>
      <v-list-item to="/help">
        <v-list-item-title>Help</v-list-item-title>
      </v-list-item>
      <v-list-item to="/auth/signout">
        <v-list-item-title>Sign out</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import AuthMixin from '@/components/authmixin'

export default {
  name: 'UserMenu',
  mixins: [ AuthMixin ]
}
</script>

<style scoped>
</style>
