<template>
  <v-form>
    <div class="text-xs-center">
      <v-btn color="primary">Parse from PDF(s)</v-btn>
    </div>
    <v-divider class="mt-3 mb-2"></v-divider>
    <div class="text-xs-center">
      Or input manually...
    </div>
    <v-text-field name="title" label="Article Title" id="articleTitle"
      hide-details>
    </v-text-field>
    <v-textarea name="abstract" label="Abstract" id="abstract" hide-details>
    </v-textarea>
    <v-container fluid grid-list-xm pa-0>
      <v-layout row wrap align-center my-0>
        <v-flex v-for="(author, index) in authors" :key="index" xs6 sm3>
          <v-text-field name="name" label="Author Name" :id="`author-${index}`"
            hide-details>
          </v-text-field>
        </v-flex>
        <v-flex xs6 sm3>
          <v-btn @click="incrementNumberOfAuthors()">More Author</v-btn>
        </v-flex>
      </v-layout>
    </v-container>
    <v-text-field name="venue" label="Venue Name" id="venue" hide-details>
    </v-text-field>
    <v-container fluid grid-list-xm pa-0>
      <v-layout row wrap align-center my-0>
        <v-flex v-for="(reference, index) in references" :key="index" xs12 sm6>
          <v-text-field name="reference" label="Reference"
            :id="`reference-${index}`" hide-details>
          </v-text-field>
        </v-flex>
        <v-flex xs12 sm6>
          <v-btn @click="incrementNumberOfReferences()">More Reference</v-btn>
        </v-flex>
      </v-layout>
    </v-container>
    <div class="text-xs-center">
      <v-btn color="primary">Add Article</v-btn>
      <v-btn>Cancel</v-btn>
    </div>
  </v-form>
</template>

<script>
import _ from 'lodash'
import { Article, Author } from './pvmodels.js'

export default {
  name: 'PvArticleForm',
  data () {
    return {
      authors: [ new Author() ],
      references: [ new Article() ]
    }
  },
  methods: {
    incrementNumberOfAuthors () {
      this.authors = _.concat(this.authors, new Author())
    },
    incrementNumberOfReferences () {
      this.references = _.concat(this.references, new Article())
    }
  }
}
</script>

<style scoped>
</style>
