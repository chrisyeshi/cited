<template>
  <div>
    <v-card>
      <v-card-title primary-title>
        Common References
      </v-card-title>
      <paper-list :papers="citings"
        @populate="$emit('populate', $event)"
        @insert="$emit('insert', $event)"
        @detail="$emit('detail', $event)">
      </paper-list>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        Common Cited By
      </v-card-title>
      <paper-list :papers="citedBys"
        @populate="$emit('populate', $event)"
        @insert="$emit('insert', $event)"
        @detail="$emit('detail', $event)">
      </paper-list>
    </v-card>
  </div>
</template>

<script>
import PaperList from './PaperList.vue'
import * as api from './crossref.js'

export default {
  name: 'CommonRelatives',
  components: {
    PaperList
  },
  data () {
    return {
      papers: [],
      citings: [],
      citedBys: []
    }
  },
  methods: {
    setPapers: function (papers) {
      this.papers = papers
      const arrayOfCitingDois = papers.map(paper => {
        return paper.references.map(ref => ref.doi)
      })
      const arrayOfCitedByDois = papers.map(paper => {
        return paper.citedBy.map(citedBy => citedBy.doi)
      })
      const intersect2 = (a, b) => a.filter(x => b.includes(x))
      const intersect = (a, b, ...rest) => {
        if (b === undefined) {
          return a
        }
        const intersection = intersect2(a, b)
        return intersect(intersection, ...rest)
      }
      const commonCitingDois = intersect(...arrayOfCitingDois)
      const commonCitingPromises =
        commonCitingDois.map(doi => api.getPaperByDOI(doi).catch(() => null))
      Promise.all(commonCitingPromises).then(responses => {
        this.citings = responses.filter(res => res !== null)
      })
      const commonCitedByDois = intersect(...arrayOfCitedByDois)
      const commonCitedByPromises =
        commonCitedByDois.map(doi => api.getPaperByDOI(doi).catch(() => null))
      Promise.all(commonCitedByPromises).then(responses => {
        this.citedBys = responses.filter(res => res !== null)
      })
    }
  }
}
</script>
