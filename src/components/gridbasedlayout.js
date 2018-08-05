
export function getColRowsByYears (nodes) {
  const years = nodes.map(node => node.paper.year)
  let onlyUnique = (value, index, self) => self.includes(value)
  let yearUniqueNum = years.filter(onlyUnique).sort((a, b) => a - b)
  let yearUniqueStr = yearUniqueNum.map(year => year.toString())
  let yearPapers = {}
  yearUniqueStr.forEach(yearStr => {
    yearPapers[yearStr] = []
  })
  nodes.forEach(node => {
    const paper = node.paper
    yearPapers[paper.year.toString()].push(paper)
  })
  yearUniqueStr.forEach(yearStr => {
    yearPapers[yearStr].sort((a, b) => b.citationCount - a.citationCount)
  })
  const colRows = nodes.map(node => {
    const paper = node.paper
    return {
      col: yearUniqueStr.indexOf(paper.year.toString()),
      row: yearPapers[paper.year.toString()].indexOf(paper)
    }
  })
  return colRows
}

export function getColRowsByCitedLevels (nodes) {
  const citedByLevels = getPaperCitedByLevels(nodes)
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

export function getColRowsByOptimalYearIntervals (nodes) {
  const citedByLevels = getPaperCitedByLevels(nodes)
  const citingLevels = getPaperCitingLevels(nodes)
  const paperIds = Object.keys(citedByLevels)
  const maxCitedByLevel = getMaxProp(citedByLevels)
  const columnCount = maxCitedByLevel + 1
  const paperColIntervals = paperIds.map(paperId => {
    const citedByLevel = citedByLevels[paperId]
    const citingLevel = citingLevels[paperId]
    return {
      min: citingLevel,
      max: columnCount - 1 - citedByLevel
    }
  })

  const years = nodes.map(node => node.paper.year)
  const optimalYearIntervals = getMostEvenIntervals(years, columnCount)

  let sortedPaperIds = paperIds.slice()
  let colIntervals = paperColIntervals.slice()
  let grid = optimalYearIntervals.map(() => ([]))
  while (sortedPaperIds.length > 0) {
    // console.table(grid)
    sortedPaperIds.sort((a, b) => {
      const aRange = colIntervals[a].max - colIntervals[a].min
      const bRange = colIntervals[b].max - colIntervals[b].min
      return aRange - bRange
    })
    for (let i = 0; i < sortedPaperIds.length; ++i) {
      const paperId = sortedPaperIds[i]
      const colInterval = colIntervals[paperId]
      if (colInterval.min === colInterval.max) {
        grid[colInterval.min].push(paperId)
        continue
      }
      let yearErrors = []
      for (let iCol = colInterval.min; iCol <= colInterval.max; ++iCol) {
        const year = years[paperId]
        const yearInterval = optimalYearIntervals[iCol]
        yearErrors[iCol] = Math.max(0, yearInterval.min - year, year - yearInterval.max)
      }
      const iCols = getMinIndexes(yearErrors)
      if (iCols.length === 1) {
        const iCol = iCols[0]
        grid[iCol].push(paperId)
        colIntervals = updateColIntervals(paperId, iCol, nodes, colIntervals)
        sortedPaperIds = sortedPaperIds.slice(i + 1)
        break
      }
      iCols.sort((a, b) => {
        return grid[a].length - grid[b].length
      })
      const iCol = iCols[0]
      grid[iCol].push(paperId)
      colIntervals = updateColIntervals(paperId, iCol, nodes, colIntervals)
      sortedPaperIds = sortedPaperIds.slice(i + 1)
      break
    }
  }

  return toPaperColRows(grid)
}

export function getPaperCitedByLevels (nodes) {
  return getPaperLevels(nodes, 'citedBy', 'citing')
}

export function getPaperCitingLevels (nodes) {
  return getPaperLevels(nodes, 'citing', 'citedBy')
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

function getPaperLevels (nodes, rootProp, connProp) {
  let levels = {}
  const rootIds = nodes.reduce((paperIds, node, paperId) => {
    if (node[rootProp].length === 0) {
      paperIds.push(paperId)
    }
    return paperIds
  }, [])
  rootIds.forEach(paperId => { levels[paperId] = 0 })
  let bfsQueue = [].concat(rootIds)
  while (bfsQueue.length > 0) {
    const currId = bfsQueue.shift()
    const paperIds = nodes[currId][connProp]
    paperIds.forEach(paperId => {
      levels[paperId] = levels[paperId] ? Math.max(levels[currId] + 1, levels[paperId]) : levels[currId] + 1
      bfsQueue.push(paperId)
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

function updateColIntervals (paperId, iCol, nodes, colIntervals) {
  let colInts = colIntervals.slice()
  colInts[paperId] = { min: iCol, max: iCol }
  nodes[paperId].citing.forEach(citingId => {
    let interval = colIntervals[citingId]
    colInts[citingId] = {
      min: interval.min,
      max: Math.min(iCol - 1, interval.max)
    }
  })
  nodes[paperId].citedBy.forEach(citedById => {
    let interval = colIntervals[citedById]
    colInts[citedById] = {
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
