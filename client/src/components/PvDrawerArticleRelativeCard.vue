<template>
  <pv-vis-meta-card :label="label" :main="title" :left-attr="venue"
    :right-attr="nCitedByText" :left-side-color="collReferenceColor"
    :right-side-color="collCitedByColor" style="cursor: pointer;"
    :class="elevation" v-on="$listeners" @pointerenter.native="onMouseEnter"
    @pointerleave.native="onMouseLeave">
  </pv-vis-meta-card>
</template>

<script>
import createPvArticleHoverMixin from '@/components/pvarticlehovermixin.js'
import PvCollArtInfoMixin from '@/components/pvcollartinfomixin.js'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

const PvArticleHoverMixin = createPvArticleHoverMixin(obj => obj.art.artHash)

export default {
  name: 'PvDrawerArticleRelativeCard',
  components: { PvVisMetaCard },
  mixins: [ PvArticleHoverMixin, PvCollArtInfoMixin ],
  props: {
    art: Object
  },
  computed: {
    elevation () {
      return this.isHovering ? 'elevation-6' : ''
    }
  }
}
</script>
