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
    return this.load().then((pdf) => {
      return pdf.getMetadata()
    }).then((md) => {
      let info = md.info
      let year = (info.CreationDate) ? info.CreationDate.slice(2, 6) : 'unknown'
      let authors = (info.Author) ? info.Author.replace('and', ',').split(',') : false
      let title = (info.Title && info.Title.length > 10) ? info.Title : false
      if (authors && title) {
        return this.parseInfo({year, authors, title})
      } else {
        return this.parseInfo({year})
      }
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
  parseInfo (info) {
    return this.load().then((pdf) => {
      return pdf.getPage(1)
    }).then((text) => {
      return text.getTextContent()
    }).then((content) => {
      let items = content.items
      let paperInfo = {}
      let abstract = []
      let keywords = []
      let abstractStart = false
      let keywordStart = false
      for (let i = 0; i < items.length; i++) {
        let item = items[i]
        if (item.str.match(/ntroduction$/i)) {
          break
        }
        if (keywordStart && item.str.length > 3) {
          keywords.push(item.str)
        }
        if (item.str.match(/eywords:?$/i) || item.str.match(/^Index Terms$/i)) {
          abstractStart = false
          keywordStart = true
        }
        if (abstractStart) {
          abstract.push(item.str)
        }
        if (item.str.match(/bstract$/i)) {
          abstractStart = true
        }
      }
      abstract = abstract.join('').replace(/\s+/g, ' ')
      keywords = keywords.join('')
      if (info.title && info.authors) {
        paperInfo = Object.assign({}, info)
      } else {
        const MIN_TITLE_LENGTH = 10
        const MIN_NAME_LENGTH = 5
        const MAX_ROWS_PARSE = 30
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
        paperInfo = {title, authors}
      }
      paperInfo.abstract = abstract
      paperInfo.keywords = keywords
      paperInfo.year = info.year
      return new Promise((resolve, reject) => {
        resolve(paperInfo)
      })
    })
  }

  /**
   * return all text after "References"
   * @param {Array of pdfText Objects} texts
   */
  getReferenceTexts (texts) {
    // console.log(texts)
    let result = texts
    for (const [index, item] of texts.entries()) {
      if (item.str.toLowerCase() === 'eferences' || item.str.toLowerCase() === 'references' || item.str.match(/^\d+.*references$/i)) {
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
  sanitizeUrl (urlString) {
    return urlString
      .replace(/\[.+\]/, '')
      .replace(/'/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace('- ', '')
      .replace('&', '')
  }

  sanitize (texts) {
    return texts.map((item) => item.str.replace(/\[(O|o)nline.*\]/g, 'online'))
  }

  extract (refTexts) {
    let refItems = []
    let refLabelPatterns = [
      new RegExp(/^\[(.+)\]/),
      new RegExp(/^(\d{1,2})\./)
    ]
    let labelPattern = null
    let currentRefItem = ''
    refTexts.forEach(refText => {
      if (labelPattern === null) {
        for (let i = 0; i < refLabelPatterns.length; i++) {
          let pattern = refLabelPatterns[i]
          if (refText.match(pattern)) {
            labelPattern = pattern
            break
          }
        }
      } else {
        let match = refText.match(labelPattern)
        if (match) {
          // console.log(match)
          if (match[1].match(/^\d+$/)) {
            if (Number(match[1]) === refItems.length + 2) {
              refItems.push(currentRefItem)
              currentRefItem = ''
            }
          } else {
            refItems.push(currentRefItem)
            currentRefItem = ''
          }
        } else {
          currentRefItem += refText
        }
      }
    })
    // refItems.shift()
    if (refItems[refItems.length - 1].length > 500) {
      refItems[refItems.length - 1] = refItems[refItems.length - 1].slice(0, 500)
    }
    let refQuery = refItems.map(rt => '\'' + this.sanitizeUrl(rt) + '\'').join('+')
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
          // TODO: keep looking up until we found the start of Reference section
          return pdf.getPage(pdf.numPages - 1)
        }
      }).then((text) => {
        if (!refStart) return text.getTextContent()
      }).then((text) => {
        let moreRefText = []
        if (!refStart) {
          moreRefText = this.getReferenceTexts(text.items)
          refText = moreRefText.concat(refText)
        }
        // debugger
        if (!refStart && moreRefText.length === text.items.length) { // this means no references found
          return new Promise((resolve, reject) => {
            resolve()
          })
        } else {
          return this.extract(refText.map(r => r.str))
        }
      }).then((refs) => {
        return new Promise((resolve, reject) => {
          resolve(refs)
        })
      })
    })
  }
}
