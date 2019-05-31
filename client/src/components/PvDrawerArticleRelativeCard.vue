<template>
  <pv-vis-meta-card :label="label" :main="title" :left-attr="venue"
    :right-attr="nCitedByText" :left-side-color="currCollReferenceColor"
    :right-side-color="currCollCitedByColor">
  </pv-vis-meta-card>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import gql from 'graphql-tag'
import getVisCardSideColor from './getviscardsidecolor.js'
import PvVisMetaCard from '@/components/PvVisMetaCard.vue'

export default {
  name: 'PvDrawerArticleRelativeCard',
  components: { PvVisMetaCard },
  props: {
    artId: String
  },
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId' ]),
    currCollReferenceColor () {
      const isInColl =
        (coll, artId) => _.find(coll.articles, art => art.artId === artId)
      const nInCollReferences =
        _.sumBy(
          this.references, art => isInColl(this.currColl, art.artId) ? 1 : 0)
      return getVisCardSideColor(nInCollReferences)
    },
    currCollCitedByColor () {
      const nInCollCitedBys = _.sumBy(this.currCollArts, collArt => {
        const isReferencingThisArt =
          _.find(
            collArt.references.articles, refArt => refArt.artId === this.artId)
        return isReferencingThisArt ? 1 : 0
      })
      return getVisCardSideColor(nInCollCitedBys)
    },
    firstAuthorSurname () {
      return _.property('authors[0].surname')(this.thisArt)
    },
    label () {
      return `${this.firstAuthorSurname} ${this.year}`
    },
    nCitedByText () {
      return `Cited by ${_.property('nCitedBys')(this.thisArt)}`
    },
    title () {
      return _.property('title')(this.thisArt)
    },
    venue () {
      return _.property('venues[0].name')(this.thisArt)
    },
    year () {
      return _.property('year')(this.thisArt)
    },
    currCollArts () {
      return _.property('articles')(this.currColl)
    },
    references () {
      return _.property('references.articles')(this.thisArt)
    }
  },
  asyncComputed: {
    async thisArt () {
      const GetUserCollectionArticle = `
        query getUserCollectionArticle(
          $userId: ID!, $collId: ID!, $artId: ID!) {
          getUserCollectionArticle(
            userId: $userId, collId: $collId, artId: $artId) {
            userId
            collId
            artId
            type
            title
            year
            authors {
              surname
              given
            }
            venues {
              name
            }
            nCitedBys
            nReferences
            references {
              articles {
                userId
                collId
                artId
              }
            }
          }
        }
      `
      const result = await this.$apollo.query({
        query: gql(GetUserCollectionArticle),
        variables: {
          userId: this.currUserId,
          collId: this.currCollId,
          artId: this.artId
        }
      })
      return result.data.getUserCollectionArticle
    },
    async currColl () {
      const GetUserCollection = `
        query getUserCollection($userId: ID!, $collId: ID!) {
          getUserCollection(userId: $userId, collId: $collId) {
            userId
            collId
            articles {
              userId
              collId
              artId
              references {
                articles {
                  userId
                  collId
                  artId
                }
              }
            }
          }
        }
      `
      const result = await this.$apollo.query({
        query: gql(GetUserCollection),
        variables: {
          userId: this.currUserId,
          collId: this.currCollId
        }
      })
      return result.data.getUserCollection
    }
  }
}
</script>
