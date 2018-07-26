import * as d3 from 'd3'
export default function Circo (papers, relations, container) {
  var diameter = 960
  var radius = diameter / 2
  // var innerRadius = radius - 120
  var paperTotal = papers.length - 1
  papers.forEach(function (paper, pi) {
    paper.x = radius / 2 * Math.cos(pi / paperTotal * Math.PI * 2)
    paper.y = radius / 2 * Math.sin(pi / paperTotal * Math.PI * 2)
    paper.angle = pi / paperTotal * 360
  })
  var line = d3.radialLine()
    // .curve(d3.curveBundle.beta(0.85))
    .radius(radius / 2)
    .angle(function (d) {
      return d.angle * Math.PI / 180
    })
  var svg = d3.select(container).append('svg')
    .attr('width', diameter)
    .attr('height', diameter)
    .append('g')
    .attr('transform', 'translate(' + radius + ',' + radius + ')')

  var link = svg.append('g').selectAll('.link')
  var node = svg.append('g').selectAll('.node')

  var references = relations.map(function (ref) {
    return [papers[ref.citedBy], papers[ref.citing]]
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
    .attr('r', 10)

  node.append('text')
    .attr('dy', '0.31em')
    .attr('text-anchor', function (d) {
      return (d.angle <= 90 || d.angle >= 270) ? 'start' : 'end'
    })
    .attr('transform', function (d) {
      return 'rotate(' + ((d.angle > 90 && d.angle < 270) ? d.angle - 180 : d.angle) + ')'
    })

    .text(function (d) {
      return d.title.substring(0, 10)
    })
}
