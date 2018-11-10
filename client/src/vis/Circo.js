export default function Circo ({
  papers,
  references,
  diameter
}) {
  let radius = diameter / 2
  let innerRadius = radius - 150
  let paperTotal = papers.length
  let nodes = new Array(paperTotal)

  for (let pi = 0; pi < paperTotal; pi++) {
    let node = Object.assign({}, papers[pi])
    node.x = innerRadius * Math.cos(pi / paperTotal * Math.PI * 2 - Math.PI / 2)
    node.y = innerRadius * Math.sin(pi / paperTotal * Math.PI * 2 - Math.PI / 2)
    node.angle = pi / paperTotal * 360
    node.radius = innerRadius
    node.pid = pi
    nodes[pi] = node
  }

  let links = references.map((ref) => {
    return [
      nodes[ref.citedBy],
      {angle: 0, radius: 10}, // curve midpoint
      nodes[ref.citing]
    ]
  })

  return {
    nodes,
    links
  }
}
