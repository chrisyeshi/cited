<template>
  <div class="paper-card" v-bind:index="paper.index" v-bind:style="paper.style" v-on:mousedown.prevent="dragElement">
    <div>{{ paper.title }}</div>
    <span>{{ paper.authors }}</span>
    <span>Cited by {{ paper.citationCount }}</span>
  </div>
</template>

<script>
export default {
  name: 'PaperCard',
  props: ['paper'],
  methods: {
    dragElement: function (evt) {
      let xPrev = evt.clientX
      let yPrev = evt.clientY
      let closeDragElement = evt => {
        document.onmosueup = null
        document.onmousemove = null
      }
      let elementDrag = evt => {
        let node = this.paper
        let xCurr = evt.clientX
        let yCurr = evt.clientY
        node.rect.left += xCurr - xPrev
        node.rect.top += yCurr - yPrev
        xPrev = xCurr
        yPrev = yCurr
      }
      document.onmouseup = closeDragElement
      document.onmousemove = elementDrag
    }
  }
}
</script>

<style scoped>
.paper-card {
  position: absolute;
  border-style: solid;
  border-width: 0.1em;
  white-space: normal;
  word-break: break-all;
  overflow-y: hidden;
}

.paper-card div,
.paper-card span {
  pointer-events: none;
}
</style>
