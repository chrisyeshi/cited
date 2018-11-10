<template>
  <div class="my-2">
    <h4 class="body-2">
      <a @click="$emit('onClickTitle', refObj)">{{ refObj.title }}</a>
    </h4>
    <div class="caption grey--text text--darken-3 paper-author-line"
      :class="{ 'text-truncate': !isExpanded }">
      <span v-for="(name, index) in authorNames" :key="index">
        <a class="text-no-wrap">{{ name }}</a>
        <span v-if="index !== authorNames.length - 1">
          and
        </span>
      </span>
    </div>
    <div class="caption grey--text text--darken-3" :class="{ 'text-truncate': !isExpanded }">
      {{ refObj.abstract }}
    </div>
    <div class="caption text-wrap grey--text text--darken-3">
      <v-icon small color="primary" class="mr-3"
        @click="isExpanded = !isExpanded">
        {{ isExpanded ? 'expand_less' : 'expand_more' }}
      </v-icon>
      <a class="text-no-wrap mr-3" @click="$emit('onClickVenue', refObj.venue)">
        {{ refObj.venue.name }}
      </a>
      <a class="text-no-wrap mr-3" @click="$emit('onClickYear', refObj.year)">
        {{ refObj.year }}
      </a>
      <a class="text-no-wrap mr-3" @click="$emit('onClickCiting', refObj)">
        Referenced {{ refObj.referenceCount }}
      </a>
      <a class="text-no-wrap mr-3" @click="$emit('onClickCitedBy', refObj)">
        Cited by {{ refObj.citedByCount }}
      </a>
      <a class="text-no-wrap mr-3" ref="addToCollection" v-show="$store.state.isSignedIn">
        Add to collection ...
      </a>
      <v-menu offset-y :activator="addToCollection">
        <user-collection-list dense></user-collection-list>
      </v-menu>
    </div>
  </div>
</template>

<script>
import UserCollectionList from './UserCollectionList.vue'
import { Author } from './paper.js'
import _ from 'lodash'
// TODO: animate the expand/collapse of the abstract

export default {
  name: 'SearchPaper',
  components: {
    UserCollectionList
  },
  props: {
    refObj: Object
  },
  data () {
    return {
      isExpanded: false,
      addToCollection: null
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  },
  mounted () {
    this.addToCollection = this.$refs.addToCollection
  },
  computed: {
    authorNames () {
      return _.map(this.refObj.authors, author => Author.stringify(author))
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
