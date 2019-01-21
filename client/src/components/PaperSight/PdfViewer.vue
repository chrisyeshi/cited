<template>
  <v-card style="text-align: center">
    <div v-bind:class="{hidden: !usePdfjs}" style="margin: 0 auto">
      <canvas ref="PdfCanvas"></canvas>
      <div ref="TextLayer" class="textLayer"></div>
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
      pdfFile: null,
      viewport: null
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

    render (pdfUrl, viewport) {
      if (this.usePdfjs) {
        new PdfParser(pdfUrl).getPage(this.pageNumber).then(page => {
          this.renderPage(page)
          this.renderText(page)
        })
      } else {
        this.$refs.EmbeddedViewer.innerHTML = ''
        let embed = document.createElement('embed')
        embed.style.width = (viewport.width - viewport.left) + 'px'
        embed.style.height = viewport.height + 'px'
        embed.src = pdfUrl
        this.$refs.EmbeddedViewer.appendChild(embed)
      }
    },

    renderPage (page) {
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

    renderText (page) {
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
