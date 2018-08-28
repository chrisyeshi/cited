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
      <v-container fluid fill-height class="pa-2">
        <v-layout justify-center align-center>
          <v-flex xs6 fill-height>
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
          <v-flex xs6 fill-height class="pa-1">
            <v-layout row wrap>
              <v-flex xs6 v-for="paper in papers"  v-bind:key="paper.tempId">
                <v-card  class="ma-1"
                  v-on:mouseenter="hover(paper.tempId)"
                  >
                  <v-card-title>
                    <div class="headline"><span class="dot"></span>{{ paper.title }}</div>
                    <div>{{paper.authors}}</div>
                  </v-card-title>
                  <v-card-actions>
                      <v-btn flat>Detail</v-btn>
                      <v-spacer></v-spacer>
                      <v-btn icon>
                        <v-icon>favorite</v-icon>
                      </v-btn>
                      <v-btn icon>
                        <v-icon>bookmark</v-icon>
                      </v-btn>
                      <v-btn icon>
                        <v-icon>share</v-icon>
                      </v-btn>
                    </v-card-actions>
                </v-card>
              </v-flex>
            </v-layout>
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
import Circo from '../vis/Circo'
// import PaperCard from './PaperCard.vue'

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
      papers: {},
      nodes: [],
      visibleRelations: [],
      drawer: false
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
      //   console.log(data)
      var refs = data.references
      //   refs.forEach( function(ref) {
      //   ref.name = ref.tempId;
      //   ref.size = 1;
      //   ref.imported = data.relations.filter( r => r.citedBy == ref.tempId).map( r => r.citing );
      //   })
      console.log(refs)
      this.papers = refs.sort((a, b) => a.year - b.year)
      Circo({
        papers: refs,
        relations: data.relations,
        containerId: '#vis-context'
      })
    })
  },
  methods: {
    hover: function (id) {
      console.log(id)
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
  height: 25px;
  width: 25px;
  background-color: #bbb;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5em;
}
</style>
