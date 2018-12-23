<template>
  <v-app id="inspire">
    <v-dialog
      v-model="dialog"
      hide-overlay
      persistent
      width="300"
    >
      <v-card
        color="primary"
        dark
      >
        <v-card-text>
          Please wait while we extracting info and references from PDF files ...
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-toolbar app fixed clipped-left flat>
      <v-toolbar-side-icon></v-toolbar-side-icon>
      <v-toolbar-title>Referson</v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn color="primary" outline @click="selectFiles">
        Import PDFs
      </v-btn>
      <input style="display: none" type="file" ref="InputFiles" multiple @change="openFiles" />
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height class="pa-2">
        <v-layout justify-center align-center>
          <v-flex xs5 fill-height class="pa-2">
            <v-toolbar dense>
              <v-toolbar-title>Papers</v-toolbar-title>
              <!-- <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn> -->
              <v-spacer></v-spacer>
              <v-btn icon>
                <v-icon>apps</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card>
              <v-list two-line>
                <template v-for="(paper, index) in papers">
                  <v-list-tile
                    :key="paper.title"
                    avatar
                    ripple
                    @mouseenter="hover(index)"
                  >
                    <v-list-tile-content>
                      <v-list-tile-title><span class="dot" v-bind:style="'background-color: ' + paper.color"></span>
                        {{ paper.title }}
                      </v-list-tile-title>
                      <v-list-tile-sub-title class="text--primary">{{ showAuthorNames(paper.authors) }}</v-list-tile-sub-title>
                    </v-list-tile-content>

                    <v-list-tile-action>
                      <v-list-tile-action-text>{{ paper.year }}</v-list-tile-action-text>
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
                    </v-list-tile-action>

                  </v-list-tile>
                  <v-divider
                    v-if="index + 1 < papers.length"
                    :key="index"
                  ></v-divider>
                </template>
              </v-list>
            </v-card>
          </v-flex>
          <v-flex xs7 fill-height class="pa-2">
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
                  <td>{{ props.item.title }}</td>
                  <td class="text-xs-right">{{ props.item.year }}</td>
                  <td class="text-xs-right">{{ showAuthorNames(props.item.authorNames) }}</td>
                  <td class="text-xs-right">{{ props.item.citedBysCount }}</td>
                </template>
                <v-alert slot="no-results" :value="true" color="error" icon="warning">
                  Your search for "{{ search }}" found no results.
                </v-alert>
              </v-data-table>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <v-footer app fixed>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script>
import PdfLoader from './PdfLoader'
import {PaperGraph} from '../../../model/PaperGraph'

export default {
  name: 'Contail',
  data () {
    return {
      papers: [],
      references: [],
      drawer: false,
      selected: [],
      graph: [],
      search: '',
      dialog: false,
      headers: [
        { text: 'Title', value: 'title', sortable: false },
        { text: 'Year', value: 'year' },
        { text: 'Authors', value: 'authorNames', sortable: false },
        { text: 'CitedBysCount', value: 'citedBysCount' }
      ]
    }
  },
  created: function () {
    this.graph = new PaperGraph({})
  },
  methods: {
    hover: function (index) {
      // console.log(index)
    },

    toggle (index) {
      const i = this.selected.indexOf(index)

      if (i > -1) {
        this.selected.splice(i, 1)
      } else {
        this.selected.push(index)
      }
    },

    showAuthorNames (authors) {
      if (Array.isArray(authors)) {
        return authors.map((author) => author.name).join(', ')
      }
    },

    selectFiles () {
      const elem = this.$refs.InputFiles
      elem.click()
    },

    openFiles ($event) {
      let files = $event.target.files
      let getAllPdfs = []
      let getAllPaperInfos = []
      let getAllReferences = []
      if (files.length === 0) return
      this.dialog = true
      for (let file of files) {
        let fileReader = new FileReader()
        getAllPdfs.push(new Promise(function (resolve, reject) {
          fileReader.onload = (evt) => {
            let pdf = new PdfLoader(new Uint8Array(evt.target.result))
            resolve(pdf)
          }
        }))
        fileReader.readAsArrayBuffer(file)
      }
      Promise.all(getAllPdfs).then(pdfs => {
        for (let pdf of pdfs) {
          getAllPaperInfos.push(pdf.getInfo())
          getAllReferences.push(pdf.getReferences())
        }
        return Promise.all(getAllPaperInfos)
      }).then(papers => {
        Promise.all(getAllReferences).then((allRefs) => {
          for (let i = 0; i < papers.length; i++) {
            let paper = papers[i]
            let refs = allRefs[i]
            let newPaper = {}
            newPaper.title = paper.title
            newPaper.year = paper.year
            newPaper.authors = paper.authors.filter(authorName => authorName !== '')
              .map((authorName) => {
                let author = {name: authorName}
                this.graph.insertAuthor(author)
                return author
              })

            let paperRefs = JSON.parse(refs.data)
            let references = paperRefs.map((ref) => {
              let refPaper = {}
              if (Array.isArray(ref.author)) {
                refPaper.authors = ref.author.map((author) => {
                  let authorName = [author.given, author.family].join(' ')
                  return this.graph.insertAuthor({name: authorName})
                }).filter((id) => Number.isInteger(id))
              }
              if (Array.isArray(ref.title)) {
                refPaper.title = ref.title[0]
                refPaper.authorNames = []
                refPaper.authors = (!Array.isArray(ref.author)) ? ref.author : ref.author.map((author) => {
                  let authorName = {name: [author.given, author.family].join(' ')}
                  refPaper.authorNames.push(authorName)
                  return this.graph.insertAuthor(authorName)
                })
                refPaper.year = Array.isArray(ref.date) ? ref.date[0] : 'unknown'
                refPaper.id = this.graph.insertPaper(refPaper)
                return refPaper
              }
            }).filter(p => p !== undefined && p.hasOwnProperty('id'))

            newPaper.references = references.map((ref) => ref.id)
            this.graph.insertPaper(newPaper)
            newPaper.references.forEach(rid => {
              this.graph.getPaperById(rid).citedBysCount = this.graph.getCitedBys(rid).length
            })
            newPaper.citedBysCount = this.graph.getCitedBys(newPaper.id).length
            this.papers.push(newPaper)
          }
          this.references = this.graph.getPapers().sort((a, b) => b.citedBysCount - a.citedBysCount)
          this.dialog = false
        })
      })
    }
  }
}
</script>

<style scoped>
.panel-row {
  min-height: 800px;
}

.dot {
  /* float: left; */
  height: 1em;
  width: 1em;
  background-color: #bbb;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5em;
}
</style>
