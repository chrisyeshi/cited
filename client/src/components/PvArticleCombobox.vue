<template>
  <v-combobox v-bind="$attrs" persistent-hint :hint="hint"
    v-model="select" :items="this.articlePool.articles" item-text="data.title" return-object
    :label="label" @change="onChanged">
  </v-combobox>
</template>

<script>
import _ from 'lodash'
import { Article, Paper } from './pvmodels.js'
import { mapState } from 'vuex'

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
    ...mapState('parseVis', [ 'articlePool' ]),
    article () {
      if (_.isString(this.value)) {
        return this.articlePool.getArticle(this.value)
      }
      return this.value
    },
    hint () {
      return this.isArticleExist
        ? `${this.select.data.venue.name} - Cited by ${this.select.nCitedBys}`
        : 'New article'
    },
    isArticleExist () {
      return this.articlePool.includes(this.select.id)
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
