<template>
  <v-toolbar app clipped-left flat :fixed="fixed"
    :dense="minimal"
    :color="minimal ? 'transparent' : ''">
    <v-toolbar-side-icon
      v-if="$store.state.enableDrawer && !minimal"
      @click="$store.commit('toggle', 'isDrawerVisible')">
    </v-toolbar-side-icon>
    <responsive-text-logo
      v-if="!minimal && showSearchBox"
      :full="fullLogo" @click="$emit('toHome')" class="ml-2">
    </responsive-text-logo>
    <v-container v-if="!fullLogo" fill-height class="pa-2">
      <v-layout row fill-height justify-center align-center>
        <v-flex xs12 :md10="!minimal">
          <slot v-if="showSearchBox"></slot>
        </v-flex>
      </v-layout>
    </v-container>
    <v-toolbar-items v-if="!minimal">
      <v-menu
        v-if="$store.getters.isUserCollectionDropdownVisible"
        offset-y transition="slide-y-transition">
        <v-btn large icon slot="activator">
          <v-icon large color="grey darken-2">view_list</v-icon>
        </v-btn>
        <user-collection-list></user-collection-list>
      </v-menu>
      <sign-in-button v-if="$store.state.enableSignIn"></sign-in-button>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
import SignInButton from './SignInButton.vue'
import UserCollectionList from './UserCollectionList.vue'
import ResponsiveTextLogo from './ResponsiveTextLogo.vue'

export default {
  name: 'AppBar',
  props: {
    fixed: {
      type: Boolean,
      default: false
    },
    minimal: {
      type: Boolean,
      default: false
    },
    fullLogo: {
      type: Boolean,
      default: false
    },
    showSearchBox: Boolean
  },
  components: {
    SignInButton,
    UserCollectionList,
    ResponsiveTextLogo
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
