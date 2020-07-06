var webpack = require("webpack");
const UglifyjsWebpackPlugin =require('uglifyjs-webpack-plugin');
var path = require("path");
console.log("log");

module.exports = {
    mode: 'production',
    entry: './test.js',
    output:{
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devServer:{
        contentBase:'./dist',
        inline:true,
        host: "0.0.0.0", 
        port:8081
      },
      plugins:[
        // new UglifyjsWebpackPlugin()
      ]
  };

