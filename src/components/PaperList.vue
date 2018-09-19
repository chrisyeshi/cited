<template>
  <v-list two-line>
    <template v-for="(paper, index) in papers">
      <v-list-tile :key="`tile-${index}`" @click="$emit('detail', paper)">
        <v-list-tile-content>
          <v-list-tile-title>{{ paper.title }}</v-list-tile-title>
          <v-list-tile-sub-title>
            {{ formatAuthors(paper.authors) }}
          </v-list-tile-sub-title>
          <v-list-tile-sub-title>year: {{ paper.year }}, referenced: {{ paper.references.length }}, cited by: {{ paper.citationCount }}</v-list-tile-sub-title>
        </v-list-tile-content>
        <v-btn icon @click.stop="$emit('populate', paper)">
          <v-icon :color="paper.references.length > 0 ? 'teal' : 'grey'">
            dashboard
          </v-icon>
        </v-btn>
        <v-btn icon @click.stop="$emit('insert', paper)">
          <v-icon :color="paper.references.length > 0 ? 'teal' : 'grey'">
            plus_one
          </v-icon>
        </v-btn>
      </v-list-tile>
      <v-divider v-if="index + 1 < papers.length" :key="`divider-${index}`"></v-divider>
    </template>
  </v-list>
</template>

<script>
import { Author } from './paper.js'

export default {
  name: 'PaperList',
  props: {
    papers: Array
  },
  methods: {
    formatAuthors: function (authorObjs) {
      return Author.stringify(authorObjs)
    }
  }
}
</script>
