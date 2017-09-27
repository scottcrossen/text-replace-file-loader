const fs = require('fs')
const fileLoader = require('file-loader')

module.exports = function(source) {

  // Fs calls and resolve calls are Async so we'll output it like that too.
  const callback = this.async()

  // Keep going through the file untill there are no more instances left.
  const recurseThroughFile = function(file) {
    const startIndex = file.indexOf('require(')
    // Base case when there is no more require statements left.
    if (startIndex == -1) return Promise.resolve(file)
    const endIndex = file.indexOf(')', startIndex)
    const subStr = file.substring(startIndex, endIndex + 1)
    const mustResolveFile = subStr.substring(9, subStr.length - 2)
    return new Promise(function(resolve, reject) {
      this.resolve(this.context, mustResolveFile,
        function(err, data) {
          if (err) {
            return reject(err)
          } else {
            return resolve(data)
          }
        }
      )
    }.bind(this)).then(function(fileName) {
      // Convert the found file to a buffer.
      return new Promise(function(resolve, reject) {
        fs.readFile(fileName, function (err, data) {
          if (err) {
            return reject(err)
          } else {
            return resolve({data: data, resourcePath: fileName})
          }
        })
      })
    }).then(function(data) {
      // Prepare context for binding to file-loader.
      const newResourcePath = data.resourcePath
      const newResource = newResourcePath + this.resourceQuery
      const newRequest = this.request.substring(0, this.request.lastIndexOf('!')) + '!' + newResource
      const boundFileLoader = fileLoader.bind(Object.assign({}, this, {resource: newResource, resourcePath: newResourcePath, request: newRequest}))
      // Emit whatever file was found via file-loader.
      const emittedFile = boundFileLoader(data.data)
      // Extract the public name of the resultant file.
      const lastIndex = emittedFile.lastIndexOf('\"')
      const firstIndex = emittedFile.substring(0, lastIndex).lastIndexOf('\"') + 1
      const rootPath = this.options.output.publicPath
      // Replace require statement with public path of file
      const fullPath = ((rootPath.substr(-1) != '/') ? rootPath + '/' : rootPath) + emittedFile.substring(firstIndex, lastIndex)
      // Continue recursion
      return recurseThroughFile(file.substring(0, startIndex) + fullPath + file.substring(endIndex + 1))
    }.bind(this))
  }.bind(this)

  // Actually execute the thing and call the callback if necessary.
  recurseThroughFile(source)
    .then(function(data) {callback(null, data)})
    .catch(function(err) {callback(err)})
}
