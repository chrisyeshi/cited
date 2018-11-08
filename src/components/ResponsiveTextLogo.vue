<template>
  <v-layout align-center style="cursor: pointer; min-width: 30px;" v-resize="onResize"
    @click="$emit('click', $event)">
    <span class="headline">D</span>
    <v-slide-x-transition>
      <span v-if="windowSize.width > 960"
        class="headline">
        <span>iscover</span><span v-if="full">y Engine</span>
      </span>
    </v-slide-x-transition>
  </v-layout>
</template>

<script>
export default {
  name: 'ResponsiveTextLogo',
  props: {
    full: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      windowSize: { width: 0, height: 0 }
    }
  },
  mounted () {
    this.onResize()
  },
  methods: {
    onResize () {
      this.windowSize = { width: window.innerWidth, height: window.innerHeight }
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
