<template>
  <div class="text-xs-center">
    <paper-list :papers="papers"
      @populate="$emit('populate', $event)"
      @insert="$emit('insert', $event)"
      @detail="$emit('detail', $event)">
    </paper-list>
    <v-pagination circle :length="nPages" v-model="paginationPage"></v-pagination>
  </div>
</template>

<script>
import PaperList from './PaperList.vue'
import * as api from './crossref.js'

export default {
  name: 'SearchResults',
  components: {
    PaperList
  },
  data () {
    return {
      papers: [],
      nPages: 0,
      page: 0,
      papersPerPage: 20 // TODO: this is a magic number from crossref.js
    }
  },
  computed: {
    paginationPage: {
      get () {
        return this.page + 1
      },
      set (value) {
        this.page = value - 1
      }
    }
  },
  watch: {
    page: function (curr) {
      this.search(this.searchText, curr)
    }
  },
  methods: {
    search: function (text, page = 0) {
      return api.search(text, page).then(({ papers, totalPapers }) => {
        this.papers = papers
        this.nPages = Math.ceil(totalPapers / this.papersPerPage)
        this.page = page
      }).catch(() => {})
    }
  }
}
</script>
