<template>
  <v-layout column>
    <v-container style="max-width: 600px;">
      <h1 class="pa-4 grey--text text--darken-2 responsive-font-size">
        Discovery Engine
      </h1>
      <search-box solo @onSearch="onSearch"></search-box>
      <v-slide-y-transition>
        <user-collection-list
          v-if="$store.getters.isSignedIn"
          class="user-collection pt-5"
          @onCollectionClicked="$emit('onSelectUserCollection', $event)">
        </user-collection-list>
      </v-slide-y-transition>
    </v-container>
  </v-layout>
</template>

<script>
import SignInButton from './SignInButton.vue'
import SearchBox from './SearchBox.vue'
import UserCollectionList from './UserCollectionList.vue'

export default {
  name: 'SearchPage',
  components: {
    SignInButton,
    SearchBox,
    UserCollectionList
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    animateSearchText (text, interval, callback) {
      if (text === '') {
        callback()
        return
      }
      this.animateSearchText(text.slice(0, text.length - 1), interval, () => {
        setTimeout(() => {
          this.$store.commit('setState', { searchText: text })
          if (callback) {
            callback()
          }
        }, interval)
      })
    },
    onSearch (text) {
      window.flipping.read()
      this.$store.dispatch('search', text)
      this.$nextTick(() => {
        window.flipping.flip()
      })
    }
  },
  mounted () {
    this.animateSearchText('visualization', 20)
  }
}
</script>

<style scoped>
.user-collection {
  background-color: transparent;
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
