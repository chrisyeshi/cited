<template>
  <div class="text-truncate stats-row">
    <div class="text-truncate stats-row-venue">{{ venue }}</div>
    <div class="stats-row-delimiter">-</div>
    <div>{{ year }}</div>
    <div class="stats-row-delimiter">-</div>
    <div>Referencing {{ nReferences }}</div>
    <div class="stats-row-delimiter">-</div>
    <div>Cited by {{ nCitedBys }}</div>
  </div>
</template>

<script>
export default {
  name: 'PvDrawerArticleStatsRow',
  props: {
    venue: String,
    year: Number,
    nReferences: Number,
    nCitedBys: Number
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
