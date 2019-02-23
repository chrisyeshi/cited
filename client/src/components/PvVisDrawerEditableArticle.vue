<template>
  <pv-vis-drawer-article-form v-if="isEditing"
    :article="article"
    @submit="isEditing = false">
  </pv-vis-drawer-article-form>
  <pv-vis-drawer-article-view v-else
    :article="article" :card-config="cardConfig"
    :get-card-cited-by-color="getCardCitedByColor"
    :get-card-reference-color="getCardReferenceColor"
    @edit-clicked="isEditing = true">
  </pv-vis-drawer-article-view>
</template>

<script>
import PvVisDrawerArticleForm from './PvVisDrawerArticleForm.vue'
import PvVisDrawerArticleView from './PvVisDrawerArticleView.vue'

export default {
  name: 'PvVisDrawerEditableArticle',
  components: { PvVisDrawerArticleForm, PvVisDrawerArticleView },
  props: {
    article: Object,
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function
  },
  data () {
    return {
      isEditing: false
    }
  },
  watch: {
    article () {
      this.isEditing = false
    }
  }
}
</script>
