<template>
  <div>
    <span>{{ computedText }}</span>
    <span v-if="!isFullTextShown">...</span>
    <a v-if="!isTextShortEnough && !isExpanded" @click="expand">
      CONTINUE READING
    </a>
    <a v-show="!isTextShortEnough && isExpanded" @click="shrink">SHOW LESS</a>
  </div>
</template>

<script>
export default {
  name: 'ExpandableText',
  props: {
    text: String,
    textLimit: Number
  },
  data () {
    return {
      isExpanded: false
    }
  },
  methods: {
    expand () {
      this.isExpanded = true
    },
    shrink () {
      this.isExpanded = false
    }
  },
  computed: {
    isFullTextShown () {
      return this.isExpanded || this.isTextShortEnough
    },
    isTextShortEnough () {
      return this.text.length <= this.textLimit
    },
    computedText () {
      return this.isExpanded ? this.text : this.text.slice(0, this.textLimit)
    }
  },
  watch: {
    text () {
      this.isExpanded = false
    }
  }
}
</script>

<style scoped>
</style>
