<template>
  <v-list two-line>
    <template v-for="(paper, index) in papers">
      <v-list-tile :key="`tile-${index}`" @click="$emit('detail', paper)">
        <v-list-tile-content>
          <v-list-tile-title>{{ paper.title }}</v-list-tile-title>
          <v-list-tile-sub-title>{{ formatAuthors(paper.authors) }}</v-list-tile-sub-title>
          <v-list-tile-sub-title>year: {{ paper.year }}, referenced: {{ paper.references.length }}, cited by: {{ paper.citationCount }}</v-list-tile-sub-title>
        </v-list-tile-content>
        <v-btn icon @click="$emit('populate', paper)">
          <v-icon :color="paper.references.length > 0 ? 'teal' : 'grey'">
            dashboard
          </v-icon>
        </v-btn>
        <v-btn icon @click="$emit('insert', paper)">
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
export default {
  name: 'PaperList',
  props: {
    papers: Array
  },
  methods: {
    formatAuthor: function (authorObj) {
      if (!authorObj.family) {
        throw new Error('the family name of the author is not provided. ' + JSON.stringify(authorObj))
      }
      if (!authorObj.given) {
        return authorObj.family
      }
      return `${authorObj.family}, ${authorObj.given}`
    },

    formatAuthors: function (authorObjs) {
      return authorObjs.map(authorObj => this.formatAuthor(authorObj)).join(' and ')
    }
  }
}
</script>
