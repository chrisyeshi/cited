<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-side-icon @click="back">
        <v-icon>arrow_back</v-icon>
      </v-toolbar-side-icon>
      <v-toolbar-title v-if="art">{{ artLabel }}</v-toolbar-title>
      <v-toolbar-title v-else>
        <v-progress-circular indeterminate></v-progress-circular>
      </v-toolbar-title>
    </v-toolbar>
    <v-container fluid grid-list-md pa-3>
      <v-layout column>
        <v-flex tag="h3" class="headline">{{ title }}</v-flex>
        <v-flex class="font-weight-medium">
          <pv-expandable-authors-links :authors="authors">
          </pv-expandable-authors-links>
        </v-flex>
        <v-flex class="font-weight-light">
          <pv-drawer-article-stats-row :venue="venue" :year="year"
            :nReferences="nReferences" :nCitedBys="nCitedBys">
          </pv-drawer-article-stats-row>
        </v-flex>
        <v-flex class="font-weight-thin">
          <expandable-text :text="abstract" :textLimit="abstractLimit">
          </expandable-text>
        </v-flex>
        <v-layout row>
          <v-flex xs6>
            <v-flex tag="h4" shrink class="font-weight-bold">
              References ({{ nReferences }})
            </v-flex>
            <v-flex v-for="art in references" :key="art.artId"
              style="font-size: 12px;">
              <pv-drawer-article-relative-card :article="art">
              </pv-drawer-article-relative-card>
            </v-flex>
          </v-flex>
          <v-flex xs6>
            <v-flex tag="h4" shrink class="font-weight-bold">
              Cited by ({{ nCitedBys }})
            </v-flex>
            <v-flex v-for="art in citedBys" :key="art.artId"
              style="font-size: 12px;">
              <pv-drawer-article-relative-card :article="art">
              </pv-drawer-article-relative-card>
            </v-flex>
          </v-flex>
        </v-layout>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import gql from 'graphql-tag'
import ExpandableText from '@/components/ExpandableText.vue'
import getSampleCollection from './getsamplecollection.js'
import PvDrawerArticleRelativeCard from '@/components/PvDrawerArticleRelativeCard.vue'
import PvDrawerArticleStatsRow from '@/components/PvDrawerArticleStatsRow.vue'
import PvExpandableAuthorsLinks from '@/components/PvExpandableAuthorsLinks.vue'

export default {
  name: 'PvDrawerArticleView',
  components: {
    ExpandableText,
    PvDrawerArticleRelativeCard,
    PvDrawerArticleStatsRow,
    PvExpandableAuthorsLinks
  },
  data: () => ({
    abstractLimit: 200
  }),
  computed: {
    ...mapState('parseVis', [ 'currUserId', 'currCollId', 'currArtId' ]),
    artLabel () { return `${this.firstAuthorSurname} ${this.year}` },
    abstract () { return this.art && this.art.abstract },
    authors () { return this.art ? this.art.authors : [] },
    firstAuthorSurname () {
      return this.art && this.art.authors && this.art.authors[0] &&
        this.art.authors[0].surname
    },
    citedBys () {
      const arts = _.property('citedBys.articles')(this.art) || []
      return _.slice(arts, 0, 3)
    },
    references () {
      const arts = _.property('references.articles')(this.art) || []
      return _.slice(arts, 0, 3)
    },
    nCitedBys () { return this.art && this.art.nCitedBys },
    nReferences () { return this.art && this.art.nReferences },
    title () { return this.art && this.art.title },
    venue () {
      return this.art && this.art.venues && this.art.venues[0] &&
        this.art.venues[0].name
    },
    year () { return this.art && this.art.year }
  },
  asyncComputed: {
    async art () {
      if (this.currUserId === 'sample') {
        const coll = await getSampleCollection(this.currCollId)
        const flatArtsMap =
          Object.assign(
            {}, ..._.map(coll.articles, art => ({ [art.artId]: art })))
        const flatArt =
          _.find(coll.articles, art => art.artId === this.currArtId)
        const art = {
          ...flatArt,
          references: { articles: [] },
          citedBys: { articles: [] }
        }
        _.forEach(coll.relations, relation => {
          if (relation.referenceId === art.artId) {
            art.citedBys.articles.push(flatArtsMap[relation.citedById])
          } else if (relation.citedById === art.artId) {
            art.references.articles.push(flatArtsMap[relation.referenceId])
          }
        })
        return art
      }
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
            abstract
            year
            authors {
              surname
              given
            }
            venues {
              name
            }
            nReferences
            nCitedBys
            references(limit: 3) {
              nextToken
              articles {
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
                nReferences
                nCitedBys
              }
            }
            citedBys(limit: 3) {
              nextToken
              articles {
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
                nReferences
                nCitedBys
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
          artId: this.currArtId
        }
      })
      return result.data.getUserCollectionArticle
    }
  },
  methods: {
    back () {
      this.$router.push(`/demo?user=${this.currUserId}&coll=${this.currCollId}`)
      this.$store.commit('parseVis/set', { drawerState: 'collection-view' })
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>
