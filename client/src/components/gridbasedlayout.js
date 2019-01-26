import _ from 'lodash'

export function getColRowsByYears (graph) {
  const years = graph.nodes.map(node => node.paper.year)
  let onlyUnique = (value, index, self) => self.indexOf(value) === index
  let yearUniqueNum = years.filter(onlyUnique).sort((a, b) => a - b)
  let yearUniqueStr = yearUniqueNum.map(year => year.toString())
  let yearPapers = {}
  yearUniqueStr.forEach(yearStr => {
    yearPapers[yearStr] = []
  })
  graph.nodes.forEach(node => {
    const paper = node.paper
    yearPapers[paper.year.toString()].push(paper)
  })
  yearUniqueStr.forEach(yearStr => {
    yearPapers[yearStr].sort((a, b) => b.citationCount - a.citationCount)
  })
  const colRows = graph.nodes.map(node => {
    const paper = node.paper
    return {
      col: yearUniqueStr.indexOf(paper.year.toString()),
      row: yearPapers[paper.year.toString()].indexOf(paper)
    }
  })
  return colRows
}

export function getColRowsByCitedLevels (graph) {
  const citedByLevels = getPaperCitedByLevels(graph)
  let colRows = {}
  let columnCounters = []
  const maxCitedByLevel = getMaxProp(citedByLevels)
  Object.keys(citedByLevels).forEach(paperId => {
    const colId = maxCitedByLevel - citedByLevels[paperId]
    const rowId = columnCounters[colId] ? columnCounters[colId] : 0
    colRows[paperId] = {
      col: colId,
      row: rowId
    }
    columnCounters[colId] = rowId + 1
  })
  return colRows
}

export function getColRowsByCitingLevels (graph) {
  const citingLevels = getPaperCitingLevels(graph)
  const grid = []
  Object.keys(citingLevels).forEach(paperId => {
    grid[citingLevels[paperId]] = grid[citingLevels[paperId]] || []
    grid[citingLevels[paperId]].push(paperId)
  })
  const sortedGrid = _.map(grid, column => {
    const sortedColumn = _.sortBy(column, paperId => {
      return -graph.nodes[paperId].inGraphCitedBys.length
    })
    return sortedColumn
  })
  return toPaperColRows(sortedGrid)
  // let colRows = {}
  // let columnCounters = []
  // Object.keys(citingLevels).forEach(paperId => {
  //   const colId = citingLevels[paperId]
  //   const rowId = columnCounters[colId] ? columnCounters[colId] : 0
  //   colRows[paperId] = {
  //     col: colId,
  //     row: rowId
  //   }
  //   columnCounters[colId] = rowId + 1
  // })
  // return colRows
}

export function getColRowsByOptimalYearIntervals (graph) {
  const citedByLevels = getPaperCitedByLevels(graph)
  const citingLevels = getPaperCitingLevels(graph)
  const paperIndexes = Object.keys(citedByLevels)
  const maxCitedByLevel = getMaxProp(citedByLevels)
  const columnCount = maxCitedByLevel + 1
  const paperColIntervals = paperIndexes.map(paperIndex => {
    const citedByLevel = citedByLevels[paperIndex]
    const citingLevel = citingLevels[paperIndex]
    return {
      min: citingLevel,
      max: columnCount - 1 - citedByLevel
    }
  })

  const years = graph.nodes.map(node => node.paper.year)
  const optimalYearIntervals = getMostEvenIntervals(years, columnCount)

  let sortedPaperIndexes = paperIndexes.slice()
  let colIntervals = paperColIntervals.slice()
  let grid = optimalYearIntervals.map(() => ([]))
  while (sortedPaperIndexes.length > 0) {
    sortedPaperIndexes.sort((a, b) => {
      const aRange = colIntervals[a].max - colIntervals[a].min
      const bRange = colIntervals[b].max - colIntervals[b].min
      return aRange - bRange
    })
    let i = 0
    for (; i < sortedPaperIndexes.length; ++i) {
      const paperIndex = sortedPaperIndexes[i]
      const colInterval = colIntervals[paperIndex]
      if (colInterval.min === colInterval.max) {
        grid[colInterval.min].push(paperIndex)
        continue
      }
      let yearErrors = []
      for (let iCol = colInterval.min; iCol <= colInterval.max; ++iCol) {
        const year = years[paperIndex]
        const yearInterval = optimalYearIntervals[iCol]
        yearErrors[iCol] = Math.max(0, yearInterval.min - year, year - yearInterval.max)
      }
      const iCols = getMinIndexes(yearErrors)
      if (iCols.length === 1) {
        const iCol = iCols[0]
        grid[iCol].push(paperIndex)
        colIntervals =
          updateColIntervals(paperIndex, iCol, graph, colIntervals)
        break
      }
      iCols.sort((a, b) => {
        return grid[a].length - grid[b].length
      })
      const iCol = iCols[0]
      grid[iCol].push(paperIndex)
      colIntervals =
        updateColIntervals(paperIndex, iCol, graph, colIntervals)
      break
    }
    sortedPaperIndexes = sortedPaperIndexes.slice(i + 1)
  }

  return toPaperColRows(grid)
}

