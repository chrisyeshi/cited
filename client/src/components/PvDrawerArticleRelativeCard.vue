<template>
  <pv-vis-meta-card :label="label" :main="title" :left-attr="venue"
    :right-attr="nCitedByText" :left-side-color="currCollReferenceColor"
    :right-side-color="currCollCitedByColor">
  </pv-vis-meta-card>
</template>

<script>
import _ from 'lodash'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

export default {
  name: 'PvDrawerArticleRelativeCard',
  components: { PvVisMetaCard },
  props: {
    article: Object
  },
  computed: {
    currCollReferenceColor () {
      return 'yellow'
    },
    currCollCitedByColor () {
      return 'orange'
    },
    firstAuthorSurname () {
      return _.property('authors[0].surname')(this.article)
    },
    label () {
      return `${this.firstAuthorSurname} ${this.year}`
    },
    nCitedByText () {
      return `Cited by ${_.property('nCitedBys')(this.article)}`
    },
    title () {
      return _.property('title')(this.article)
    },
    venue () {
      return _.property('venues[0].name')(this.article)
    },
    year () {
      return _.property('year')(this.article)
    }
  }
}
</script>
