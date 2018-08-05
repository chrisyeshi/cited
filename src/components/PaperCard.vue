<template>
  <div class="paper-card"
    v-bind:index="paper.index"
    v-bind:class="{ animate: !isDragging, 'front-most': isDragging }"
    v-bind:style="cardStyle">
    <div class="header" ref="header">
      <span class="header-references"
        v-on:mouseover="$emit('mouseoverrefcount', paper.key)"
        v-on:mouseout="$emit('mouseoutrefcount', paper.key)"
        v-on:click="$emit('clickrefcount', paper.key)"
        v-bind:style="{ 'background-color': inNetworkReferenceColor }">&lt; {{ paper.inNetworkReferenceCount }}</span>
      <span class="header-bar" v-on:mousedown="dragElement"></span>
      <span class="header-citations"
        v-on:mouseover="$emit('mouseovercitecount', paper.key)"
        v-on:mouseout="$emit('mouseoutcitecount', paper.key)"
        v-on:click="$emit('clickcitecount', paper.key)"
        v-bind:style="{ 'background-color': inNetworkCitationColor }">{{ paper.inNetworkCitationCount }} &gt;</span>
    </div>
    <div v-bind:class="line.classes" v-for="(line, index) in lines" v-bind:key="index">{{ line.text }}</div>
  </div>
</template>

<script>
import { create as createRect } from './rect.js'

export default {
  name: 'PaperCard',
  props: {
    paper: Object,
    autoHeight: {
      type: Boolean,
      default: true
    },
    draggable: {
      type: Boolean,
      default: true
    },
    maxLineCount: {
      type: Number,
      default: 5
    }
  },
  data () {
    return {
      isDragging: false,
      rect: { ...this.paper.rect }
    }
  },
  computed: {
    cardStyle: function () {
      const style = {
        left: this.rect.left + 'px',
        top: this.rect.top + 'px',
        width: this.rect.width + 'px'
      }
      const height = { height: this.rect.height + 'px' }
      return this.autoHeight ? style : { ...style, ...height }
    },
    lines: function () {
      let createLineObj = (classes, text) => {
        return {
          classes: classes,
          text: text
        }
      }
      let authorList = this.paper.authors.split(/, |, and | and /)
      let shortAuthors = authorList.length < 2 ? authorList[0] : authorList[0] + ' +' + (authorList.length - 1)
      if (this.maxLineCount < 2) {
        return [
          createLineObj('line-clamp-1', shortAuthors + ', ' + this.paper.year + ', "' + this.paper.citationCount)
        ]
      }
      if (this.maxLineCount < 3) {
        return [
          createLineObj('line-clamp-1', this.paper.title),
          createLineObj('line-clamp-1', shortAuthors + ', ' + this.paper.year + ', "' + this.paper.citationCount)
        ]
      }
      if (this.maxLineCount < 4) {
        return [
          createLineObj('line-clamp-1', this.paper.title),
          createLineObj('line-clamp-1', this.paper.authors),
          createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
        ]
      }
      if (this.maxLineCount < 5) {
        return [
          createLineObj('line-clamp-2', this.paper.title),
          createLineObj('line-clamp-1', this.paper.authors),
          createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
        ]
      }
      return [
        createLineObj('', this.paper.title),
        createLineObj('', this.paper.authors),
        createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
      ]
    },
    inNetworkCitationColor: function () {
      return this.getColor({
        maxLevel: 4,
        maxValue: 200,
        logBase: 2,
        value: this.paper.inNetworkCitationCount
      })
    },
    inNetworkReferenceColor: function () {
      return this.getColor({
        maxLevel: 4,
        maxValue: 200,
        logBase: 2,
        value: this.paper.inNetworkReferenceCount
      })
    }
  },
  watch: {
    paper: function (curr, prev) {
      this.rect = createRect(curr.rect)
    }
  },
  methods: {
    dragElement: function (evt) {
      if (!this.draggable) {
        return
      }
      evt.preventDefault()
      let xPrev = evt.clientX
      let yPrev = evt.clientY
      let closeDragElement = evt => {
        this.isDragging = false
        document.onmouseup = null
        document.onmousemove = null
        const paper = {
          ...this.paper,
          rect: createRect(this.rect)
        }
        this.$emit('dragend', paper, evt)
      }
      let elementDrag = evt => {
        let xCurr = evt.clientX
        let yCurr = evt.clientY
        this.rect.left += (xCurr - xPrev)
        this.rect.top += (yCurr - yPrev)
        const paper = {
          ...this.paper,
          rect: createRect(this.rect)
        }
        this.$emit('update:paper', paper)
        xPrev = xCurr
        yPrev = yCurr
      }
      this.isDragging = true
      document.onmouseup = closeDragElement
      document.onmousemove = elementDrag
    },
    getColor: function ({ maxLevel, maxValue, logBase, value }) {
      const log = x => Math.log(x) / Math.log(logBase)
      const count = Math.floor(value)
      const unboundLevel = count === 0 ? 0 : Math.floor(log(count)) + 1
      const boundLevel = Math.min(maxLevel, unboundLevel)
      const colorValue = maxValue / maxLevel * boundLevel
      return `rgb(10, ${colorValue}, 50)`
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
  background-color: white;
}

.line-clamp-1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-references,
.header-citations {
  color: white;
  height: 100%;
}

.header-references {
  order: -1;
}

.header-citations {
  order: 1;
}

.header-bar {
  order: 0;
  flex-grow: 1;
}

.header {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background-color: gray;
}

.animate {
  transition-duration: 0.1s;
}

.front-most {
  z-index: 99999;
}
</style>
