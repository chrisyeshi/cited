<template>
  <v-flex>
    <v-card>
      <v-card-title>
        All References
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
          <td class="text-xs-right">{{ props.item.citedBysCount }}</td>
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
            :value="showRefInfo()"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            flat="flat"
            @click="dialog = false"
          >
            Done
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
      headers: [
        { text: 'Title & Authors', value: 'titleAndAuthors', sortable: false },
        { text: 'Year', value: 'year' },
        { text: 'Authors', value: 'authorNames' },
        { text: 'Cited By', value: 'citedBysCount' }
      ]
    }
  },
  methods: {
    update (paperReferences) {
      this.references = paperReferences
    },
    append (refPaper) {
      console.log(refPaper.id)
      this.references.push(refPaper)
    },
    showTitle (title) {
      return (title.length > 64) ? title.slice(0, 63) + ' ...' : title
    },
    showAuthorNames (authors) {
      if (Array.isArray(authors)) {
        return authors.map((author) => author.name).join(', ')
      }
    },
    editReference (refId) {
      this.selectedReference = this.references[refId]
      this.dialog = ~this.dialog
    },
    showRefInfo (providedRef) {
      let ref = providedRef || this.selectedReference
      if (!ref.title) return
      let refInfo = {
        title: ref.title,
        author: ref.authorNames.map(author => author.name).join(', '),
        venue: ref.venue,
        publisher: ref.publisher,
        pages: ref.pages,
        volume: ref.volume,
        issue: ref.issue
      }
      return JSON.stringify(refInfo, null, 4)
    }
  }
}
</script>
