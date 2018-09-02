import {select as d3Select} from 'd3-selection'
import {lineRadial, curveBundle} from 'd3-shape'
import {scaleLinear} from 'd3-scale'
import uniq from 'lodash/uniq'

export default function Circo ({
  papers, relations, containerId
}) {
  let container = d3Select(containerId)
  let cnode = container.node()
  let width = cnode.clientWidth
  let height = cnode.clientHeight
  let diameter = Math.min(width, height)
  let radius = diameter / 2
  let innerRadius = radius - 150
  let paperTotal = papers.length

  let selectedPaperIds = []

  let circo = {}

  circo.onselect = function () {}

  papers.forEach(function (paper, pi) {
    paper.x = innerRadius * Math.cos(pi / paperTotal * Math.PI * 2 - Math.PI / 2)
    paper.y = innerRadius * Math.sin(pi / paperTotal * Math.PI * 2 - Math.PI / 2)
    paper.angle = pi / paperTotal * 360
    paper.radius = innerRadius
  })

  let line = lineRadial()
    .curve(curveBundle.beta(0.5))
    .radius(d => d.radius - 10)
    .angle(d => d.angle * Math.PI / 180)

  let svg = container.append('svg')
    .attr('width', diameter)
    .attr('height', diameter)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

  let link = svg.append('g').selectAll('.link')
  let node = svg.append('g').selectAll('.node')

  let citationExtent = [
    Math.min(...papers.map(d => d.citationCount)),
    Math.max(...papers.map(d => d.citationCount))
  ]

  let setNodeSize = scaleLinear()
    .domain(citationExtent)
    .range([5, 20])

  let references = relations.map((ref) => {
    return [
      papers[ref.citedBy],
      {angle: 0, radius: 10}, // curve midpoint
      papers[ref.citing]
    ]
  })

  let links = link
    .data(references)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', line)

  let nodes = node
    .data(papers)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => 'translate(' + (d.x) + ', ' + d.y + ')')

  let circles = nodes.append('circle')
    .attr('class', 'circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', d => setNodeSize(d.citationCount))

  nodes.append('text')
    .attr('class', 'node-label')
    .attr('dy', '0.31em')
    .attr('text-anchor', (d) => {
      return (d.angle >= 180) ? 'end' : 'start'
    })
    .attr('transform', (d) => {
      if (d.angle > 180) {
        return 'rotate(' + (d.angle + 90) + ') translate(-20, 0)'
      } else {
        return 'rotate(' + (d.angle - 90) + ') translate(20, 0)'
      }
    })
    .text((d) => {
      return d.authors.replace('and', ',').split(',')[0] + ' et. al ' + d.year
      // return d.title.substring(0, 10)
    })

  function highlight(pid) {
    let pids = (pid === undefined) ? selectedPaperIds : [pid]

    let connected = relations.filter((c) => pids.indexOf(c.citedBy) !== -1 || pids.indexOf(c.citing) !== -1)
    console.log(connected)
    let sources = uniq(connected.map(n => n.citedBy).filter(i => pids.indexOf(i) === -1))
    let targets = uniq(connected.map(n => n.citing).filter(i => pids.indexOf(i) === -1))

    console.log(sources, targets)

    circles.filter((n, ni) => pids.indexOf(ni) !== -1)
      .style('fill', 'steelblue')

    circles.filter((n, ni) => sources.indexOf(ni) !== -1)
      .style('fill', 'green')

    circles.filter((n, ni) => targets.indexOf(ni) !== -1)
      .style('fill', 'orange')

    links.style('opacity', 0.3).style('stroke', 'steelblue')

    links.filter(d => pids.indexOf(d[0].tempId) !== -1)
      .raise()
      .style('opacity', 1)
      .style('stroke-width', 3)
      .style('stroke', 'orange')

    links.filter(d => pids.indexOf(d[2].tempId) !== -1)
      .raise()
      .style('opacity', 1)
      .style('stroke-width', 3)
      .style('stroke', 'green')

    if (typeof(pid) === 'undefined') {
      circo.onselect({
        selected: pids,
        referenced: targets,
        citedBy: sources
      })
    }

  }

  nodes.on('click', function (p, pi) {
    // console.log(d3Select(this), d)
    nodes.selectAll('.circle').style('fill', '#bbb')
    // d3Select(this).style('fill', 'steelblue')
    selectedPaperIds.push(pi)
    highlight()
  })

  nodes.on('mouseenter', function (p, pi) {
    // console.log(d3Select(this), d)
    nodes.selectAll('.circle').style('fill', '#bbb')
    // d3Select(this).style('fill', 'steelblue')
    // selectedPaperIds = [pi]
    highlight(pi)
  })

  nodes.on('mouseleave', function (p, pi) {
    // console.log(d3Select(this), d)
    nodes.selectAll('.circle').style('fill', '#bbb')
    // d3Select(this).style('fill', 'steelblue')
    // selectedPaperIds = [pi]
    highlight()
  })

  return circo
}
