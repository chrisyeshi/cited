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
          @change="setPdfViewerMode()"
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
            </v-card>
            <v-card  v-bind:class="{hidden: !isViewingPdf}" fill-height>
              <PdfViewer ref="PaperViewer"></PdfViewer>
            </v-card>
          </v-flex>
          <v-flex xs5 fill-height class="pa-2">
            <div v-bind:class="{hidden: !isEditingPaperInfo}">
              <PaperInforEditor
                ref="PaperInfoEditor"
                @editPaperInfoDone="editPaperInfoDone"
              ></PaperInforEditor>
            </div>
            <PaperList
              v-bind:class="{hidden: isEditingPaperInfo}"
              ref="PaperList"
              @viewPaper="viewPaper"
              @editPaperInfo="editPaperInfo"
              @selectFiles="selectFiles"
            ></PaperList>
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
import PaperList from './PaperList'
import PaperInforEditor from './PaperInfoEditor'
import RefList from './RefList'
import {PaperGraph} from '../../../../model/PaperGraph'

export default {
  name: 'PaperSight',
  components: {
    PaperList,
    PaperInforEditor,
    RefList,
    PdfViewer
  },
  data () {
    return {
      pdfFiles: [],
      drawer: false,
      selected: [],
      graph: [],
      dialog: false,
      isViewingPdf: false,
      viewerModes: ['embed', 'pdfjs'],
      viewer: 'pdfjs',
      selectedPaper: null,
      isEditingPaperInfo: false
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

    setPdfViewerMode () {
      this.$refs.PaperViewer.setMode(this.viewer)
    },

    editPaperInfo (paper) {
      this.isEditingPaperInfo = true
      this.$refs.PaperInfoEditor.setValues(paper)
    },

    editPaperInfoDone (paper) {
      this.isEditingPaperInfo = false
    },

    viewPaper (index) {
      this.isViewingPdf = true
      if (this.selectedPaper === index) return
      let viewport = this.$refs.MainPanel.getBoundingClientRect()
      this.selectedPaper = index
      this.$refs.PaperViewer.render(this.pdfFiles[index], viewport)
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
            // this.papers.push(newPaper)
            this.$refs.PaperList.addPaper(newPaper)
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
