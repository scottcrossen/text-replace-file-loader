[![npm][npm]][npm-url]
[![Bower][bow]][bow-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![License][lic]][lic-url]

<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>Text Replace File Loader</h1>
  <p>A loader for webpack that imports all files in a given document, replacing the 'require' statements with their
  public path.</p>
</div>

<h2 align="center">Install</h2>

```bash
npm install --save-dev text-replace-file-loader
```

<h2 align="center">Usage</h2>

Use the loader either via your webpack config, CLI or inline.

### Webpack Config (recommended)

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.json$/,
        use: ['json-loader', 'text-replace-file-loader?name=[name].[ext]']
      }
    ]
  }
}
```

<h2 align="center">Example</h2>

### Example

**webpack.config.js**
```js
module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'something.js',
    publicPath: '/',
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        // This will output both the json and all files the json requires on.
        use: ['file-loader?name=[name].[ext]', 'text-replace-file-loader?name=[name].[ext]']
      }
    ]
  }
}
```

**In your application**
```js
const myJson = require('./file.json'); // Can handle any type of file though.
```

**Your Json: file.json**
```json
{
  "key1": {
    "key2": {
      "key3": "require('assets/images/image1.png')"
    },
    "key4": "require('assets/index.json')"
  }
}
```

### Output

**Directory listing**
```bash
something.js
image1.png
index.json
file.json
```

**Output Json: dist/file.json**
```json
{
  "key1": {
    "key2": {
      "key3": "/image1.png"
    },
    "key4": "/index.json"
  }
}
```
Note: If publicPath were 'myurl' then it would be 'myurl/image1.png' rather than '/image1.png'

<h2 align="center">Options & Config</h2>

This module has two different options:
- **recursion**: This sets the behavior when ```require('.*')``` statements are encountered. It can be one of three values. The default is *'emit'*.
  - **'embed'**: This embeds imports into
the file inline.
  - **'emit'**: This creates a file in the bundle and
replaces the import statement with the public path.
  - **'none'**: This replaces the import statement with
the best-guess at the module-name.
- **emit**: This determines whether the final document is emitted to the bundle or not.
Takes on boolean *true* or *false*. The default is *true*.

Note that for file-emitting operations, this module clones its context and passes it on to ```file-loader```. Because of this, please reference ```file-loader```'s
[main page](https://github.com/webpack-contrib/file-loader) for information on
options and config for emitting files. You can pass these options to this loader when emitting files.

<h2 align="center">Contributors</h2>

### Scott Leland Crossen  
<http://scottcrossen.com>  
<scottcrossen42@gmail.com>

<h2 align="center">Special Thanks</h2>

Brady Parks, Sydney MacFarlane, John Hancock, Doug Patterson, Megan Parks, Madison Russell

[npm]: https://img.shields.io/npm/v/text-replace-file-loader.svg
[npm-url]: https://npmjs.com/package/text-replace-file-loader

[node]: https://img.shields.io/node/v/text-replace-file-loader.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack/text-replace-file-loader.svg
[deps-url]: https://david-dm.org/webpack/text-replace-file-loader

[bow]: http://img.shields.io/bower/v/text-replace-file-loader.svg
[bow-url]: http://bower.io/

[lic]: https://img.shields.io/npm/l/text-replace-file-loader.svg
[lic-url]: LICENSE
