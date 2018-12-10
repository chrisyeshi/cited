<template>
  <v-app id="inspire">
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
          <v-flex xs6 fill-height class="pa-2">
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
          <v-flex xs6 fill-height class="pa-2">
            <v-toolbar dense>
              <v-toolbar-title>References</v-toolbar-title>

              <v-spacer></v-spacer>

              <v-text-field
                label="Filter by paper titles and keywoards"
                solo
              ></v-text-field>
              <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn>

            </v-toolbar>
            <v-card>
              <v-list>
                <template v-for="(reference, index) in references">
                  <v-list-tile
                    :key="reference.str"
                    avatar
                    ripple
                  >
                    <v-list-tile-content>
                      <v-list-tile-title>
                        {{ reference.str }}
                      </v-list-tile-title>
                    </v-list-tile-content>

                  </v-list-tile>
                  <v-divider v-if="index + 1 < references.length" :key="index"></v-divider>
                </template>
              </v-list>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <v-footer app fixed>
      <span>&copy; 2017</span>
    </v-footer>
  </v-app>
</template>

<script>
import PdfLoader from './PdfLoader'

export default {
  name: 'Contail',
  data () {
    return {
      papers: [],
      references: [],
      drawer: false,
      selected: []
    }
  },
  created: function () {

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
      return authors.join(', ')
    },

    selectFiles () {
      const elem = this.$refs.InputFiles
      elem.click()
    },

    openFiles ($event) {
      let files = $event.target.files
      if (files.length === 0) return

      for (let file of files) {
        let fileReader = new FileReader()

        fileReader.onload = (evt) => {
          let pdf = new PdfLoader(new Uint8Array(evt.target.result))

          pdf.getInfo().then((papers) => {
            this.papers.push(papers)
          })

          pdf.getReferences()
            .then((refs) => {
              this.references = this.references.concat(refs.map((ref) => { return {str: ref} }))
            })
        }
        fileReader.readAsArrayBuffer(file)
      }
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
