<template>
  <div class="vis-card" :style="cardStyle" v-on="$listeners">
    <div :style="leftSideStyle"></div>
    <div class="py-1 px-2" :style="rowsContainerStyle">
      <!-- TODO: truncate only the author name and leave the year alone -->
      <div class="text-xs-center font-weight-bold card-row text-truncate">
        {{ label }}
      </div>
      <v-tooltip top close-delay=0>
        <div slot="activator" v-line-clamp="config.lineClamp"
          class="text-xs-center card-row font-italic"
          :style="{ lineHeight: config.titleLineHeight }">
          {{ main }}
        </div>
        <span>{{ main }}</span>
      </v-tooltip>
      <div v-if="isAttrRowVisible" class="text-xs-center card-row"
        style="display: flex; align-items: center;">
        <span v-if="isLeftAttrVisible" class="text-truncate"
          style="display: inline-flex; flex: 1; justify-content: center;">
          <span class="text-truncate" style="white-space: nowrap">
            {{ leftAttr }}
          </span>
        </span>
        <span v-if="!isSingleAttrVisible"
          style="display: inline-flex; justify-content: center;">
          <span class="mx-2">-</span>
        </span>
        <span v-if="isRightAttrVisible"
          style="display: inline-flex; flex: 1; justify-content: center;">
          <span style="white-space: nowrap">
            {{ rightAttr }}
          </span>
        </span>
      </div>
    </div>
    <div :style="rightSideStyle"></div>
  </div>
</template>

<script>
export default {
  name: 'PvVisMetaCard',
  props: {
    label: String,
    main: String,
    leftAttr: String,
    rightAttr: String,
    leftSideColor: String,
    rightSideColor: String,
    backgroundColor: String,
    config: {
      type: Object,
      default: () => ({
        borderRadius: 0.65,
        height: 6.8,
        lineClamp: 2,
        opacity: 0.8,
        sideDarkness: 0.2,
        sideWidth: 0.5,
        titleLineHeight: 1.3,
        unit: 'em',
        width: 15
      })
    }
  },
  computed: {
    cardStyle () {
      return {
        borderRadius: `${this.config.borderRadius}${this.config.unit}`,
        height: `${this.config.height}${this.config.unit}`
      }
    },
    sideStyle () {
      return {
        opacity: this.config.opacity,
        flex: `0 0 ${this.config.sideWidth}${this.config.unit}`
      }
    },
    leftSideStyle () {
      return { ...this.sideStyle, backgroundColor: this.leftSideColor }
    },
    rightSideStyle () {
      return { ...this.sideStyle, backgroundColor: this.rightSideColor }
    },
    rowsContainerStyle () {
      return {
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '10px',
        background: this.backgroundColor
      }
    },
    isLeftAttrVisible () {
      return this.leftAttr
    },
    isRightAttrVisible () {
      return this.rightAttr
    },
    isAttrRowVisible () {
      return this.isLeftAttrVisible || this.isRightAttrVisible
    },
    isSingleAttrVisible () {
      return (this.isLeftAttrVisible && !this.isRightAttrVisible) ||
        (!this.isLeftAttrVisible && this.isRightAttrVisible)
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
