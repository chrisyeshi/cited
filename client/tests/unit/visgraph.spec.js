import { ArtGraph, VisGraph } from '@/components/visgraph.js'

describe('ArtGraph', () => {
//   test('getNodeLevels can handle infinite loops in a graph', async () => {
//     const adjLists = {
//       i: { references: [], citedBys: [ 'a', 'b' ] },
//       a: { references: [ 'i', 'b' ], citedBys: [] },
//       b: { references: [ 'i' ], citedBys: [ 'a' ] }
//     }
//     const artGraph = new ArtGraph({}, adjLists)
//     const levelsMap = artGraph.getNodeLevels('references', 'citedBys')
//     expect(levelsMap).toEqual({ i: 0, a: 1, b: 1 })
//   })

//   test('getNodeLevels return the minimum level of a node when loop happens',
//       async () => {
//     const adjLists = {
//       a: { references: [], citedBys: [ 'b', 'c' ] },
//       b: { references: [ 'a', 'c' ], citedBys: [ 'c' ] },
//       c: { references: [ 'a', 'b' ], citedBys: [ 'b' ] }
//     }
//     const artGraph = new ArtGraph({}, adjLists)
//     const levelsMap = artGraph.getNodeLevels('references', 'citedBys')
//     expect(levelsMap).toEqual({ a: 0, b: 1, c: 1 })
//   })

// test('makeColRowsMap grid undefined', async () => {
//   const coll = await import('./bengio-2007-867f2442b3c9c6fd.json')
//   const visGraph = VisGraph.fromColl(coll)
// })
})