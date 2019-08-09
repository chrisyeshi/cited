<template>
  <v-toolbar app flat clipped-left>
    <v-toolbar-title @click="toHome" class="page-title">
      Cited
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-toolbar-items>
      <sign-in-button></sign-in-button>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
import SignInButton from '@/components/SignInButton.vue'

export default {
  name: 'PvAppBar',
  components: { SignInButton },
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
