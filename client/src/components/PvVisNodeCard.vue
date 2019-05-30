<template>
  <pv-vis-article-card v-bind="$attrs" :article="article"
    :cited-by-color="citedByColorComputed"
    :reference-color="referenceColorComputed">
  </pv-vis-article-card>
</template>

<script>
import _ from 'lodash'
import { Article, Paper, Venue } from './pvmodels.js'
import PvVisArticleCard from '@/components/PvVisArticleCard.vue'

// TODO: convert to a functional component
export default {
  name: 'PvVisNodeCard',
  components: { PvVisArticleCard },
  props: {
    visNode: Object,
    citedByColor: [ String, Promise, Function ],
    referenceColor: [ String, Promise, Function ]
  },
  asyncComputed: {
    article: {
      default: new Article('', '', new Paper('', '', 0, [], new Venue(''))),
      async get () {
        return this.visNode.artSrc.getMeta(this.visNode.articleId)
      }
    },
    citedByColorComputed () {
      return _.isFunction(this.citedByColor)
        ? this.citedByColor(this.articleId)
        : this.citedByColor
    },
    referenceColorComputed () {
      return _.isFunction(this.referenceColor)
        ? this.referenceColor(this.articleId)
        : this.referenceColor
    }
  }
}
</script>
