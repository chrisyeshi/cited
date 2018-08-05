
export function getPaperCitedByLevels (graph) {
  return getPaperLevels(graph, 'citedBy', 'citing')
}

export function getPaperCitingLevels (graph) {
  return getPaperLevels(graph, 'citing', 'citedBy')
}

export function toPaperGrid (colRows) {
  let grid = []
  Object.keys(colRows).forEach(pid => {
    const colRow = colRows[pid]
    grid[colRow.col] = grid[colRow.col] === undefined ? [] : grid[colRow.col]
    grid[colRow.col][colRow.row] = pid
  })
  grid.forEach((column, index) => {
    grid[index] = column === undefined ? [] : column
  })
  return grid
}

export function toPaperColRows (grid) {
  let colRows = {}
  for (let iCol = 0; iCol < grid.length; ++iCol) {
    const column = grid[iCol]
    for (let iRow = 0; iRow < column.length; ++iRow) {
      const paperId = column[iRow]
      colRows[paperId] = { col: iCol, row: iRow }
    }
  }
  return colRows
}

function getPaperLevels (graph, rootProp, connProp) {
  let levels = {}
  const rootIds = graph.nodes.reduce((paperIds, node, paperId) => {
    if (node[rootProp].length === 0) {
      paperIds.push(paperId)
    }
    return paperIds
  }, [])
  rootIds.forEach(paperId => { levels[paperId] = 0 })
  let bfsQueue = [].concat(rootIds)
  while (bfsQueue.length > 0) {
    const currId = bfsQueue.shift()
    const paperIds = graph.nodes[currId][connProp]
    paperIds.forEach(paperId => {
      levels[paperId] = levels[paperId] ? Math.max(levels[currId] + 1, levels[paperId]) : levels[currId] + 1
      bfsQueue.push(paperId)
    })
  }
  return levels
}
