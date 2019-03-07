<template>
  <pv-vis-drawer-article-form v-if="isEditing"
    :article-id="articleId"
    @submit="onSubmit"
    @cancel="onCancel">
  </pv-vis-drawer-article-form>
  <pv-vis-drawer-article-view v-else
    :article-id="articleId" :card-config="cardConfig"
    :get-card-cited-by-color="getCardCitedByColor"
    :get-card-reference-color="getCardReferenceColor"
    @edit-clicked="isEditing = true">
  </pv-vis-drawer-article-view>
</template>

<script>
import _ from 'lodash'
import PvVisDrawerArticleForm from './PvVisDrawerArticleForm.vue'
import PvVisDrawerArticleView from './PvVisDrawerArticleView.vue'

export default {
  name: 'PvVisDrawerEditableArticle',
  components: { PvVisDrawerArticleForm, PvVisDrawerArticleView },
  props: {
    articleId: String,
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function
  },
  data () {
    return {
      isEditing: false
    }
  },
  methods: {
    isArticleEqual (a, b) {
      return a.type === b.type && this.isArticleDataEqual(a.data, b.data) &&
        a.nReferences === b.nReferences &&
        _.isEqual(a.references, b.references) &&
        a.nCitedBys === b.nCitedBys && _.isEqual(a.citedBys, b.citedBys)
    },
    isArticleDataEqual (a, b) {
      return a.title === b.title && a.abstract === b.abstract &&
        a.year === b.year && a.venue === b.venue
    },
    onCancel () {
      this.isEditing = false
    },
    onSubmit (newArticle) {
      // if (!this.isArticleEqual(this.article, newArticle)) {
      //   this.$emit('article-edited', newArticle, this.article)
      // }
      this.isEditing = false
    }
  },
  watch: {
    article () {
      this.isEditing = false
    }
  }
}
</script>
