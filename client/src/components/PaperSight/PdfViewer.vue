<template>
  <v-card style="text-align: center">
    <div v-bind:class="{hidden: !usePdfjs}" style="margin: 0 auto">
      <v-toolbar dense>
        <v-toolbar-title>PDF Reader</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="zoomIn()">
          <v-icon>zoom_in</v-icon>
        </v-btn>
        <v-btn icon @click="zoomOut()">
          <v-icon>zoom_out</v-icon>
        </v-btn>
        <v-btn icon :disabled="pageNumber<2" @click="pageNumber-=1">
          <v-icon>keyboard_arrow_left</v-icon>
        </v-btn>
        <input type="text" value="1" size="2" v-model="pageNumber" class="page-number-input"/> / {{pageTotal}}
        <v-btn icon :disabled="pageNumber>=pageTotal" @click="pageNumber+=1">
          <v-icon>keyboard_arrow_right</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card style="overflow: scroll">
        <canvas ref="PdfCanvas"></canvas>
        <div ref="TextLayer" class="textLayer"></div>
      </v-card>
    </div>
    <div v-bind:class="{hidden: usePdfjs}" ref="EmbeddedViewer"></div>
  </v-card>
</template>

<script>
import PdfParser from './PdfParser'
import pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../../node_modules/pdfjs-dist/build/webpack/pdf.worker.min.js'

export default {
  name: 'PdfViewer',
  data () {
    return {
      usePdfjs: true,
      scale: 1.2,
      pageNumber: 1,
      pageTotal: 10,
      viewport: null,
      pdfUrl: null,
      pdfFile: null,
      page: null
    }
  },
  watch: {
    pageNumber: function () {
      this.pdfjsRender()
    }
  },
  methods: {
    setMode (mode) {
      if (mode === 'pdfjs') {
        this.usePdfjs = true
      } else {
        this.usePdfjs = false
      }
    },

    setViewport (viewport) {
      this.viewport = viewport
    },

    setUrl (url) {
      this.pdfUrl = url
    },

    zoomOut () {
      this.scale -= 0.2
      this.pdfjsRender()
    },

    zoomIn () {
      this.scale += 0.2
      this.pdfjsRender()
    },

    render () {
      if (this.pdfUrl === null) return
      if (this.usePdfjs) {
        this.pdfFile = new PdfParser(this.pdfUrl)
        this.pageNumber = 1
        this.scale = 1.2
        this.pdfjsRender()
      } else {
        this.$refs.EmbeddedViewer.innerHTML = ''
        let embed = document.createElement('embed')
        embed.style.width = (this.viewport.width - this.viewport.left) + 'px'
        embed.style.height = this.viewport.height + 'px'
        embed.src = this.pdfUrl
        this.$refs.EmbeddedViewer.appendChild(embed)
      }
    },

    pdfjsRender () {
      let pageNumber = parseInt(this.pageNumber) || 1
      this.pdfFile.getPage(pageNumber).then(page => {
        this.pdfjsRenderPage(page)
        this.pdfjsRenderText(page)
      })
    },

    pdfjsRenderPage (page) {
      // this.scale = canvas.width / page.getViewport(1.0).width
      this.viewport = page.getViewport(this.scale)
      this.canvas = this.$refs.PdfCanvas
      this.canvas.height = this.viewport.height
      this.canvas.width = this.viewport.width
      // Render PDF page into canvas context
      let context = this.canvas.getContext('2d')
      let renderContext = {
        canvasContext: context,
        viewport: this.viewport
      }
      let renderTask = page.render(renderContext)
      return renderTask.promise
    },

    pdfjsRenderText (page) {
      return page.getTextContent().then((textContent) => {
        let textLayer = this.$refs.TextLayer
        textLayer.innerHTML = ''
        let viewport = this.viewport
        textLayer.style.left = this.canvas.offsetLeft + 'px'
        textLayer.style.top = this.canvas.offsetTop + 'px'
        textLayer.style.width = this.canvas.width + 'px'
        textLayer.style.height = this.canvas.height + 'px'
        let renderTextLayer = pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayer,
          viewport: JSON.parse(JSON.stringify(viewport)),
          textDivs: []
        })
        return renderTextLayer.promise
      })
    }
  }
}
</script>

<style>

.hidden {
  display: none;
}

.page-number-input {
  width: 2.5em;
  text-align: right;
  padding-right: 0.25em;
  border: 1px solid #aaa;
  margin-right: 0.5em;
}

.textLayer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1.0;
}

.textLayer > div {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  -webkit-transform-origin: 0% 0%;
  -moz-transform-origin: 0% 0%;
  -o-transform-origin: 0% 0%;
  -ms-transform-origin: 0% 0%;
  transform-origin: 0% 0%;
}

.textLayer .highlight {
  margin: -1px;
  padding: 1px;

  background-color: rgb(180, 0, 170);
  border-radius: 4px;
}

.textLayer .highlight.begin {
  border-radius: 4px 0px 0px 4px;
}

.textLayer .highlight.end {
  border-radius: 0px 4px 4px 0px;
}

.textLayer .highlight.middle {
  border-radius: 0px;
}

.textLayer .highlight.selected {
  background-color: rgb(0, 100, 0);
}

.textLayer ::selection { background: rgb(0,0,255); }
.textLayer ::-moz-selection { background: rgb(0,0,255); }

.textLayer .endOfContent {
  display: block;
  position: absolute;
  left: 0px;
  top: 100%;
  right: 0px;
  bottom: 0px;
  z-index: -1;
  cursor: default;
  -webkit-user-select: none;
  -ms-user-select: none;
  -moz-user-select: none;
}

.textLayer .endOfContent.active {
  top: 0px;
}
</style>
