const webpack = require('webpack');

module.exports = [];

module.exports.push({
	entry: './htdocs/js/dist/components/base/app.js',
	output: {
		path: __dirname + '/htdocs/js/dist/',
		filename: 'evqueue.js'
	},
	plugins: [
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		}),
	]
});
