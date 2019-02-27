<template>
  <!-- TODO: render different styles depend on the article type -->
  <div class="vis-card"
    :style="{ borderRadius: config.borderRadius + config.unit }">
    <div :style="referenceSideStyle"></div>
    <div class="py-1 px-2" :style="rowsContainerStyle">
      <div class="text-xs-center font-weight-bold card-row">
        {{ labelRowText }}
      </div>
      <v-tooltip top close-delay=0>
        <div slot="activator" class="text-xs-center text-truncate card-row">
          {{ article.data.title }}
        </div>
        <span>{{ article.data.title }}</span>
      </v-tooltip>
      <div class="text-xs-center card-row" style="display: flex;">
        <span class="text-truncate" style="display: inline-flex; flex: 1; justify-content: center;">
          <span class="text-truncate" style="white-space: nowrap">
            {{ article.data.venue.name }}
          </span>
        </span>
        <span style="display: inline-flex; justify-content: center;">
          <span class="mx-2">-</span>
        </span>
        <span style="display: inline-flex; flex: 1; justify-content: center;">
          <span style="white-space: nowrap">
            Cited by {{ article.nCitedBys }}
          </span>
        </span>
      </div>
    </div>
    <div :style="citedBySideStyle"></div>
  </div>
</template>

<script>
export default {
  name: 'PvVisCard',
  props: {
    article: null,
    backgroundColor: {
      type: Object,
      default: () => ({ r: 255, g: 255, b: 255 })
    },
    citedByColor: null,
    config: {
      borderRadius: 0.65,
      height: 5.2,
      opacity: 0.8,
      sideDarkness: 0.2,
      sideWidth: 0.5,
      unit: 'em',
      width: 15
    },
    referenceColor: null
  },
  computed: {
    citedBySideStyle () {
      return {
        opacity: this.opacity,
        flex: `0 0 ${this.config.sideWidth}${this.config.unit}`,
        backgroundColor: this.citedByColor
      }
    },
    labelRowText () {
      return `${this.article.data.authors[0].surname} ${this.article.data.year}`
    },
    referenceSideStyle () {
      return {
        opacity: this.config.opacity,
        flex: `0 0 ${this.config.sideWidth}${this.config.unit}`,
        backgroundColor: this.referenceColor
      }
    },
    rowsContainerStyle () {
      return {
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '10px',
        background: `rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, ${this.config.opacity})`
      }
    }
  }
}
</script>

<style scoped>
.vis-card {
  background: rgba(255, 255, 255, 0.0);
  border-style: solid;
  border-width: 1px;
  display: flex;
  overflow: hidden;
}
</style>
