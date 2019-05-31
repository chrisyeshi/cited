<template>
  <pv-vis-meta-card :label="label" :main="title" :left-attr="venue"
    :right-attr="nCitedByText" :left-side-color="collReferenceColor"
    :right-side-color="collCitedByColor">
  </pv-vis-meta-card>
</template>

<script>
import PvArticleInfoMixin from './pvarticleinfomixin.js'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

export default {
  name: 'PvDrawerArticleRelativeCard',
  components: { PvVisMetaCard },
  mixins: [ PvArticleInfoMixin ],
  props: {
    userId: String,
    collId: String,
    artId: String
  }
}
</script>
