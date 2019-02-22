<template>
  <div v-if="isTooLong && !isExpanded" class="font-weight-medium">
    <template v-for="(author, index) in firstNAuthors">
      <a :key="`name-${index}`">{{ author.surname }}, {{ author.given }}</a><span :key="`and-${index}`"> and </span>
    </template>
    <a @click="expand">+{{ nHiddenAuthors }}</a>
    <span> and </span>
    <a>{{ authors[authors.length - 1].surname }}, {{ authors[authors.length - 1].given }}</a>.
  </div>
  <div v-else class="font-weight-medium">
    <template v-for="(author, index) in authors">
      <a :key="`name-${index}`">{{ author.surname }}, {{ author.given }}</a><span :key="`and-${index}`" v-if="index < authors.length - 1"> and </span>
    </template>.
    <a v-if="isTooLong" class="font-weight-light"
      @click="shrink">
      (SHOW LESS)
    </a>
  </div>
</template>

<script>
export default {
  name: 'PvExpandableAuthorsLinks',
  props: {
    authors: Array
  },
  data () {
    return {
      isExpanded: false,
      limit: 2
    }
  },
  computed: {
    isTooLong () {
      return this.authors.length > this.limit
    },
    nHiddenAuthors () {
      return this.authors.length - this.limit
    },
    firstNAuthors () {
      return this.authors.slice(0, this.limit - 1)
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
  watch: {
    authors () {
      this.isExpanded = false
    }
  }
}
</script>
