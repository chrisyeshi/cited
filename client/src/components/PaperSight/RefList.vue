<template>
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
        <td class="subheading">{{ props.item.title }} <span class="caption" v-if="props.item.venue">({{ props.item.venue }})</span></td>
        <td class="text-xs-right">{{ props.item.year }}<br /></td>
        <td class="text-xs-right">{{ showAuthorNames(props.item.authorNames) }}<br /></td>
        <td class="text-xs-right">{{ props.item.citedBysCount }}</td>
      </template>
      <v-alert slot="no-results" :value="true" color="error" icon="warning">
        Your search for "{{ search }}" found no results.
      </v-alert>
    </v-data-table>
  </v-card>
</template>

<script>
export default {
  name: 'Paper',
  data () {
    return {
      search: '',
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
    showTitle (title) {
      return (title.length > 64) ? title.slice(0, 63) + ' ...' : title
    },
    showAuthorNames (authors) {
      if (Array.isArray(authors)) {
        return authors.map((author) => author.name).join(', ')
      }
    }
  }
}
</script>
