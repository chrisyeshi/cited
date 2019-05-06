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
    <v-toolbar app fixed clipped-left flat dark class="app-header">
      <!-- <v-toolbar-side-icon></v-toolbar-side-icon> -->
      <v-toolbar-title>PaperSight</v-toolbar-title>
      <v-layout justify-space-around class="ma-4 appbar-icons">
        <v-icon left large @click="isViewingPdf=false" v-bind:class="{active: !isViewingPdf}">view_list</v-icon>
        <v-icon left large @click="isViewingPdf=true"  v-bind:class="{active: isViewingPdf}">book</v-icon>
        <v-icon left large>device_hub</v-icon>
        <v-icon left large>bubble_chart</v-icon>
      </v-layout>

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
import {PaperGraph} from './PaperGraph'
import LocalStore from './LocalStore'

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
      graph: [],
      dialog: false,
      isViewingPdf: false,
      tabs: ['references'],
      viewerModes: ['embed', 'pdfjs'],
      viewer: 'pdfjs',
      selectedPaper: null,
      localStore: null,
      isEditingPaperInfo: false
    }
  },
  created: function () {
    this.graph = new PaperGraph({})
    this.localStore = new LocalStore()
  },
  methods: {
    hover: function (index) {
      // console.log(index)
    },

    setPdfViewerMode () {
      this.$refs.PaperViewer.setMode(this.viewer)
      if (this.viewer === 'embed') {
        let viewport = this.$refs.MainPanel.getBoundingClientRect()
        this.$refs.PaperViewer.setViewport(viewport)
      }
      this.$refs.PaperViewer.render()
    },

    editPaperInfo (paper) {
      this.isEditingPaperInfo = true
      this.$refs.PaperInfoEditor.setValues(paper)
    },

    editPaperInfoDone (paper) {
      this.isEditingPaperInfo = false
      if (paper !== undefined) {
        let savedPaper = this.graph.getPaperById(paper.id)
        savedPaper = paper
        this.$refs.PaperList.updatePaper(savedPaper)
      }
    },

    viewPaper (index) {
      this.isViewingPdf = true
      if (this.selectedPaper === index) return
      this.selectedPaper = index
      this.$refs.PaperViewer.setUrl(this.pdfFiles[index])
      this.$refs.PaperViewer.render()
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
            newPaper = Object.assign({}, paper)
            newPaper.authors = paper.authors.filter(authorName => authorName !== '')
              .map((authorName) => {
                let author = {name: authorName}
                this.graph.insertAuthor(author)
                this.localStore.insertAuthor(author)
                return author
              })
            if (refs.parsed.length > 0) {
              let paperRefs = refs.parsed
              let references = paperRefs.map((ref, refId) => {
                let refPaper = {}
                if (Array.isArray(ref.author)) {
                  refPaper.authors = ref.author.map((author) => {
                    let authorName = [author.given, author.family].join(' ')
                    this.localStore.insertAuthor({name: authorName})
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
                  if (Array.isArray(ref['container-title']) && ref['container-title'].length) {
                    refPaper.venue = (ref['container-title']) ? ref['container-title'][0].replace(/-/g, '') : ''
                  }

                  refPaper.year = Array.isArray(ref.date) ? ref.date[0] : 'unknown'
                  if (Array.isArray(ref.date)) refPaper.date = ref.date[0]
                  if (ref.pages) refPaper.pages = (Array.isArray(ref.pages)) ? ref.pages[0] : ref.pages
                  if (ref.publisher) refPaper.publisher = (Array.isArray(ref.publisher)) ? ref.publisher[0] : ref.publisher
                  if (ref.volume) refPaper.volume = (Array.isArray(ref.volume)) ? ref.volume[0] : ref.volume
                  if (ref.issue) refPaper.issue = (Array.isArray(ref.issue)) ? ref.issue[0] : ref.issue
                  refPaper.origin = refs.raw[refId]
                  refPaper.id = this.graph.insertPaper(refPaper)
                  return refPaper
                }
              }).filter(p => p !== undefined && p.hasOwnProperty('id'))

              newPaper.references = references.map((ref) => ref.id)
              newPaper.id = this.graph.insertPaper(newPaper)
              newPaper.references.forEach(rid => {
                this.graph.getPaperById(rid).citedBysCount = this.graph.getCitedBys(rid).length
              })
              newPaper.citedBysCount = this.graph.getCitedBys(newPaper.id).length

              references.map(ref => {
                this.localStore.insertPaper(ref)
                this.$refs.PaperRefList.append(ref)
              })
              this.localStore.insertPaper(newPaper)
            }
            // this.papers.push(newPaper)
            this.$refs.PaperList.addPaper(newPaper)
          }
          // this.localStore.db.authors.bulkAdd(this.graph.authors)
          // this.$refs.PaperRefList.update(this.graph.getPapers().sort((a, b) => b.citedBysCount - a.citedBysCount))
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

.appbar-icons i {
  padding: 10px 20px;
}

.appbar-icons i.active {
  border-bottom: 3px solid #fff;
}

.appbar-icons i:hover {
  color: steelblue;
  background-color: #fff;
}

.app-header {
    background-color: rgb(21, 146, 196);
}
</style>
