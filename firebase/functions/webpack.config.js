const nodeExternals = require('webpack-node-externals')
const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    libraryTarget: 'this',
    path: path.resolve(__dirname)
  },
  target: 'node',
  externals: [ nodeExternals() ]
}
