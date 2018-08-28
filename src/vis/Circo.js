import {select as d3Select} from 'd3-selection'
import {lineRadial, curveBundle} from 'd3-shape'
import {scaleLinear} from 'd3-scale'

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

  papers.forEach(function (paper, pi) {
    paper.x = innerRadius * Math.cos(pi / paperTotal * Math.PI * 2)
    paper.y = innerRadius * Math.sin(pi / paperTotal * Math.PI * 2)
    paper.angle = (pi + 0.25) / paperTotal * 360
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
      {angle: 0, radius: 0}, // curve midpoint
      papers[ref.citing]
    ]
  })

  link
    .data(references)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', line)

  node = node
    .data(papers)
    .enter()
    .append('g')
    .attr('transform', d => 'translate(' + (d.x) + ', ' + d.y + ')')

  node.append('circle')
    .attr('class', 'node')
    .attr('cx', d => -10 * Math.cos(d.angle * Math.PI / 180))
    .attr('cy', d => -10 * Math.sin(d.angle * Math.PI / 180))
    .attr('r', d => setNodeSize(d.citationCount))

  node.append('text')
    .attr('dy', '0.31em')
    .attr('text-anchor', function (d) {
      return (d.angle <= 90 || d.angle >= 270) ? 'start' : 'end'
    })
    .attr('transform', function (d) {
      return 'rotate(' + ((d.angle > 90 && d.angle < 270) ? d.angle - 180 : d.angle) + ')'
    })

    .text(function (d) {
      return d.authors.replace('and', ',').split(',')[0] + ' et. al ' + d.year
      // return d.title.substring(0, 10)
    })
}
