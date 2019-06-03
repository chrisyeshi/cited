<template>
  <v-list-tile v-on="$listeners" @mouseenter.native.stop="onMouseEnter"
    @mouseleave.native.stop="onMouseLeave">
    <div :style="leftSideStyle"></div>
    <v-list-tile-content style="justify-content: space-evenly;">
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
    </v-list-tile-content>
    <div :style="rightSideStyle"></div>
  </v-list-tile>
</template>

<script>
import PvArticleHoverMixin from './pvarticlehovermixin.js'
import PvArticleInfoMixin from './pvarticleinfomixin.js'
import PvDrawerArticleStatsRow from '@/components/PvDrawerArticleStatsRow.vue'

export default {
  name: 'PvDrawerArticleListTile',
  components: { PvDrawerArticleStatsRow },
  mixins: [ PvArticleHoverMixin, PvArticleInfoMixin ],
  props: {
    userId: String,
    collId: String,
    artId: String
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
