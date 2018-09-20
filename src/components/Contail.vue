<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      clipped
      fixed
      app
    >
      <v-list dense>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>dashboard</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Dashboard</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app fixed clipped-left>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title>DisCO</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height class="pa-0">
        <v-layout justify-center align-center>
          <v-flex xs6 fill-height class="pa-2">
            <v-toolbar dense>
              <v-toolbar-side-icon></v-toolbar-side-icon>
              <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>apps</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>refresh</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>more_vert</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card height="100%" id="vis-context">
            </v-card>
          </v-flex>
          <v-flex xs6 fill-height class="pa-2">
            <v-toolbar dense>
              <v-toolbar-title>References</v-toolbar-title>

              <v-spacer></v-spacer>

              <v-btn icon>
                <v-icon>search</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>check_circle</v-icon>
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
                      <v-list-tile-sub-title class="text--primary">{{ paper.authors }}</v-list-tile-sub-title>
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
        </v-layout>
      </v-container>
    </v-content>
    <v-footer app fixed>
      <span>&copy; 2017</span>
    </v-footer>
  </v-app>
</template>

<script>
import Circo from '../vis/PaperGraph'
import '../vis/circo.css'
// import PaperCard from './PaperCard.vue'

const paperColors = {
  selected: 'steelblue',
  referenced: 'orange',
  citedBy: 'green'
}

export default {
  name: 'Contail',
  // components: {
  //   PaperCard
  // },
  data () {
    return {
      data: {
        relations: []
      },
      papers: [],
      nodes: [],
      visibleRelations: [],
      drawer: false,
      selected: []
    }
  },
  props: {
    source: String
  },
  created: function () {
    // this.$http.get('/static/flare.json').then(function (res) {
    //   console.log(res.body)
    //   Circo(res.body, '#vis-context')
    // })
    this.$http.get('/static/insitupdf.json').then(function (res) {
      var data = res.body
      var refs = data.references
      console.log(refs)
      // this.papers = refs.sort((a, b) => a.year - b.year)
      this.papers = refs
      let c = Circo({
        papers: refs,
        relations: data.relations,
        containerId: '#vis-context'
      })
      let that = this
      c.onselect = function (pids) {
        if (pids.selected.length <= 0) return
        let related = pids.selected.map(pid => {
          refs[pid].color = paperColors.selected
          return refs[pid]
        })
        if (Array.isArray(pids.referenced)) {
          related = related.concat(
            pids.referenced.map(pid => {
              refs[pid].color = paperColors.referenced
              return refs[pid]
            })
          )
        }
        if (Array.isArray(pids.citedBy)) {
          related = related.concat(
            pids.citedBy.map(pid => {
              refs[pid].color = paperColors.citedBy
              return refs[pid]
            })
          )
        }
        that.papers = related
      }
      // this.papers
    })
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
