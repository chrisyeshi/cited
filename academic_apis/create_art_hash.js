import _ from 'lodash'
import createArtHash from './createarthash.js'

const [ , , , , ...title ] = process.argv
console.log(_.join(title, ' '))
console.log(createArtHash(process.argv[2], process.argv[3], _.join(title, ' ')))
