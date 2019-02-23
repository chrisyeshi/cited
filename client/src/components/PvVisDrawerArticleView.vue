<template>
  <v-container fluid grid-list-md>
    <v-layout column>
      <v-layout row ma-0 justify-start>
        <v-flex tag="a" shrink @click="$emit('edit-clicked', $event)">
          EDIT
        </v-flex>
        <v-flex shrink>-</v-flex>
        <v-flex tag="a" shrink>ADD TO</v-flex>
      </v-layout>
      <v-flex tag="h3" class="headline font-weight-light">
        {{ article.data.title }}
      </v-flex>
      <v-flex>
        <pv-expandable-authors-links :authors="article.data.authors">
        </pv-expandable-authors-links>
      </v-flex>
      <v-flex tag=a class="text-truncate font-weight-medium">
        {{ article.data.year }}, {{ article.data.venue.name }}
      </v-flex>
      <v-flex class="text-truncate font-weight-medium">
        <a>References {{ article.nReferences }}</a> - <a>Cited by {{ article.nCitedBys }}</a>
      </v-flex>
      <v-flex tag="h4" class="font-weight-bold">Abstract</v-flex>
      <v-flex>
        <expandable-text :text="article.data.abstract"
          :text-limit="abstractTextLimit">
        </expandable-text>
      </v-flex>
      <v-layout row>
        <v-flex xs6>
          <v-flex tag="h4" shrink class="font-weight-bold">
            References ({{ article.nReferences }})
          </v-flex>
          <v-flex v-for="(referenceArticle, index) in article.references"
            :key="index" shrink class="caption">
            <pv-vis-card :article="referenceArticle" :config="cardConfig"
              :referenceColor="getCardReferenceColor(referenceArticle)"
              :citedByColor="getCardCitedByColor(referenceArticle)">
            </pv-vis-card>
          </v-flex>
        </v-flex>
        <v-flex xs6>
          <v-flex tag="h4" shrink class="font-weight-bold">
            Cited by ({{ article.nCitedBys }})
          </v-flex>
          <v-flex v-for="(citedByArticle, index) in article.citedBys"
            :key="index" shrink class="caption">
            <pv-vis-card :article="citedByArticle" :config="cardConfig"
              :referenceColor="getCardReferenceColor(citedByArticle)"
              :citedByColor="getCardCitedByColor(citedByArticle)">
            </pv-vis-card>
          </v-flex>
        </v-flex>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
import ExpandableText from './ExpandableText.vue'
import PvExpandableAuthorsLinks from './PvExpandableAuthorsLinks.vue'
import PvVisCard from './PvVisCard.vue'

export default {
  name: 'PvVisDrawerArticleView',
  components: {
    ExpandableText, PvExpandableAuthorsLinks, PvVisCard
  },
  props: {
    article: Object,
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function
  },
  data () {
    return {
      abstractTextLimit: 200
    }
  }
}
</script>

<style scoped>
</style>
