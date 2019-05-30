<template>
  <pv-vis-article-card v-bind="$attrs" :article="articleComputed"
    :cited-by-color="citedByColorComputed"
    :reference-color="referenceColorComputed">
  </pv-vis-article-card>
</template>

<script>
import _ from 'lodash'
import { Article, Paper, Venue } from './pvmodels.js'
import { mapState } from 'vuex'
import gql from 'graphql-tag'
import PvVisArticleCard from './PvVisArticleCard.vue'

export default {
  name: 'PvVisCard',
  components: { PvVisArticleCard },
  props: {
    article: [ String, Object, Promise ],
    citedByColor: [ String, Promise, Function ],
    referenceColor: [ String, Promise, Function ]
  },
  computed: {
    ...mapState('parseVis', [ 'currMyCollId' ]),
    articleId () {
      return this.articleComputed ? this.articleComputed.id : null
    }
  },
  asyncComputed: {
    articleComputed: {
      default: new Article('', '', new Paper('', '', 0, [], new Venue(''))),
      async get () {
        return _.isString(this.article)
          ? this.queryCollectionArticle(this.article)
          : this.article
      }
    },
    citedByColorComputed () {
      return _.isFunction(this.citedByColor)
        ? this.citedByColor(this.articleId)
        : this.citedByColor
    },
    referenceColorComputed () {
      return _.isFunction(this.referenceColor)
        ? this.referenceColor(this.articleId)
        : this.referenceColor
    }
  },
  methods: {
    async queryCollectionArticle (artId) {
      const collId = this.currMyCollId
      const result = await this.$apollo.query({
        query: gql(GetMyCollectionArticle),
        variables: {
          collId: collId,
          artId: artId
        }
      })
      const flatArt = result.data.getMyCollectionArticle
      return new Article(
        flatArt.artId /* id */,
        flatArt.type /* type */,
        new Paper(
          flatArt.title /* title */,
          flatArt.abstract /* abstract */,
          flatArt.year /* year */,
          flatArt.authors /* authors */,
          flatArt.venue /* venue */)/* data */,
        flatArt.nReferences /* nReferences */,
        [] /* references */,
        flatArt.nCitedBys /* nCitedBys */,
        flatArt.externs /* externs */)
    }
  }
}

const GetMyCollectionArticle = `
  query getMyCollectionArticle($collId: ID!, $artId: ID!) {
    getMyCollectionArticle(collId: $collId, artId: $artId) {
      userId
      collId
      artId
      type
      title
      abstract
      year
      authors {
        surname
        given
      }
      nReferences
      nCitedBys
    }
  }
`
</script>
