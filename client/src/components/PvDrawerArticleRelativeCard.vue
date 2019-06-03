<template>
  <pv-vis-meta-card :label="label" :main="title" :left-attr="venue"
    :right-attr="nCitedByText" :left-side-color="collReferenceColor"
    :right-side-color="collCitedByColor" style="cursor: pointer;"
    :class="elevation" v-on="$listeners" @mouseenter.native.stop="onMouseEnter"
    @mouseleave.native.stop="onMouseLeave">
  </pv-vis-meta-card>
</template>

<script>
import PvArticleHoverMixin from './pvarticlehovermixin.js'
import PvArticleInfoMixin from './pvarticleinfomixin.js'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

export default {
  name: 'PvDrawerArticleRelativeCard',
  components: { PvVisMetaCard },
  mixins: [ PvArticleHoverMixin, PvArticleInfoMixin ],
  props: {
    userId: String,
    collId: String,
    artId: String
  },
  computed: {
    elevation () {
      return this.isHovering ? 'elevation-6' : ''
    }
  }
}
</script>
