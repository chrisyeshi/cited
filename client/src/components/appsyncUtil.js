import _ from 'lodash'

export async function chunkOp (input, batchLimit, batchFunc) {
  const inputChunks = _.chunk(input, batchLimit)
  return _.flatten(await Promise.all(_.map(inputChunks, async input => {
    return batchFunc(input)
  })))
}