export function toPaperGrid (inColRows) {
  const toColRowsObject = inColRows => _.pickBy(_.mapValues(inColRows))
  const colRows = toColRowsObject(inColRows)
  const nCol = _.max(_.map(colRows, _.property('col'))) + 1
  let grid = _.times(nCol, () => ([]))
  _.forEach(colRows, ({ col, row }, paperIdStr) => {
    grid[col][row] = _.toNumber(paperIdStr)
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

export function moveColRow (fromColRows, paperId, toColRow) {
  let fromGrid = toPaperGrid(fromColRows)
  const fromColRow = fromColRows[paperId]
  fromGrid[fromColRow.col][fromColRow.row] = undefined
  fromGrid[toColRow.col].splice(toColRow.row, 0, paperId)
  const tempGrid = fromGrid.map(column => {
    const newCol = column.filter(pid => pid !== undefined)
    return newCol
  })
  const toGrid = tempGrid.filter(col => col.length !== 0)
  return toPaperColRows(toGrid)
}

export function getPaperCitedByLevels (graph) {
  return getPaperLevels(graph, 'inGraphCitedBys', 'inGraphCitings')
}

export function getPaperCitingLevels (graph) {
  return getPaperLevels(graph, 'inGraphCitings', 'inGraphCitedBys')
}

function getPaperLevels (graph, rootProp, connProp) {
  let levels = _.times(graph.nodes.length, _.constant(0))
  const rootIndexes = graph.nodes.reduce((paperIndexes, node, paperIndex) => {
    if (node[rootProp].length === 0) {
      paperIndexes.push(paperIndex)
    }
    return paperIndexes
  }, [])
  rootIndexes.forEach(paperIndex => { levels[paperIndex] = 0 })
  let bfsQueue = [].concat(rootIndexes)
  while (bfsQueue.length > 0) {
    const currIndex = bfsQueue.shift()
    const paperIds = graph.nodes[currIndex][connProp]
    const paperIndexes = _.map(paperIds, paperId => _.findIndex(graph.nodes, node => node.paper.id === paperId))

    paperIndexes.forEach(paperIndex => {
      levels[paperIndex] = levels[paperIndex] ? Math.max(levels[currIndex] + 1, levels[paperIndex]) : levels[currIndex] + 1
      bfsQueue.push(paperIndex)
    })
  }
  return levels
}

function getMinIndexes (numbers) {
  let min = Number.MAX_SAFE_INTEGER
  let indexes = []
  numbers.forEach((num, iNum) => {
    if (num === undefined) {
      return
    }
    if (num < min) {
      indexes = [ iNum ]
      min = num
    } else if (num === min) {
      indexes.push(iNum)
    }
  })
  return indexes
}

function updateColIntervals (paperIndex, iCol, graph, colIntervals) {
  let colInts = colIntervals.slice()
  colInts[paperIndex] = { min: iCol, max: iCol }
  graph.nodes[paperIndex].inGraphCitings.forEach(citingId => {
    const citingIndex =
      _.findIndex(graph.nodes, node => node.paper.id === citingId)
    let interval = colIntervals[citingIndex]
    colInts[citingIndex] = {
      min: interval.min,
      max: Math.min(iCol - 1, interval.max)
    }
  })
  graph.nodes[paperIndex].inGraphCitedBys.forEach(citedById => {
    const citedByIndex =
      _.findIndex(graph.nodes, node => node.paper.id === citedById)
    let interval = colIntervals[citedByIndex]
    colInts[citedByIndex] = {
      min: Math.max(iCol + 1, interval.min),
      max: interval.max
    }
  })
  return colInts
}

function getValueArray (obj) {
  return Object.keys(obj).map(key => obj[key])
}

function getMaxProp (obj) {
  return Math.max(...getValueArray(obj))
}

function getMostEvenIntervals (years, columnCount) {
  const sortedYears = years.slice().sort()
  let optimalYearIntervals = []
  for (let iCol = 0; iCol < columnCount; ++iCol) {
    const loId = Math.round(iCol / columnCount * (years.length - 1))
    const upId = Math.round((iCol + 1) / columnCount * (years.length - 1))
    optimalYearIntervals[iCol] = { min: sortedYears[loId], max: sortedYears[upId] }
  }
  // for (let iCol = 1; iCol < columnCount; ++iCol) {
  //   const min = Math.max(optimalYearIntervals[iCol].min, optimalYearIntervals[iCol - 1].max + 1)
  //   const max = Math.max(min, optimalYearIntervals[iCol].max)
  //   optimalYearIntervals[iCol] = { min: min, max: max }
  // }
  // for (let iCol = columnCount - 2; iCol >= 0; --iCol) {
  //   const max = Math.min(optimalYearIntervals[iCol].max, optimalYearIntervals[iCol + 1].min - 1)
  //   const min = Math.min(max, optimalYearIntervals[iCol].min)
  //   optimalYearIntervals[iCol] = { min: min, max: max }
  // }
  return optimalYearIntervals
}
