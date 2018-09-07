<template>
  <div>
    <v-card flat>
      <v-card-title primary-title>
        <div>
          <h3>{{ paper.title }}</h3>
          <div>{{ authorText }}</div>
          <div>year: {{ paper.year }}, referenced: {{ paper.references.length }}, cited by: {{ paper.citationCount }}</div>
          <div>doi: <a target="_blank" :href="`https://doi.org/${paper.doi}`">{{ paper.doi }}</a></div>
        </div>
      </v-card-title>
      <v-card-actions>
        <v-btn flat @click="$emit('back')">Back</v-btn>
        <v-btn flat @click="$emit('populate', paper)">Populate</v-btn>
        <v-btn flat @click="$emit('insert', paper)">Insert</v-btn>
      </v-card-actions>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        <div>
          <h4>Abstract</h4>
          <div>{{ paper.abstract }}</div>
        </div>
      </v-card-title>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        <div>
          <h4>References</h4>
          <v-list>
            <v-list-tile v-for="(item, index) in paper.references" :key="index">
              {{ item }}
            </v-list-tile>
          </v-list>
          <paper-list :papers="[]"></paper-list>
        </div>
      </v-card-title>
    </v-card>
    <v-card>
      <v-card-title primary-title>
        <div>
          <h4>Cited by</h4>
          <v-list>
            <v-list-tile v-for="(item, index) in paper.citedBy" :key="index">
              {{ item }}
            </v-list-tile>
          </v-list>
        </div>
      </v-card-title>
    </v-card>
    <v-card>
      <v-card-text>
        {{ paper }}
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import PaperList from './PaperList.vue'

export default {
  name: 'PaperDetail',
  components: {
    PaperList
  },
  props: {
    paper: Object
  },
  computed: {
    authorText () {
      return this.formatAuthors(this.paper.authors)
    }
  },
  methods: {
    // TODO: these two functions are duplicated from PaperList.vue
    formatAuthor: function (authorObj) {
      if (!authorObj.family) {
        throw new Error('the family name of the author is not provided. ' + JSON.stringify(authorObj))
      }
      if (!authorObj.given) {
        return authorObj.family
      }
      return `${authorObj.family}, ${authorObj.given}`
    },

    formatAuthors: function (authorObjs) {
      return authorObjs.map(authorObj => this.formatAuthor(authorObj)).join(' and ')
    }
  }
}
</script>
