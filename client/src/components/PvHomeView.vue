<template>
  <div v-if="isWaitingForAuth" />
  <landing-page v-else-if="isLandingPageVisible" v-model="isDemo" />
  <v-app v-else>
    <pv-app-bar />
    <pv-home-collection-list />
  </v-app>
</template>

<script>
import AuthMixin from '@/components/authmixin.js'
import LandingPage from '@/components/LandingPage.vue'
import PvAppBar from '@/components/PvAppBar.vue'
import PvHomeCollectionList from '@/components/PvHomeCollectionList.vue'

export default {
  name: 'PvHomeView',
  components: { LandingPage, PvAppBar, PvHomeCollectionList },
  mixins: [ AuthMixin ],
  data: () => ({
    isDemo: false
  }),
  computed: {
    isLandingPageVisible () {
      return this.isSignedIn === false && this.isDemo === false
    },
    isWaitingForAuth () {
      return this.isSignedIn === null
    }
  }
}
</script>
