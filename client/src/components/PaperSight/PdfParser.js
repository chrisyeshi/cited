import axios from 'axios'
import pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../../node_modules/pdfjs-dist/build/webpack/pdf.worker.min.js'

/**
 * Create a PDFLoader to load and parse info from a scholar paper in a PDF file
 */
export default class PdfLoader {
  constructor (pdfBlob) {
    this.pdf = pdfBlob
  }

  load () {
    return pdfjsLib.getDocument({url: this.pdf})
    // return pdfjsLib.getDocument(this.pdf)
  }

  /**
   * Get paper info from PDF metadata. If no info was provided
   * in metadata, parse pdf content to get the info.
   */
  getInfo () {
    return new Promise((resolve, reject) => {
      this.load().then((pdf) => {
        pdf.getMetadata().then((md) => {
          let info = md.info
          let year = info.CreationDate.slice(2, 6) || 'unknown'
          let authors = (info.Author) ? info.Author.replace('and', ',').split(',') : false
          let title = (info.Title && info.Title.length > 10) ? info.Title : false
          if (authors && title) {
            resolve({year, authors, title})
          } else {
            this.parseInfo().then((info) => {
              resolve(Object.assign({year}, info))
            })
          }
        })
      })
    })
  }

  getPage (pageNumber) {
    return this.load().then((pdf) => {
      return pdf.getPage(pageNumber)
    })
  }

  /**
   * parse PDF conetent to get paper info (title, author, etc.,)
   */
  parseInfo () {
    return this.load().then((pdf) => {
      return pdf.getPage(1).then((text) => {
        return text.getTextContent()
      }).then((content) => {
        const MIN_TITLE_LENGTH = 10
        const MIN_NAME_LENGTH = 5
        const MAX_ROWS_PARSE = 30
        let items = content.items
        let topRows = items.slice(0, MAX_ROWS_PARSE).filter((item) => item.str.length > MIN_TITLE_LENGTH)
        let largestText = Math.max(...topRows.map((item) => item.height))
        let titleRowIndex = items.slice(0, MAX_ROWS_PARSE).map((item) => item.height).indexOf(largestText)
        let title = items[titleRowIndex].str
        let authorRowIndex = titleRowIndex + 1
        let authors = items[authorRowIndex].str
        if (!authors.includes(',') && !authors.includes('and')) {
          title += authors
          authorRowIndex++
          authors = items[authorRowIndex].str
        }

        while (authors.length < MIN_NAME_LENGTH) {
          authorRowIndex++
          authors = items[authorRowIndex].str
        }
        authors = authors.replace('and', ',').split(',')
        return new Promise((resolve, reject) => {
          resolve({authors, title})
        })
      })
    })
  }

  /**
   * return all text after "References"
   * @param {Array of pdfText Objects} texts
   */
  getReferenceTexts (texts) {
    let result = texts
    for (const [index, item] of texts.entries()) {
      if (item.str.toLowerCase() === 'eferences' || item.str.toLowerCase() === 'references') {
        result = texts.slice(index + 1)
        break
      }
    }
    return result
  }

  /**
   * Remove or replace phrases that prevent references to be parsed correctly
   * @param {Array of pdfText Objects} texts
   */
  sanitize (texts) {
    let refs = texts
      .map((item) => item.str.replace(/\[(O|o)nline.*\]/g, 'online'))
      .join(' ').split('[')

    refs.shift()
    return refs.map((ref) => '[' + ref)
  }

  extract (refText) {
    if (refText[refText.length - 1].length > 500) {
      refText[refText.length - 1] = refText[refText.length - 1].slice(0, 500)
    }
    let refQuery = refText.map(rt => '\'' + rt.replace(/\[.+\]/, '').replace('- ', '').replace('&', '') + '\'').join('+')
    return axios('/api/anystyle?refs=' + encodeURIComponent(refQuery))
  }

  /**
   * Get all references from a scholar paper in PDF
   * TODO: Support papers with more than 2 pages of references
   */
  getReferences () {
    let refText
    return this.load().then((pdf) => {
      let refStart = false
      return pdf.getPage(pdf.numPages).then((text) => {
        return text.getTextContent()
      }).then((text) => {
        refText = this.getReferenceTexts(text.items)
        refStart = refText.length !== text.items.length
        if (refStart) {
          return new Promise((resolve, reject) => {
            resolve(refText)
          })
        } else {
          return pdf.getPage(pdf.numPages - 1)
        }
      }).then((text) => {
        if (!refStart) return text.getTextContent()
      }).then((text) => {
        if (!refStart) refText = this.getReferenceTexts(text.items).concat(refText)
        // debugger
        return this.extract(this.sanitize(refText))
      }).then((refs) => {
        return new Promise((resolve, reject) => {
          resolve(refs)
        })
      })
    })
  }
}
