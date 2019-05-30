<template>
  <v-list-tile class="my-3">
    <v-list-tile-content style="justify-content: space-evenly;">
      <div class="caption text-truncate font-weight-bold">{{ label }}</div>
      <div class="body-1 text-truncate font-weight-medium">{{ title }}</div>
      <div class="caption text-truncate font-weight-light">{{ abstract }}</div>
      <div class="caption text-truncate font-weight-thin stats-row">
        <div class="text-truncate stats-row-venue">{{ venue }}</div>
        <div class="stats-row-delimiter">-</div>
        <div>{{ year }}</div>
        <div class="stats-row-delimiter">-</div>
        <div>Referencing {{ nReferences }}</div>
        <div class="stats-row-delimiter">-</div>
        <div>Cited by {{ nCitedBys }}</div>
      </div>
    </v-list-tile-content>
  </v-list-tile>
</template>

<script>
export default {
  name: 'PvDrawerArticleListTile',
  props: {
    article: Object
  },
  computed: {
    label () {
      return `${this.article.authors[0].surname} ${this.article.year}`
    },
    title () {
      return this.article.title
    },
    abstract () {
      return this.article.abstract
    },
    venue () {
      return this.article.venues && this.article.venues[0] &&
        this.article.venues[0].name
    },
    year () {
      return this.article.year
    },
    nReferences () {
      return this.article.nReferences
    },
    nCitedBys () {
      return this.article.nCitedBys
    }
  }
}
</script>

<style scoped>
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
