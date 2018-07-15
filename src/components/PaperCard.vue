<template>
  <div class="paper-card" v-bind:index="paper.index" v-bind:class="{ animate: enableAnimation }" v-bind:style="cardStyle">
    <div class="header" v-bind:style="{ height: paper.headerHeight + 'px' }">
      <span class="header-references" v-on:mouseover="$emit('linkreferences', paper.key)" v-on:mouseout="$emit('unlinkreferences', paper.key)" v-bind:style="{ 'background-color': inNetworkReferenceColor }">&lt; {{ paper.inNetworkReferenceCount }}</span>
      <span class="header-bar" v-on:mousedown="dragElement"></span>
      <span class="header-citations" v-on:mouseover="$emit('linkcitations', paper.key)" v-on:mouseout="$emit('unlinkcitations', paper.key)" v-bind:style="{ 'background-color': inNetworkCitationColor }">{{ paper.inNetworkCitationCount }} &gt;</span>
    </div>
    <div v-bind:class="line.classes" v-for="(line, index) in lines" v-bind:key="index">{{ line.text }}</div>
  </div>
</template>

<script>
export default {
  name: 'PaperCard',
  props: {
    paper: Object,
    draggable: {
      type: Boolean,
      default: true
    },
    lineCount: {
      type: Number,
      default: 4
    }
  },
  data () {
    return {
      enableAnimation: true
    }
  },
  computed: {
    cardStyle: function () {
      return {
        left: this.paper.rect.left + 'px',
        top: this.paper.rect.top + 'px',
        width: this.paper.rect.width + 'px',
        height: this.paper.rect.height + 'px'
      }
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
      if (this.lineCount < 2) {
        return [
          createLineObj('line-clamp-1', shortAuthors + ', ' + this.paper.year + ', "' + this.paper.citationCount)
        ]
      }
      if (this.lineCount < 3) {
        return [
          createLineObj('line-clamp-1', this.paper.title),
          createLineObj('line-clamp-1', shortAuthors + ', ' + this.paper.year + ', "' + this.paper.citationCount)
        ]
      }
      if (this.lineCount < 4) {
        return [
          createLineObj('line-clamp-1', this.paper.title),
          createLineObj('line-clamp-1', this.paper.authors),
          createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
        ]
      }
      if (this.lineCount < 5) {
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
  methods: {
    dragElement: function (evt) {
      if (!this.draggable) {
        return
      }
      evt.preventDefault()
      let xPrev = evt.clientX
      let yPrev = evt.clientY
      let closeDragElement = evt => {
        this.enableAnimation = true
        document.onmouseup = null
        document.onmousemove = null
        this.$emit('dragend', this.paper, evt)
      }
      let elementDrag = evt => {
        let node = this.paper
        let xCurr = evt.clientX
        let yCurr = evt.clientY
        node.rect.left += (xCurr - xPrev)
        node.rect.top += (yCurr - yPrev)
        this.$emit('update:paper', node)
        xPrev = xCurr
        yPrev = yCurr
      }
      this.enableAnimation = false
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
  height: 100%;
}

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: gray;
}

.animate {
  transition-duration: 0.1s;
}
</style>
