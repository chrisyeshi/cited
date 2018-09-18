<template>
  <div class="paper-card"
    v-bind:index="paper.index"
    v-bind:class="{ animate: !isDragging, 'front-most': isDragging }"
    v-bind:style="cardStyle">
    <v-hover close-delay=0>
      <v-card slot-scope="{ hover }"
        :class="`elevation-${hover ? 12 : 2}`">
        <v-system-bar ref="header" style="padding: 0px;">
          <span class="header-item"
            :style="{ 'background-color': inNetworkReferenceColor }"
            @mouseover="$emit('mouseoverrefcount', paper.key)"
            @mouseout="$emit('mouseoutrefcount', paper.key)"
            @click="$emit('clickrefcount', paper.key)">
            <span>&lt; {{ paper.inNetworkReferenceCount }} / {{ paper.referenceCount }}</span>
          </span>
          <v-spacer :style="handleStyle"
            @mousedown="dragElement"
            @click="$emit('clickhandle', paper.key)">
          </v-spacer>
          <span class="header-item"
            :style="{ 'background-color': inNetworkCitationColor }"
            @mouseover="$emit('mouseovercitecount', paper.key)"
            @mouseout="$emit('mouseoutcitecount', paper.key)"
            @click="$emit('clickcitecount', paper.key)">
            <span>{{ paper.inNetworkCitationCount }} / {{ paper.citationCount }} &gt;</span>
          </span>
        </v-system-bar>
        <v-card-text>
          <h4>
            <a @click="$emit('clicktitle', paper.key)">{{ paper.title }}</a>
          </h4>
          <div>
            <template v-for="(name, index) in authorNames">
              <span :key="`author-name-${index}`">
                <a @click="console">{{ name }}</a>
              </span>
              <span v-if="index != authorNames.length - 1" :key="`author-and-${index}`">
                and
              </span>
            </template>
          </div>
          <div>
            <span><a @click="console">Year {{ paper.year }}</a></span>, <span><a @click="console">Referenced {{ paper.referenceCount }}</a></span>, <span><a @click="console">Cited by {{ paper.citationCount }}</a></span>
          </div>
        </v-card-text>
      </v-card>
    </v-hover>
  </div>
</template>

<script>
import { create as createRect } from './rect.js'

// TODO: use the standard Paper object format

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
    authorNames: function () {
      return this.paper.authors.map(author => `${author.family}, ${author.given}`)
    },
    authorText: function () {
      const names = this.paper.authors.map(author => `${author.family}, ${author.given}`)
      return names.join(' and ')
    },
    handleStyle: function () {
      return {
        height: '100%',
        backgroundColor: this.paper.highlight ? 'orange' : undefined
      }
    },
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
      let authorList = this.paper.authors.map(author => `${author.family}, ${author.given}`)
      let authorText = authorList.join(' and ')
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
          createLineObj('line-clamp-1', authorText),
          createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
        ]
      }
      if (this.maxLineCount < 5) {
        return [
          createLineObj('line-clamp-2', this.paper.title),
          createLineObj('line-clamp-1', authorText),
          createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
        ]
      }
      return [
        createLineObj('', this.paper.title),
        createLineObj('', authorText),
        createLineObj('line-clamp-1', 'Published in ' + this.paper.year + ', Cited by ' + this.paper.citationCount)
      ]
    },
    inNetworkCitationColor: function () {
      return this.getColor({
        maxLevel: 4,
        logBase: 2,
        value: this.paper.inNetworkCitationCount
      })
    },
    inNetworkReferenceColor: function () {
      return this.getColor({
        maxLevel: 4,
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
    getColor: function ({ maxLevel, logBase, value }) {
      const log = x => Math.log(x) / Math.log(logBase)
      const count = Math.floor(value)
      const unboundLevel = count === 0 ? 0 : Math.floor(log(count)) + 1
      const boundLevel = Math.min(maxLevel, unboundLevel)
      const r = boundLevel / maxLevel
      const minColor = [50, 50, 50]
      const maxColor = [50, 200, 250]
      const color = []
      for (let i = 0; i < 3; ++i) {
        color[i] = minColor[i] * (1 - r) + maxColor[i] * r
      }
      return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    },
    console: function (evt) {
      console.log(evt)
    }
  }
}
</script>

<style scoped>
.paper-card {
  position: absolute;
  white-space: normal;
  word-break: break-all;
  margin-bottom: 100px;
}

a {
  color: black;
}

a:hover {
  background-color: yellow;
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

.header-item {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0px 5px;
  color: white;
}

.animate {
  transition-duration: 0.1s;
}

.front-most {
  z-index: 99999;
}
</style>
