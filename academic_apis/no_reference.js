import _ from 'lodash'
import path from 'path'

const arts = require(path.join(__dirname, process.argv[2]))
const noRefs = _.filter(arts, art => _.isNil(art.references))
const titles = _.map(noRefs, art => art.title)
_.forEach(titles, title => console.log(title))
