const fs = require('fs')
const fileLoader = require('file-loader')
const loaderUtils = require('loader-utils')

/**
  Forewarning: This is a very hackish solution to a problem. This loader is suppose
  to search through a file (of any type) for literal require statements which it
  will then handle and replace with the public path of the file. The only problem is that
  loaders aren't really suppose to process dependency trees. This would be fine if there
  was an way to create entrypoints on the compilation object of the webpack build from a
  loader but there isn't. Really, this whole project should be handled as a plugin and not
  a loader but I'm too lazy to do that because I already have this finished.
*/
const textReplaceFileLoader = function(source) {

  // Fs calls and resolve calls are Async so we'll output it like that too.
  const callback = this.async()

  // Dependencies will be properly loaded.
  this.cacheable(true)

  // Load options
  const options = Object.assign({},
    {
      recursion: 'emit', // 'emit', 'embed', 'none'
      emit: true, // true or false
    },
    loaderUtils.getOptions(this)
  )

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
      this.dependency(newResourcePath)
      if (options.recursion != 'none') {
        return (new Promise(function(resolve, reject) {
          const boundFileLoader = textReplaceFileLoader.bind(Object.assign({}, this, {
            resource: newResource,
            resourcePath: newResourcePath,
            request: newRequest,
            query: Object.assign({}, options, {emit: options.recursion == 'emit'}),
            // Turn the output of the recursive call into a promise.
            async: function() {
              return function(arg1, arg2) {
                if (arg1) {
                  reject(arg1)
                } else {
                  resolve(arg2)
                }
              }
            },
            // No need to specify this again.
            cacheable: function(bool) {
            }
          }))
          boundFileLoader(data.data)
        }.bind(this))).then(function(emittedData) {
          if (options.recursion == 'emit' || newRequest.match(/.(jpg|jpeg|png|gif)$/i)) {
            // Extract the public name of the resultant file from file-loader
            const lastIndex = emittedData.lastIndexOf('\"')
            const firstIndex = emittedData.substring(0, lastIndex).lastIndexOf('\"') + 1
            const publicFile = emittedData.substring(firstIndex, lastIndex)
            // Replace require statement with public path of file
            const rootPath = this.options.output.publicPath
            const fullPath = ((rootPath.substr(-1) != '/') ? rootPath + '/' : rootPath) + publicFile
            return fullPath
          } else {
            return emittedData
          }
        }.bind(this))
      } else {
        const rootPath = this.options.output.publicPath
        const fullPath = loaderUtils.urlToRequest(mustResolveFile)
        return Promise.resolve(fullPath)
      }
    }.bind(this)).then(function(emittedFile) {
      // Continue recursion
      return recurseThroughFile(file.substring(0, startIndex) + emittedFile + file.substring(endIndex + 1))
    }.bind(this))
  }.bind(this)

  const boundFileLoader = fileLoader.bind(this)

  // The recursion could happen with image files too but it's just quicker to not.
  const getPromise = function() {
    if (this.request.match(/.(jpg|jpeg|png|gif)$/i)) {
      return Promise.resolve(boundFileLoader(source))
    } else {
      // Actually execute the recursive thing and call the callback if necessary.
      return recurseThroughFile(typeof source === 'string' ? source : source.toString()).then(function(raw) {
        const data = Buffer.from(raw, 'binary')
        if (options.emit) {
          return boundFileLoader(data)
        } else {
          return data
        }
      }.bind(this))
    }
  }.bind(this)

  // Emit the final file: I'm not going to chain this with the file-loader.
  getPromise().then(function(data) {callback(null, data)})
    .catch(function(err) {callback(err)})
}

module.exports = textReplaceFileLoader
module.exports.raw = true
