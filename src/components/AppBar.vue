<template>
  <v-toolbar app clipped-right flat :fixed="fixed"
    :dense="minimal"
    :color="minimal ? 'transparent' : ''">
    <responsive-text-logo v-if="!minimal" :full="fullLogo" @click="toHome">
    </responsive-text-logo>
    <v-container v-if="!fullLogo" fill-height class="pa-2">
      <v-layout row fill-height justify-center align-center>
        <v-flex xs12 :md10="!minimal">
          <slot></slot>
        </v-flex>
      </v-layout>
    </v-container>
    <v-toolbar-items v-if="!minimal">
      <v-menu offset-y transition="slide-y-transition"
        v-if="$store.state.isSignedIn">
      </v-menu>
      <sign-in-button></sign-in-button>
      <v-toolbar-side-icon
        v-if="$store.state.isSignedIn"
        @click.stop="toggleDrawer">
          <v-icon large color="grey darken-2">view_list</v-icon>
      </v-toolbar-side-icon>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
import SignInButton from './SignInButton.vue'
// import UserCollectionList from './UserCollectionList.vue'
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
    }
  },
  data () {
    return {
      drawer: false
    }
  },
  components: {
    SignInButton,
    // UserCollectionList,
    ResponsiveTextLogo
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    toHome () {
      window.flipping.read()
      this.$store.commit('toHome')
      this.$nextTick(() => {
        window.flipping.flip()
      })
    },
    toggleDrawer () {
      this.$store.commit('toggleSideDrawer')
    }
  }
}
</script>

<style scoped>
</style>
