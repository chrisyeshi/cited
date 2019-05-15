<template>
  <v-flex>
    <v-card>
      <v-card-title>
        All References
        <v-btn color="primary" small outline @click="exportAsJson()">
          Export
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="search"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="references"
        :search="search"
        :rows-per-page-items="[10, 15, 25, 50]"
      >
        <template slot="items" slot-scope="props">
          <td class="subheading" @mouseenter="hoverId = props.item.id">{{ props.item.title }} <span class="caption" v-if="props.item.venue">({{ props.item.venue }})</span> <v-icon v-if="props.item.id == hoverId" @click="editReference(props.item.id)">edit</v-icon></td>
          <td class="text-xs-right">{{ props.item.year }}<br /></td>
          <td class="text-xs-right">{{ showAuthorNames(props.item.authorNames)  }}<br /></td>
          <td class="text-xs-right">{{ props.item.citedByCount }}</td>
        </template>
        <v-alert slot="no-results" :value="true" color="error" icon="warning">
          Your search for "{{ search }}" found no results.
        </v-alert>
      </v-data-table>
    </v-card>
    <v-dialog
      v-model="dialog"
      max-width="50%"
    >
      <v-card>
        <v-card-title class="headline">Reference Info &amp; Edit</v-card-title>

        <v-card-text>
          {{selectedReference.origin}}
        </v-card-text>
        <v-card-text>
          <v-textarea
            rows="10"
            outline
            v-model="editedRefInfo"

          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            flat="flat"
            @click="saveRefInfo()"
          >
            Save
          </v-btn>
          <v-btn
            flat="flat"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-flex>
</template>

<script>
export default {
  name: 'Paper',
  data () {
    return {
      search: '',
      dialog: false,
      hoverId: null,
      selectedReference: {},
      references: [],
      editedRefInfo: '',
      headers: [
        { text: 'Title', value: 'title', sortable: false },
        { text: 'Year', value: 'year' },
        { text: 'Authors', value: 'authorNames' },
        { text: 'Cited By', value: 'citedByCount' }
      ]
    }
  },
  methods: {
    update (paperReferences) {
      this.references = paperReferences
    },
    append (refPaper) {
      this.references.push(refPaper)
    },
    showTitle (title) {
      return (title.length > 64) ? title.slice(0, 63) + ' ...' : title
    },
    showAuthorNames (authors) {
      if (Array.isArray(authors)) {
        return authors.join(', ')
      }
    },
    editReference (paperId) {
      this.selectedReference = this.references.find(ref => ref.id === paperId)
      this.dialog = ~this.dialog
      this.editedRefInfo = this.showRefInfo()
    },
    showRefInfo (providedRef, includeOrigin = false) {
      let ref = providedRef || this.selectedReference
      if (!ref.title) return
      let refInfo = {
        title: ref.title,
        authorNames: ref.authorNames.join(', '),
        venue: ref.venue,
        publisher: ref.publisher,
        pages: ref.pages,
        volume: ref.volume,
        issue: ref.issue
      }
      if (includeOrigin) {
        refInfo.origin = ref.origin
      }
      return JSON.stringify(refInfo, null, 4)
    },
    saveRefInfo () {
      let edited = JSON.parse(this.editedRefInfo)
      edited.authorNames = edited.authorNames.split(',').map(a => a.trim())
      this.selectedReference = Object.assign(this.selectedReference, edited)
      this.dialog = false
      this.$emit('saveRefInfo', this.selectedReference)
    },
    exportAsJson () {
      let text = this.references.map(ref => this.showRefInfo(ref, true))
      text = '[' + text.join(', ') + ']'
      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
      element.setAttribute('download', 'references.json')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }
}
</script>
