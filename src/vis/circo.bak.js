export default function Circo(relations, container) {

  var diameter = 960
  var radius = diameter / 2
  var innerRadius = radius - 120

  var cluster = d3.cluster()
    .size([360, innerRadius])

  var line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function (d) {
      return d.y
    })
    .angle(function (d) {
      return d.x / 180 * Math.PI
    })

  var svg = d3.select(container).append('svg')
    .attr('width', diameter)
    .attr('height', diameter)
    .append('g')
    .attr('transform', 'translate(' + radius + ',' + radius + ')')

  var link = svg.append('g').selectAll('.link')
  var node = svg.append('g').selectAll('.node')
  var root = packageHierarchy(relations)
    .sum(function (d) {
      return 1
    })

  cluster(root)

  console.log(root)

  link = link
    .data(packageImports(root.leaves()))
    .enter().append('path')
    .each(function (d) {
      d.source = d[0]
      d.target = d[d.length - 1]
    })
    .attr('class', 'link')
    .attr('d', line)

  node = node
    .data(root.leaves())
    .enter().append('text')
    .attr('class', 'node')
    .attr('dy', '0.31em')
    .attr('transform', function (d) {
      return 'rotate(' + (d.x - 90) + ')translate(' + (d.y + 8) + ',0)' + (d.x < 180 ? '' : 'rotate(180)')
    })
    .attr('text-anchor', function (d) {
      return d.x < 180 ? 'start' : 'end'
    })
    .text(function (d) {
      return d.data.key
    })
    .on('mouseover', mouseovered)
    .on('mouseout', mouseouted)

  function mouseovered(d) {
    node.each(function (n) {
      n.target = n.source = false
    })

    link
      .classed('link--target', function (l) {
        if (l.target === d) {
          l.source.source = true
          return l.source.source
        }
      })
      .classed('link--source', function (l) {
        if (l.source === d) return l.target.target = true
      })
      .filter(function (l) {
        return l.target === d || l.source === d
      })
      .raise()

    node.classed('node--target', n => n.target)
      .classed('node--source', n => n.source)
  }

  function mouseouted(d) {
    link
      .classed('link--target', false)
      .classed('link--source', false)

    node
      .classed('node--target', false)
      .classed('node--source', false)
  }

  // Lazily construct the package hierarchy from class names.
  function packageHierarchy(relations) {
    var map = {}

    function find(name, data) {
      var node = map[name];
      var i;

      if (!node) {
        node = map[name] = data || {
          name: name,
          children: []
        }
        if (name.length) {
          node.parent = find(name.substring(0, i = name.lastIndexOf('.')))
          node.parent.children.push(node)
          node.key = name.substring(i + 1)
        }
      }
      return node
    }

    relations.forEach(function (d) {
      find(d.name, d)
    })
    console.log(map)
    return d3.hierarchy(map[''])
  }

  // Return a list of imports for the given array of nodes.
  function packageImports(nodes) {
    var map = {}
    var imports = []

    // Compute a map from name to node.
    nodes.forEach(function (d) {
      map[d.data.name] = d
    })

    // For each import, construct a link from the source to target node.
    nodes.forEach(function (d) {
      if (d.data.imports) {
        d.data.imports.forEach(function (i) {
          imports.push(map[d.data.name].path(map[i]))
        })
      }
    })

    return imports
  }
}
