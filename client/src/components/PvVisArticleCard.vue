<template>
  <pv-vis-meta-card :label="labelRowText" :main="article.data.title"
    :left-attr="article.data.venue ? article.data.venue.name : ''"
    :right-attr="`Cited by ${article.nCitedBys}`"
    :left-side-color="referenceSideColor" :right-side-color="citedBySideColor"
    :background-color="backgroundColorText" :config="config">
  </pv-vis-meta-card>
</template>

<script>
import _ from 'lodash'
import { Article, Paper, Venue } from './pvmodels.js'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

export default {
  name: 'PvVisArticleCard',
  components: { PvVisMetaCard },
  props: {
    article: {
      type: Object,
      default: new Article('', '', new Paper('', '', 0, [], new Venue('')))
    },
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
      const firstAuthor = _.first(this.article.data.authors)
      return firstAuthor ? firstAuthor.surname : 'noauthor'
    },
    labelRowText () {
      return `${this.firstAuthorSurname} ${this.article.data.year}`
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
