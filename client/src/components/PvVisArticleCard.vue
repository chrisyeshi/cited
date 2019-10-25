<template>
  <pv-vis-meta-card :label="labelRowText" :main="article.title"
    :left-attr="article.venue ? article.venue.name : ''"
    :right-attr="nCitedByText"
    :left-side-color="referenceSideColor" :right-side-color="citedBySideColor"
    :background-color="backgroundColorText" :config="config">
  </pv-vis-meta-card>
</template>

<script>
import _ from 'lodash'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

export default {
  name: 'PvVisArticleCard',
  components: { PvVisMetaCard },
  props: {
    article: Object,
    backgroundColor: {
      type: Object,
      default: () => ({ r: 255, g: 255, b: 255 })
    },
    citedByColor: {
      type: [ String, Promise ],
      default: null
    },
    config: {
      type: Object,
      default: () => ({
        borderRadius: 0.65,
        height: 6.8,
        lineClamp: 2,
        opacity: 0.8,
        sideDarkness: 0.2,
        sideWidth: 0.5,
        titleLineHeight: 1.3,
        unit: 'em',
        width: 15
      })
    },
    referenceColor: {
      type: [ String, Promise ],
      default: null
    }
  },
  computed: {
    backgroundColorText () {
      const { r, g, b } = this.backgroundColor
      return `rgba(${r}, ${g}, ${b}, ${this.config.opacity})`
    },
    firstAuthorSurname () {
      const firstAuthor =
        _.property('firstAuthor')(this.article) ||
        _.first(_.property('authors')(this.article))
      return firstAuthor ? firstAuthor.surname : 'noauthor'
    },
    labelRowText () {
      return `${this.firstAuthorSurname} ${this.article.year}`
    },
    nCitedByText () {
      return _.isNil(this.article.nCitedBy)
        ? null
        : `Cited by ${this.article.nCitedBy}`
    }
  },
  asyncComputed: {
    async citedBySideColor () { return this.citedByColor },
    async referenceSideColor () { return this.referenceColor }
  }
}
</script>

<style scoped>
.vis-card {
  background: rgba(255, 255, 255, 0.0);
  border-style: solid;
  border-width: 1px;
  display: flex;
  overflow: hidden;
}
</style>
