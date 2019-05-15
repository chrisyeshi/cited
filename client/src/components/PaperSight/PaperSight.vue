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
    <v-dialog
      v-model="collectionDialog"
      max-width="380px"
    >
      <v-card>
        <v-card-title class="headline">Create new collection</v-card-title>
          <v-card-text>
          <v-text-field
            label="Collection Name"
            v-model="newCollectionName"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            flat="flat"
            @click="createCollection()"
          >
            Create
          </v-btn>
          <v-btn
            flat="flat"
            @click="collectionDialog = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
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
      <v-flex xs2 class="ma-2">
        <v-select
          dense
          :items="collectionNames"
          v-model="selectedColName"
          @change="changeCollection()"
          box
          label="My Collections"
        ></v-select>
      </v-flex>
      <input style="display: none" type="file" ref="InputFiles" multiple @change="openFiles" />
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height class="pa-2">
        <v-layout justify-center align-center>
            <v-flex ref="MainPanel" xs7 fill-height class="pa-2">
            <v-card v-bind:class="{hidden: isViewingPdf}" fill-height>
              <RefList ref="PaperRefList" @saveRefInfo="saveRefInfo"></RefList>
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
      collection: null,
      selectedColName: null,
      collectionNames: ['+ New Collection'],
      collectionDialog: false,
      newCollectionName: '',
      viewer: 'pdfjs',
      selectedPaper: null,
      localStore: null,
      isEditingPaperInfo: false
    }
  },
  watch: {
    collection: function () {
      this.$refs.PaperList.clear()
      this.$refs.PaperRefList.references = []
      this.localStore.getPapers(this.collection.paperIds).then(papers => {
        let refPaperIds = []
        papers.forEach(paper => {
          refPaperIds = refPaperIds.concat(paper.references)
          this.$refs.PaperList.addPaper(paper)
        })

        // remove duplicated numbers in refPaperIds
        refPaperIds = refPaperIds.reduce((b, c) => {
          if (b.indexOf(c) < 0) b.push(c)
          return b
        }, [])

        return this.localStore.getPapers(refPaperIds)
      }).then(refPapers => {
        this.$refs.PaperRefList.update(refPapers)
      })
    }
  },
  created: function () {
    this.graph = new PaperGraph({})
    this.localStore = new LocalStore()
  },
  mounted: function () {
    this.localStore.getCollections().then(collections => {
      if (collections.length === 0) {
        this.collection = {id: 1, name: 'My Collection 1', paperIds: []}
        this.localStore.db.collections.add(this.collection).then(newCollectionId => {
          this.collectionNames.push(this.collection.name)
          this.collectionNames = this.collectionNames.reverse()
        })
      } else {
        this.collectionNames = this.collectionNames.concat(collections.map(col => col.name)).reverse()
        this.collection = collections[0]
      }
      this.selectedColName = this.collection.name
    })
  },
  methods: {
    hover: function (index) {
      // console.log(index)
    },

    changeCollection () {
      if (this.selectedColName === '+ New Collection') {
        this.collectionDialog = true
      } else {
        this.localStore.db.collections.get({name: this.selectedColName}).then(col => {
          this.collection = col
        })
      }
    },

    createCollection () {
      if (this.newCollectionName) {
        this.collectionDialog = false
        let newCollection = {name: this.newCollectionName, paperIds: []}
        this.localStore.db.collections.add(newCollection).then(colId => {
          newCollection.id = colId
          this.collectionNames = [this.newCollectionName].concat(this.collectionNames)
          this.selectedColName = this.newCollectionName
          this.collection = newCollection
        })
      }
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
        let updateAuthorPromises = paper.authorNames.map(authorName => {
          return this.localStore.insertAuthor({name: authorName})
        })
        Promise.all(updateAuthorPromises).then(authors => {
          let authorIds = authors.map(author => author.id)
          paper.authors = authorIds
          return this.localStore.db.papers.update(paper.id, paper)
        }).then(paperId => {
          this.$refs.PaperList.updatePaper(paper)
        })
      }
    },

    saveRefInfo (ref) {
      this.localStore.db.papers.update(ref.id, ref)
    },

    viewPaper (index) {
      if (this.selectedPaper === index) return
      this.selectedPaper = index
      if (this.pdfFiles[index] !== undefined) {
        this.isViewingPdf = true
        this.$refs.PaperViewer.setUrl(this.pdfFiles[index])
        this.$refs.PaperViewer.render()
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
          console.log(url)
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
            let insertAuthorPromises = []
            let insertPaperPromises = []
            let paper = papers[i]
            let refs = allRefs[i]
            let newPaper = {}
            newPaper = Object.assign({}, paper)
            newPaper.authorNames = paper.authors.filter(authorName => authorName !== '')
              .map((authorName) => {
                let author = {name: authorName}
                this.graph.insertAuthor(author)
                insertAuthorPromises.push(this.localStore.insertAuthor(author))
                return authorName
              })
            let references = []
            if (refs.parsed.length > 0) {
              let paperRefs = refs.parsed
              references = paperRefs.map((ref, refId) => {
                let refPaper = {}
                if (Array.isArray(ref.title)) {
                  refPaper.title = ref.title[0]
                  refPaper.authorNames = (!Array.isArray(ref.author)) ? [''] : ref.author.map((author) => {
                    let authorName = [author.given, author.family].join(' ')
                    insertAuthorPromises.push(this.localStore.insertAuthor({name: authorName}))
                    return authorName
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
                  // refPaper.id = this.graph.insertPaper(refPaper)
                  return refPaper
                }
              }).filter(ref => ref !== undefined)
            }
            let authorIds = {}
            Promise.all(insertAuthorPromises).then(authors => {
              authors.forEach(author => {
                authorIds[author.name] = author.id
              })
              newPaper.authors = newPaper.authorNames.map(name => authorIds[name])
              references.forEach(refPaper => {
                refPaper.authors = refPaper.authorNames.map(name => authorIds[name])
                insertPaperPromises.push(this.localStore.insertPaper(refPaper))
              })
              Promise.all(insertPaperPromises).then(paperIds => {
                references.forEach((refPaper, ri) => {
                  refPaper.id = paperIds[ri]
                  this.$refs.PaperRefList.append(refPaper)
                })
                newPaper.references = paperIds
                return this.localStore.insertPaper(newPaper)
              }).then(newPaperId => {
                references.forEach((refPaper) => {
                  this.localStore.addCitation({from: newPaperId, to: refPaper.id})
                })
                this.$refs.PaperList.addPaper(newPaper)
                this.collection.paperIds.push(newPaperId)
                this.localStore.db.collections.update(this.collection.id, this.collection)
              }).catch(err => {
                console.log(err)
              })
            })
          }
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
