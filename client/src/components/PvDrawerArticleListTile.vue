<template>
  <v-list-tile v-on="$listeners">
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
  </v-list-tile>
</template>

<script>
import PvDrawerArticleStatsRow from '@/components/PvDrawerArticleStatsRow.vue'

export default {
  name: 'PvDrawerArticleListTile',
  components: { PvDrawerArticleStatsRow },
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
