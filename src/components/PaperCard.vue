<template>
  <transition name="background">
    <div class="paper-card"
      v-bind:index="card.index"
      v-bind:class="{ animate: !isDragging, 'front-most': isDragging }"
      v-bind:style="cardStyle">
      <v-hover close-delay=0>
        <v-card slot-scope="{ hover }"
          :class="`elevation-${hover ? 12 : 2}`">
          <v-system-bar ref="header" style="padding: 0px;">
            <span class="header-item"
              :style="{ 'background-color': inNetworkReferenceColor }"
              @mouseover="$emit('mouseoverrefcount', card.index)"
              @mouseout="$emit('mouseoutrefcount', card.index)"
              @click="$emit('clickrefcount', card.index)">
              <span>&lt; {{ card.inGraphCitings.length }} / {{ card.paper.references.length }}</span>
            </span>
            <v-spacer :style="handleStyle"
              @mousedown="dragElement">
            </v-spacer>
            <span class="header-item"
              :style="{ 'background-color': inNetworkCitationColor }"
              @mouseover="$emit('mouseovercitecount', card.index)"
              @mouseout="$emit('mouseoutcitecount', card.index)"
              @click="$emit('clickcitecount', card.index)">
              <span>{{ card.inGraphCitedBys.length }} / {{ card.paper.citationCount }} &gt;</span>
            </span>
          </v-system-bar>
          <v-card-text>
            <h4>
              <a @click="$emit('clicktitle', card.index)">{{ card.paper.title }}</a>
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
              <span><a @click="console">Year {{ card.paper.year }}</a></span>, <span><a @click="console">Referenced {{ card.paper.references.length }}</a></span>, <span><a @click="console">Cited by {{ card.paper.citationCount }}</a></span>
            </div>
          </v-card-text>
        </v-card>
      </v-hover>
    </div>
  </transition>
</template>

<script>
import { create as createRect } from './rect.js'
import _ from 'lodash'
import { Author } from './paper.js'

export default {
  name: 'PaperCard',
  props: {
    card: Object,
    autoHeight: {
      type: Boolean,
      default: true
    },
    draggable: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      isDragging: false,
      rect: { ...this.card.rect }
    }
  },
  computed: {
    paper: function () { return this.card.paper },
    authorNames: function () {
      return _.map(this.paper.authors, author => Author.stringify(author))
    },
    handleStyle: function () {
      return {
        height: '100%',
        backgroundColor: this.card.selected ? 'orange' : undefined
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
    inNetworkCitationColor: function () {
      return this.getColor({
        maxLevel: 4,
        logBase: 2,
        value: this.card.inGraphCitedBys.length
      })
    },
    inNetworkReferenceColor: function () {
      return this.getColor({
        maxLevel: 4,
        logBase: 2,
        value: this.card.inGraphCitings.length
      })
    }
  },
  watch: {
    card: function (curr, prev) {
      this.rect = createRect(curr.rect)
    }
  },
  methods: {
    dragElement: function (evt) {
      if (!this.draggable) {
        return
      }
      evt.preventDefault()
      const xInit = evt.clientX
      const yInit = evt.clientY
      let xPrev = evt.clientX
      let yPrev = evt.clientY
      const closeDragElement = evt => {
        this.isDragging = false
        document.onmouseup = null
        document.onmousemove = null
        const xCurr = evt.clientX
        const yCurr = evt.clientY
        const xDiff = xCurr - xInit
        const yDiff = yCurr - yInit
        if (Math.sqrt(xDiff * xDiff + yDiff * yDiff) > 1) {
          const card = {
            ...this.card,
            rect: createRect(this.rect)
          }
          this.$emit('dragend', card, evt)
        } else {
          this.$emit('clickhandle', this.card.index)
        }
      }
      const elementDrag = evt => {
        const xCurr = evt.clientX
        const yCurr = evt.clientY
        this.rect.left += (xCurr - xPrev)
        this.rect.top += (yCurr - yPrev)
        const card = {
          ...this.card,
          rect: createRect(this.rect)
        }
        this.$emit('update:card', card)
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

.background-enter-active .v-card {
  transition: background-color 2s ease-in;
}
.background-enter .v-card {
  background-color: yellow;
}
</style>
