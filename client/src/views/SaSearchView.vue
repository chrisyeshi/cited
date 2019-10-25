<template>
  <v-app>
    <v-app-bar app flat clipped-left class="px-2" color="#f5f5f5">
      <v-spacer />
      <sign-in-button />
    </v-app-bar>
    <v-content>
      <v-container class="px-6">
        <v-row justify="center" class="mt-12">
          <v-col sm="8" md="7" lg="6" xl="4">
            <v-row justify="center">
              <h1 style="font-family: 'Lora', serif; font-size: 100px;">
                Cited
              </h1>
            </v-row>
            <v-row justify="center" class="mb-8 text-center">
              <p class="mb-0">
                ... visualizes the references of a paper as a node-link diagram.
              </p>
            </v-row>
            <v-row justify="center" class="my-8">
              <v-text-field
                solo rounded clearable append-icon="mdi-magnify"
                placeholder="SemanticScholar Paper ID" v-model="searchTerm"
                @keydown="onSearchKeyDown"
                @click:append="onSearchClick" />
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
    <v-footer app absolute class="px-6">
        <v-row justify="space-between" align="center">
          <span class="body-2">
            <span>
              Email:
            </span>
            <a style="text-decoration: underline;" @click="copyEmail">
              {{ toEmail }}
            </a>
            <v-snackbar
              v-model="isCopyEmailSnackbarVisible" bottom :timeout="1000">
              Copied
            </v-snackbar>
          </span>
          <v-spacer />
          <v-btn
            small depressed rounded color="grey lighten-2"
            href="https://github.com/chrisyeshi/cited">
            <v-icon medium left>mdi-github-circle</v-icon>
            GitHub
          </v-btn>
        </v-row>
    </v-footer>
  </v-app>
</template>

<script>
import _ from 'lodash'
import SignInButton from '@/components/SignInButton'

export default {
  name: 'SaSearchView',
  components: { SignInButton },
  data: () => ({
    isCopyEmailSnackbarVisible: false,
    searchTerm: '',
    toEmail: 'contact@cited.app'
  }),
  methods: {
    copyEmail () {
      navigator.clipboard.writeText(this.toEmail)
      this.isCopyEmailSnackbarVisible = true
    },
    search () {
      this.$router.push(`/coll/${this.searchTerm}`)
    },
    onSearchKeyDown (event) {
      if (event.key === 'Enter') {
        return this.search()
      }
    },
    onSearchClick () {
      if (!_.isEmpty(this.searchTerm)) {
        return this.search()
      }
    }
  }
}
</script>
