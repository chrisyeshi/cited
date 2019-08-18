<template>
  <v-list-item v-on="$listeners" @pointerenter.native="onMouseEnter"
    @pointerleave.native="onMouseLeave">
    <div :style="leftSideStyle"></div>
    <v-list-item-content style="justify-content: space-evenly;">
      <div class="caption text-truncate font-weight-bold">{{ label }}</div>
      <div class="body-1 text-truncate font-weight-medium full-width">
        {{ title }}
      </div>
      <div class="caption text-truncate font-weight-light full-width">
        {{ abstract }}
      </div>
      <pv-drawer-article-stats-row class="caption font-weight-thin"
        :venue="venue" :year="year" :nReferences="nReferences"
        :nCitedBys="nCitedBys">
      </pv-drawer-article-stats-row>
    </v-list-item-content>
    <div :style="rightSideStyle"></div>
  </v-list-item>
</template>

<script>
import createPvArticleHoverMixin from '@/components/pvarticlehovermixin.js'
import PvCollArtInfoMixin from './pvcollartinfomixin.js'
import PvDrawerArticleStatsRow from '@/components/PvDrawerArticleStatsRow.vue'

const PvArticleHoverMixin = createPvArticleHoverMixin(obj => obj.art.artHash)

export default {
  name: 'PvDrawerArticleListTile',
  components: { PvDrawerArticleStatsRow },
  mixins: [ PvArticleHoverMixin, PvCollArtInfoMixin ],
  props: {
    art: Object
  },
  data: () => ({
    sideWidth: '8px'
  }),
  computed: {
    leftSideStyle () {
      return {
        position: 'absolute',
        width: this.sideWidth,
        height: '100%',
        left: '0px',
        background: this.collReferenceColor
      }
    },
    rightSideStyle () {
      return {
        position: 'absolute',
        width: this.sideWidth,
        height: '100%',
        right: '0px',
        background: this.collCitedByColor
      }
    }
  }
}
</script>

<style scoped>
.full-width {
  width: 100%;
}

.stats-row {
  width: 100%;
  display: flex;
}

.stats-row-venue {
  flex-grow: 1;
}

.stats-row-delimiter {
  margin-left: 0.75em;
  margin-right: 0.75em;
}
</style>
