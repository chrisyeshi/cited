<template>
  <div class="my-2">
    <h4 class="body-2"><a @click="$emit('onClickTitle')">Blast2GO: a universal tool for annotation, visualization and analysis in functional genomics research</a></h4>
    <div class="caption text-truncate grey--text text--darken-3 paper-author-line"><a>Ye, Yucong (Chris)</a> and <a>Moreland, Kenneth</a> - <a>LDAV</a> - <a>2016</a></div>
    <div class="caption grey--text text--darken-3" :class="{ 'text-truncate': !isExpanded }">
      We present here Blast2GO (B2G), a research tool designed with the main purpose of enabling Gene Ontology (GO) based data mining on sequence data for which no GO annotation is yet available. B2G joints in one application GO annotation based on similarity searches with statistical analysis and highlighted visualization on directed acyclic graphs. This tool offers a suitable platform for functional genomics research in non-model species. B2G is an intuitive and interactive desktop application that allows monitoring and comprehension of the whole annotation and analysis process.
    </div>
    <div class="caption text-truncate grey--text text--darken-3">
      <v-icon small color="primary" class="mr-3"
        @click="isExpanded = !isExpanded">
        {{ isExpanded ? 'expand_less' : 'expand_more' }}
      </v-icon>
      <a class="mr-3" @click="$emit('onClickCiting')">Citing 26</a>
      <a class="mr-3" @click="$emit('onClickCitedBy')">Cited by 427</a>
      <a class="mr-3" ref="addToCollection" v-show="$store.state.isSignedIn">
        Add to collection ...
      </a>
      <v-menu offset-y :activator="$refs.addToCollection">
        <user-collection-list dense></user-collection-list>
      </v-menu>
    </div>
  </div>
</template>

<script>
import UserCollectionList from './UserCollectionList.vue'
// TODO: animate the expand/collapse of the abstract

export default {
  name: 'SearchPaper',
  components: {
    UserCollectionList
  },
  data () {
    return {
      isExpanded: false
    }
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
