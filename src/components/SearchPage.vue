<template>
  <v-layout column>
    <v-toolbar flat>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <sign-in-button></sign-in-button>
      </v-toolbar-items>
    </v-toolbar>
    <v-container style="max-width: 600px;">
      <h1 class="pa-4 grey--text text--darken-2 responsive-font-size">
        Discovery Engine
      </h1>
      <slot></slot>
      <v-slide-y-transition>
        <user-collection-list
          v-if="$store.state.isSignedIn"
          class="user-collection pt-5">
        </user-collection-list>
      </v-slide-y-transition>
    </v-container>
  </v-layout>
</template>

<script>
import SignInButton from './SignInButton.vue'
import UserCollectionList from './UserCollectionList.vue'

export default {
  name: 'SearchPage',
  components: {
    SignInButton,
    UserCollectionList
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
.user-collection {
  background-color: transparent;
}

.user-collection >>> .v-subheader {
  padding-left: 0px;
  padding-right: 0px;
}

.user-collection >>> .v-list__tile {
  padding-left: 0px;
  padding-right: 0px;
}

.responsive-font-size {
  text-align: center;
}

@media screen and (min-width: 668px) {
  .responsive-font-size {
    font-size: 60px;
  }
}

@media screen and (max-width: 667px) {
  .responsive-font-size {
    font-size: 9vw;
  }
}
</style>
