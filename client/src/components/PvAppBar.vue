<template>
  <v-app-bar app flat clipped-left class="px-2" color="#f5f5f5">
    <v-toolbar-title @click="toHome" class="page-title">
      {{ title }}
    </v-toolbar-title>
    <slot />
    <v-spacer></v-spacer>
    <sign-in-button></sign-in-button>
  </v-app-bar>
</template>

<script>
import SignInButton from '@/components/SignInButton.vue'

export default {
  name: 'PvAppBar',
  components: { SignInButton },
  computed: {
    title () {
      return this.$vuetify.breakpoint.xsOnly ? 'C' : 'Cited'
    }
  },
  methods: {
    toHome () {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.page-title {
  cursor: pointer;
  font-family: 'Lora', serif;
  font-size: 26px;
}
</style>
