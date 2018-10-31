<template>
  <v-container pb-1 :py-2="$store.state.isVisPaneVisible">
    <v-layout row wrap>
      <v-flex :md2="!$store.state.isVisPaneVisible" px-2>
        <v-layout row wrap justify-space-between>
          <v-btn
            round depressed small block outline color="accent" class="mx-2 text-truncate">
            <v-icon small class="px-1">add</v-icon>
            Add to ...
          </v-btn>
          <v-btn
            round depressed small block outline color="accent" class="mx-2">
            <v-icon small class="px-1">format_quote</v-icon>
            Cite ...
          </v-btn>
          <v-btn
            round depressed small block outline color="accent" class="mx-2"
            @click="$refs.commentLabel.scrollIntoView(true)">
            <v-icon small class="px-1">comment</v-icon>
            Comments
          </v-btn>
          <v-btn
            round depressed small block outline color="accent" class="mx-2">
            <v-icon small class="px-1">launch</v-icon>
            Source
          </v-btn>
        </v-layout>
        <v-divider class="my-2"></v-divider>
      </v-flex>
      <v-flex :md10="!$store.state.isVisPaneVisible" px-2 :style="{ height: $store.state.isVisPaneVisible ? 'calc(100vh - 200px)' : 'calc(100vh - 100px)', overflow: 'auto' }">
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
          <a>{{ refObj.venue }}</a> - <a>{{ refObj.year }}</a> - <a @click="$refs.refLabel.scrollIntoView(true)">References {{ refObj.citingCount }}</a> - <a @click="showRelatedRefObjs('citing', refObj)">Cited by {{ refObj.citedByCount }}</a>
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
          References ({{ refObj.citingCount }}):
        </h4>
        <search-paper v-for="(citing, index) in citings" :key="index"
          :refObj="citing"
          @onClickTitle="showRefObjDetail"
          @onClickVenue="trace"
          @onClickYear="trace"
          @onClickCiting="showRelatedRefObjs('citing', $event)"
          @onClickCitedBy="showRelatedRefObjs('citedBy', $event)">
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
    </v-layout>
  </v-container>
</template>

<script>
import _ from 'lodash'
import { Author } from './paper.js'
import SearchPaper from './SearchPaper.vue'

export default {
  name: 'ReferenceObject',
  components: {
    SearchPaper
  },
  props: {
    refObj: Object
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
      this.$store.commit('set', { prop: 'currRefObj', value: refObj })
    },
    showRelatedRefObjs (relation, refObj) {
      if (!this.$store.state.isVisPaneVisible) {
        window.flipping.read()
        this.$store.commit('toSearchCollection')
        this.$nextTick(() => {
          window.flipping.flip()
        })
      }
      this.$store.dispatch(
        'showRelatedTestRefObjs', { relation: relation, refObj: refObj })
      this.$store.commit('insertToGraph', refObj)
    }
  },
  computed: {
    authorNames () {
      return _.map(this.refObj.authors, author => Author.stringify(author))
    },
    abstract () {
      return this.isAbstractExpanded
        ? this.refObj.abstract
        : this.refObj.abstract.slice(0, 512)
    },
    citings () {
      return _.map(this.refObj.citings, ({ doi }) => {
        return this.$store.state.testGraph.nodes[doi].paper
      })
    }
  }
}
</script>

<style scoped>
</style>
