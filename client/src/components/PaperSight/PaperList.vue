<template>
  <div>
    <v-toolbar dense>
      <v-toolbar-title>Papers</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" small outline @click="$emit('selectFiles')">
        + Add Papers
      </v-btn>
    </v-toolbar>
    <v-card>
      <v-list two-line>
        <template v-for="(paper, index) in papers">
          <v-list-tile
            :key="paper.title"
            avatar
            ripple
            style="cursor: pointer"
          >
            <v-list-tile-action>
              <v-list-tile-action-text>{{ paper.year }}</v-list-tile-action-text>
            </v-list-tile-action>
            <!-- <v-list-tile-action>
              <v-icon
                v-if="selected.indexOf(index) < 0"
                color="grey lighten-1"
                @click="toggle(index)"
              >
                star_border
              </v-icon>
              <v-icon
                v-else
                color="yellow darken-2"
                @click="toggle(index)"
              >
                star
              </v-icon>
            </v-list-tile-action> -->
            <v-list-tile-content @click="viewPaper(index)">
              <v-list-tile-title><span class="dot" v-bind:style="'background-color: ' + paper.color"></span>
                {{ paper.title }}
              </v-list-tile-title>
              <v-list-tile-sub-title class="text--primary">{{ showAuthorNames(paper.authors) }}</v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-icon @click="editPaperInfo(index)">edit</v-icon>
            </v-list-tile-action>
          </v-list-tile>
          <v-divider
            v-if="index + 1 < papers.length"
            :key="index"
          ></v-divider>
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'PaperList',
  data () {
    return {
      papers: []
    }
  },

  methods: {
    addPaper (paper) {
      this.papers.push(paper)
    },

    viewPaper (index) {
      this.$emit('viewPaper', index)
    },

    editPaperInfo (index) {
      let paper = this.papers[index]
      paper.author = this.showAuthorNames(paper.authors)
      this.$emit('editPaperInfo', paper)
      this.$emit('viewPaper', index)
    },

    showAuthorNames (authors) {
      if (Array.isArray(authors)) {
        return authors.map((author) => author.name).join(', ')
      }
    }
  }
}
</script>
