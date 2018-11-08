<template>
  <div>
    <v-card flat>
      <v-card-title primary-title>
        <div>
          <h3>{{ paper.title }}</h3>
          <div>{{ authorText }}</div>
          <div>year: {{ paper.year }}, referenced: {{ paper.references.length }}, cited by: {{ paper.citationCount }}</div>
          <div>doi: <a target="_blank" :href="`https://doi.org/${paper.doi}`">{{ paper.doi }}</a></div>
        </div>
      </v-card-title>
      <v-card-actions>
        <v-btn flat @click="$emit('back')">Back</v-btn>
        <v-btn flat @click="$emit('populate', paper)">Populate</v-btn>
        <v-btn flat @click="$emit('insert', paper)">Insert</v-btn>
      </v-card-actions>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        <div>
          <h4>Abstract</h4>
          <div>{{ paper.abstract }}</div>
        </div>
      </v-card-title>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        <div>
          <h4>References</h4>
        </div>
      </v-card-title>
      <paper-list :papers="references"
        @populate="$emit('populate', $event)"
        @insert="$emit('insert', $event)"
        @detail="$emit('detail', $event)">
      </paper-list>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        <div>
          <h4>Cited by</h4>
          <v-list>
            <v-list-tile v-for="(item, index) in paper.citedBy" :key="index">
              {{ item }}
            </v-list-tile>
          </v-list>
        </div>
      </v-card-title>
    </v-card>
    <v-card>
      <v-card-text>
        {{ paper }}
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import PaperList from './PaperList.vue'
import * as api from './crossref.js'
import _ from 'lodash'
import { Author } from './paper.js'

export default {
  name: 'PaperDetail',
  components: {
    PaperList
  },
  data () {
    return {
      paper: {
        references: [],
        authors: []
      },
      references: []
    }
  },
  watch: {
    paper: function (curr) {
      this.getRefPapers(curr).then(refs => { this.references = refs })
    }
  },
  computed: {
    authorText () {
      return Author.stringify(this.paper.authors)
    }
  },
  methods: {
    setPaper: function (paper) {
      this.references = []
      this.paper = paper
    },
    getRefPapers: function (paper) {
      const dois = paper.references
        .map(ref => ref.doi)
        .filter(doi => !_.isEmpty(doi))
      const promises = dois.map(doi => api.getPaperByDOI(doi).catch(() => null))
      return Promise.all(promises).then(responses => {
        return responses.filter(res => res !== null)
      })
    }
  }
}
</script>
