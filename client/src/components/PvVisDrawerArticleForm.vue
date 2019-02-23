<template>
  <v-form style="position: relative; height: 100%; display: flex; flex-direction: column; justify-content: flex-start;">
    <div style="flex-grow: 1; overflow: auto;">
      <v-container fluid grid-list-md>
        <v-layout column>
          <v-flex>
            <v-textarea box name="title" label="Article Title" id="articleTitle"
              :rows="1" auto-grow v-model="newArticle.data.title">
            </v-textarea>
          </v-flex>
          <v-layout row wrap ma-0>
            <v-flex v-for="(author, index) in newArticle.data.authors"
              :key="index" xs6>
              <v-text-field box :name="`author-${index}`"
                :label="`Author ${index + 1}`" :id="`author-${index}`"
                append-outer-icon="add" v-model="author.surname">
              </v-text-field>
            </v-flex>
          </v-layout>
          <v-layout row ma-0>
            <v-flex xs3>
              <v-text-field box name="year" label="Year" id="year"
                v-model="newArticle.data.year">
              </v-text-field>
            </v-flex>
            <v-flex xs9>
              <v-text-field box name="venue" label="Venue" id="venue"
                v-model="newArticle.data.venue.name">
              </v-text-field>
            </v-flex>
          </v-layout>
          <v-flex>
            <v-textarea box name="abstract" label="Article Abstract"
              id="articleAbstract" :rows="1" auto-grow
              v-model="newArticle.data.abstract">
            </v-textarea>
          </v-flex>
          <v-layout row ma-0>
            <v-flex xs4>
              <v-text-field box name="reference-count" label="Reference Count"
                id="reference-count" v-model="newArticle.nReferences">
              </v-text-field>
            </v-flex>
          </v-layout>
          <v-flex v-for="(reference, index) in newArticle.references"
            :key="index">
            <pv-article-combobox box :name="`reference-${index}`"
              :label="`Reference ${index + 1}`" :id="`reference-${index}`"
              append-outer-icon="add" v-model="newArticle.references[index]">
            </pv-article-combobox>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
    <div style="flex-shrink: 1;">
      <v-container fluid grid-list-md text-xs-center py-2>
        <v-btn color="primary" @click="$emit('submit', newArticle)">save</v-btn>
        <v-btn @click="$emit('cancel', oldArticle)">cancel</v-btn>
      </v-container>
    </div>
  </v-form>
</template>

<script>
import { Article, Paper } from './pvmodels.js'
import PvArticleCombobox from './PvArticleCombobox.vue'

export default {
  name: 'PvVisDrawerArticleForm',
  components: { PvArticleCombobox },
  props: {
    article: Object
  },
  data () {
    return {
      newArticle: new Article(null, new Paper())
    }
  },
  computed: {
    oldArticle () {
      return this.article
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  },
  watch: {
    article: {
      immediate: true,
      handler (curr) {
        this.newArticle =
          new Article(
            curr.type,
            new Paper(
              curr.data.title,
              curr.data.abstract,
              curr.data.year,
              [ ...curr.data.authors ],
              curr.data.venue),
            curr.nReferences,
            [ ...curr.references ],
            curr.nCitedBys,
            [ ...curr.citedBys ])
      }
    }
  }
}
</script>

<style scoped>
</style>
