<template>
  <v-layout column>
    <v-toolbar dense flat class="pb-0" color="transparent">
      <v-layout fill-height align-end>
        <v-flex :offset-md2="fluid" :md8="fluid">
          <v-layout justify-start class="text-truncate">
            <a @click="$emit('addToCurrColl', refObj)" class="mr-4 text-no-wrap">
              <v-icon class="pr-1" size=20>add</v-icon>
              <span class="text-truncate">
                Add to {{ $store.getters.currCollTitle }}
              </span>
            </a>
            <a @click="trace" class="mr-4 text-no-wrap">
              <v-icon class="pr-1" size=20>add</v-icon>
              <span class="text-truncate">Add to ...</span>
            </a>
            <a @click="trace" class="mr-4 text-no-wrap">
              <v-icon class="pr-1" size=20>format_quote</v-icon>
              <span class="text-truncate">Cite ...</span>
            </a>
            <a class="mr-4 text-no-wrap"
              @click="$refs.commentLabel.scrollIntoView(true)">
              <v-icon class="pr-1" size=20>comment</v-icon>
              <span class="text-truncate">Comments</span>
            </a>
            <a @click="trace" class="mr-4 text-no-wrap">
              <v-icon class="pr-1" size=20>launch</v-icon>
              <span class="text-truncate">Source</span>
            </a>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-toolbar>
    <v-divider class="my-2"></v-divider>
    <v-container fluid py-2 style="height: calc(100vh - 135px); overflow: auto;">
      <v-flex :offset-md2="fluid" :md8="fluid">
        <h2 class="mb-2 display-1">{{ refObj.title }}</h2>
        <h4 class="mb-2 subheading">
          <template v-for="(name, index) in authorNames">
            <a :key="`name-${index}`" class="text-no-wrap">{{ name }}</a>
            <span v-if="index !== authorNames.length - 1" :key="`and-${index}`">
              and
            </span>
          </template>
        </h4>
        <h4 class="mb-4 subheading">
          <a>{{ refObj.venue.name }}</a> - <a>{{ refObj.year }}</a> - <a @click="$refs.refLabel.scrollIntoView(true)">References {{ refObj.referenceCount }}</a> - <a @click="showRelatedRefObjs('citing', refObj)">Cited by {{ refObj.citedByCount }}</a>
        </h4>
        <h4 class="mb-1 subheading">Abstract:</h4>
        <p ref="abstract" class="mb-4 body-1">
          {{ abstract }}
          <span v-if="!isAbstractExpanded && refObj.abstract.length > 512">
            ...
            <a class="text-no-wrap"
              @click="isAbstractExpanded = !isAbstractExpanded">
              CONTINUE READING
            </a>
          </span>
          <a v-else class="text-no-wrap"
            @click="isAbstractExpanded = !isAbstractExpanded">
            LESS
          </a>
        </p>
        <h4 ref="refLabel" class="mb-1 subheading">
          References ({{ refObj.referenceCount }}):
        </h4>
        <search-paper v-for="(citing, index) in refObj.references" :key="index"
          :refObj="citing"
          @onClickTitle="showRefObjDetail"
          @onClickVenue="trace"
          @onClickYear="trace"
          @onClickCiting="showRelatedRefObjs('citedBy', $event)"
          @onClickCitedBy="showRelatedRefObjs('citing', $event)">
        </search-paper>
        <h4 ref="commentLabel" class="mt-4 mb-2 subheading">Comments:</h4>
        <v-card class="mb-3">
          <v-card-title>
            <div>
              <v-layout row align-center>
                <v-icon xLarge>face</v-icon>
                <div class="ml-2 body-1 grey--text text--darken-1">
                  Write a comment...
                </div>
              </v-layout>
            </div>
          </v-card-title>
        </v-card>
        <v-card class="mb-3">
          <v-card-title>
            <div>
              <v-layout row align-center class="mb-3">
                <v-icon xLarge>face</v-icon>
                <div class="ml-1 caption grey--text text--darken-1">
                  <div>Chris</div>
                  <div>Tuesday, October 30, 2018</div>
                </div>
              </v-layout>
              <div class="body-1">This paper looks really interesting! However, the user study can be done in a different way, which I think can significantly improve the paper.</div>
              <v-layout row align-center class="mt-2 body-1">
                <a>like (523)</a><span class="mx-2">-</span><a>reply</a>
              </v-layout>
            </div>
          </v-card-title>
        </v-card>
        <v-card class="mb-3">
          <v-card-title>
            <div>
              <v-layout row align-center class="mb-3">
                <v-icon xLarge>face</v-icon>
                <div class="ml-1 caption grey--text text--darken-1">
                  <div>Chris</div>
                  <div>Tuesday, October 30, 2018</div>
                </div>
              </v-layout>
              <div class="body-1">This paper looks really interesting! However, the user study can be done in a different way, which I think can significantly improve the paper.</div>
              <v-layout row align-center class="mt-2 body-1">
                <a>like (523)</a><span class="mx-2">-</span><a>reply</a>
              </v-layout>
            </div>
          </v-card-title>
        </v-card>
      </v-flex>
    </v-container>
  </v-layout>
</template>

<script>
import _ from 'lodash'
import { Author } from './paper.js'
import SearchPaper from './SearchPaper.vue'
import showRelatedRefObjs from './showrelatedrefobjs.js'

export default {
  name: 'ReferenceObject',
  mixins: [
    showRelatedRefObjs
  ],
  components: {
    SearchPaper
  },
  props: {
    fluid: Boolean
  },
  data () {
    return {
      isAbstractExpanded: false
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    showRefObjDetail (refObj) {
      this.$store.dispatch('showRefObjDetail', refObj.id)
    }
  },
  computed: {
    refObj () {
      return this.$store.state.currRefObj
    },
    authorNames () {
      return _.map(this.refObj.authors, author => Author.stringify(author))
    },
    abstract () {
      return this.isAbstractExpanded
        ? this.refObj.abstract
        : this.refObj.abstract.slice(0, 512)
    }
  }
}
</script>

<style scoped>
</style>
