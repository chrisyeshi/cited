<template>
  <v-combobox v-bind="$attrs" persistent-hint :hint="hint"
    v-model="select" :items="autocompleteArticles" item-text="data.title"
    return-object :label="label" @change="onChanged">
  </v-combobox>
</template>

<script>
import _ from 'lodash'
import theArticlePool from './pvarticlepool.js'
import { Article, Paper } from './pvmodels.js'

export default {
  name: 'PvArticleSelect',
  props: {
    value: [ String, Object ]
  },
  data () {
    return {
      select: this.article
    }
  },
  computed: {
    article () {
      if (_.isString(this.value)) {
        return theArticlePool.getArticle(this.value)
      }
      return this.value
    },
    autocompleteArticles () {
      return theArticlePool.metas
    },
    hint () {
      return this.isArticleExist
        ? `${this.select.data.venue.name} - Cited by ${this.select.nCitedBys}`
        : 'New article'
    },
    isArticleExist () {
      return theArticlePool.includes(this.select.id)
    },
    label () {
      return this.isArticleExist
        ? `${this.select.data.authors[0].surname} ${this.select.data.year}`
        : this.$attrs.label
    }
  },
  methods: {
    onChanged (input) {
      if (_.isString(input)) {
        this.$emit(
          'input', new Article('', 'paper', new Paper(input /* title */)))
      } else {
        this.$emit('input', input.id /* article */)
      }
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (curr) {
        this.select = this.article
      }
    }
  }
}
</script>
