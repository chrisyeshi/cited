<template>
  <pv-vis-article-card v-bind="$attrs" :article="articleComputed"
    :cited-by-color="citedByColorComputed"
    :reference-color="referenceColorComputed">
  </pv-vis-article-card>
</template>

<script>
import _ from 'lodash'
import { Article, Paper, Venue } from './pvmodels.js'
import PvVisArticleCard from './PvVisArticleCard.vue'
import theArticlePool from './pvarticlepool.js'

export default {
  name: 'PvVisCard',
  components: { PvVisArticleCard },
  props: {
    article: [ String, Object, Promise ],
    citedByColor: [ String, Promise, Function ],
    referenceColor: [ String, Promise, Function ]
  },
  computed: {
    articleId () {
      return this.articleComputed ? this.articleComputed.id : null
    }
  },
  asyncComputed: {
    articleComputed: {
      default: new Article('', '', new Paper('', '', 0, [], new Venue(''))),
      async get () {
        return _.isString(this.article)
          ? theArticlePool.getMeta(this.article)
          : this.article
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
