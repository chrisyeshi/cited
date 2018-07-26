<template>
<div class="row panel-row">
  <div class="col-8 panel-main panel-context">
    <div id="vis-context"></div>
  </div>
  <!-- <div class="col-4 panel-main panel-detail">
    <paper-card v-for="node in nodes" v-bind:paper="node" v-bind:key="node.key"></paper-card>
  </div> -->
</div>
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
      paper: {},
      nodes: [],
      visibleRelations: []
    }
  },
  mounted: function () {
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
      Circo(refs, data.relations, '#vis-context')
    })
  },
  methods: {

  }
}
</script>

<style scoped>
.panel-row {
  min-height: 800px;
}
</style>
