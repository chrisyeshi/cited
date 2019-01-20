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
      <v-toolbar-title>PaperSight</v-toolbar-title>
      <v-btn @click="isViewingPdf=false" flat>Show All References</v-btn>
      <v-spacer></v-spacer>
      <v-flex xs1 class="ma-2">
        <v-select
          dense
          :items="viewerModes"
          v-model="viewer"
          box
          label="PDF Viewer"
        ></v-select>
      </v-flex>
      <input style="display: none" type="file" ref="InputFiles" multiple @change="openFiles" />
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height class="pa-2">
        <v-layout justify-center align-center>
            <v-flex ref="MainPanel" xs7 fill-height class="pa-2">
            <v-card v-bind:class="{hidden: isViewingPdf}" fill-height>
              <RefList ref="PaperRefList"></RefList>
              <PdfViewer v-bind:class="{hidden: !isViewingPdf}" ref="PaperViewer"></PdfViewer>
            </v-card>
            <v-card  v-bind:class="{hidden: !isViewingPdf}" fill-height>
              <div ref="EmbeddedViewer"></div>
              <PdfViewer ref="PaperViewer"></PdfViewer>
            </v-card>
          </v-flex>
          <v-flex xs5 fill-height class="pa-2">
            <v-toolbar dense>
              <v-toolbar-title>Papers</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn color="primary" small outline @click="selectFiles">
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
                    @click="viewPaper(index)"
                  >
                    <v-list-tile-content v-if="isViewingPdf && selectedPaper == index">
                      <v-list-tile-title style="height: 2.5em">
                        <v-layout row>
                          <v-flex xs2>
                            <v-subheader>Title: </v-subheader>
                          </v-flex>
                          <v-flex xs10>
                            <v-text-field
                              required
                              :value=paper.title
                            ></v-text-field>
                          </v-flex>
                        </v-layout>
                      </v-list-tile-title>
                      <v-list-tile-title style="height: 2.5em">
                        <v-layout row>
                          <v-flex xs2>
                            <v-subheader>Authors: </v-subheader>
                          </v-flex>
                          <v-flex xs10>
                            <v-text-field
                              required
                              full-width
                              :value=showAuthorNames(paper.authors)
                            ></v-text-field>
                          </v-flex>
                        </v-layout>
                      </v-list-tile-title>
                    </v-list-tile-content>
                      <v-list-tile-content v-else>
                      <v-list-tile-title><span class="dot" v-bind:style="'background-color: ' + paper.color"></span>
                        {{ paper.title }}
                      </v-list-tile-title>
                      <v-list-tile-sub-title class="text--primary">{{ showAuthorNames(paper.authors) }}</v-list-tile-sub-title>
                    </v-list-tile-content>
                    <v-list-tile-action v-if="isViewingPdf">
                      <v-list-tile-action-text>{{ paper.year }}</v-list-tile-action-text>
                      <v-icon
                        @click="toggle(index)"
                      >
                        check
                      </v-icon>
                    </v-list-tile-action>
                    <v-list-tile-action v-else>
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
        </v-layout>
      </v-container>
    </v-content>
    <v-footer app fixed>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script>
import PdfParser from './PdfParser'
import PdfViewer from './PdfViewer'
import RefList from './RefList'
import {PaperGraph} from '../../../../model/PaperGraph'

export default {
  name: 'PaperSight',
  components: {
    RefList,
    PdfViewer
  },
  data () {
    return {
      pdfFiles: [],
      papers: [],
      drawer: false,
      selected: [],
      graph: [],
      dialog: false,
      isViewingPdf: false,
      viewerModes: ['embed', 'pdfjs'],
      viewer: 'embed',
      selectedPaper: null
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

    viewPaper (index) {
      this.isViewingPdf = true
      if (this.selectedPaper === index) return
      this.selectedPaper = index
      if (this.viewer === 'embed') {
        this.$refs.EmbeddedViewer.innerHTML = ''
        let embed = document.createElement('embed')
        let viewport = this.$refs.MainPanel.getBoundingClientRect()
        embed.style.width = (viewport.width - viewport.left) + 'px'
        embed.style.height = viewport.height + 'px'
        embed.src = this.pdfFiles[index]
        this.$refs.EmbeddedViewer.appendChild(embed)
      } else {
        new PdfParser(this.pdfFiles[index]).getPage(1).then(page => {
          this.$refs.PaperViewer.renderPage(page)
          this.$refs.PaperViewer.renderText(page)
        })
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
        let url = URL.createObjectURL(file)
        this.pdfFiles.push(url)
        getAllPdfs.push(new Promise((resolve, reject) => {
          let pdf = new PdfParser(url)
          resolve(pdf)
        }))
        // let fileReader = new FileReader()
        // getAllPdfs.push(new Promise((resolve, reject) => {
        //   fileReader.onload = (evt) => {
        //     let pdf = new PdfParser(evt.target.result)
        //     resolve(pdf)
        //     this.pdfFiles.push(pdf)
        //   }
        // }))
        // fileReader.readAsArrayBuffer(file)
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
          this.$refs.PaperRefList.update(this.graph.getPapers().sort((a, b) => b.citedBysCount - a.citedBysCount))
          this.dialog = false
        })
      })
    }
  }
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
