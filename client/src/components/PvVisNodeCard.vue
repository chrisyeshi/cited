<template>
  <pv-vis-article-card v-bind="$attrs" :article="article"
    :cited-by-color="citedByColorComputed"
    :reference-color="referenceColorComputed">
  </pv-vis-article-card>
</template>

<script>
import _ from 'lodash'
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
  computed: {
    article () { return this.visNode.art }
  },
  asyncComputed: {
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
