<template>
  <v-card justify-center align-center>
    <canvas ref="PdfCanvas"></canvas>
    <div ref="TextLayer" class="text-layer"></div>
  </v-card>
</template>

<script>
import pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../../node_modules/pdfjs-dist/build/webpack/pdf.worker.min.js'

// let pdfjsLib = window['pdfjs-dist/build/pdf']
// pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js'

export default {
  name: 'PdfViewer',
  data () {
    return {
      scale: 1.5,
      pdfFile: null,
      viewport: null
    }
  },
  methods: {
    renderPage (page) {
      this.viewport = page.getViewport({scale: this.scale})
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
        textLayer.style.left = this.canvas.offsetLeft + 'px'
        textLayer.style.top = this.canvas.offsetTop + 'px'
        textLayer.style.width = this.canvas.width + 'px'
        textLayer.style.height = this.canvas.height + 'px'
        let renderTextLayer = pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayer,
          viewport: this.viewport,
          textDivs: []
        })
        return renderTextLayer.promise
      })
    }
  }
}
</script>

<style scoped>
.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1.0;
}

.text-layer > div {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
</style>
