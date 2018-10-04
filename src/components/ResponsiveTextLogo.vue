<template>
  <v-flex d-flex style="cursor: pointer;" v-resize="onResize"
    @click="$emit('click', $event)">
    <span class="grey--text text--darken-2 display-1">D</span>
    <v-scroll-x-reverse-transition>
      <span v-if="windowSize.width > 600"
        class="grey--text text--darken-2 display-1">
        isco
      </span>
    </v-scroll-x-reverse-transition>
  </v-flex>
</template>

<script>
export default {
  name: 'ResponsiveTextLogo',
  components: {
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
