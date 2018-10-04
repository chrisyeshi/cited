<template>
  <v-layout column>
    <v-toolbar dense flat class="pb-0" color="transparent">
      <v-layout fill-height align-end>
        <v-layout row wrap align-center>
          <v-flex xs1>
            <v-icon @click="$store.dispatch('toggleVisPaneState')">
              {{ $store.state.visPaneState === 'full'
                ? 'chevron_right'
                : 'chevron_left' }}
            </v-icon>
          </v-flex>
          <v-flex offset-xs1>
            <h4 class="body-2">Temporary collection</h4>
          </v-flex>
        </v-layout>
      </v-layout>
    </v-toolbar>
    <v-divider class="my-2"></v-divider>
    <v-container class="pt-0" fluid style="height: calc(100vh - 155px); overflow: auto;">
      <v-layout column align-content-start
        :wrap="$store.state.visPaneState !== 'minor'"
        style="height: calc(100vh - 155px); overflow: auto;">
        <v-hover v-for="(card, index) in $store.state.cards" :key="index"
          class="mb-3 mr-3">
          <v-card slot-scope="{ hover }" :class="{ 'elevation-6': hover }" style="min-width: 252px; max-width: 252px;">
            <v-system-bar status class="pa-0">
              <span class="fill-height caption px-1 d-flex align-center cyan darken-3">
                <span>&lt; 12 / 23</span>
              </span>
              <v-spacer></v-spacer>
              <v-icon @click="trace">close</v-icon>
              <span class="fill-height caption px-1 d-flex align-center cyan darken-1">
                <span>12 / 23 &gt;</span>
              </span>
            </v-system-bar>
            <v-card-text class="pa-2 caption">
              <h4><a>Blast2GO: a universal tool for annotation, visualization and analysis in functional genomics research</a></h4>
              <div class="text-truncate paper-author-line"><a>Ye, Yucong (Chris)</a> and <a>Moreland, Kenneth</a> and <a>Li Kelvin</a></div>
              <v-layout row justify-space-between>
                <a>LDAV</a>-<a>2016</a>-<a>Citing 23</a>-<a>Cited by 23</a>
              </v-layout>
            </v-card-text>
          </v-card>
        </v-hover>
      </v-layout>
    </v-container>
  </v-layout>
</template>

<script>
import PaperCard from './PaperCard.vue'

export default {
  name: 'VisPane',
  components: {
    PaperCard
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
.paper-author-line a {
  text-decoration: underline;
  color: dimgray;
}
</style>
