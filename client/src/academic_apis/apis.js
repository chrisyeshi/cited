// import queryArxiv from './arxiv.js'
import queryCrossref from './crossref.js'

// queryArxiv({ searchQuery: 'in situ visualization' }).then(res => {
//   console.log(res)
// }).catch(err => {
//   console.error(err)
// })

queryCrossref({ query: 'interactive sankey diagrams' }).then(res => {
  console.log(res.message.items[0])
}).catch(err => {
  console.error(err)
})
