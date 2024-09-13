const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		fallback: {
			"https": require.resolve("https-browserify"),
			"http": require.resolve("stream-http"),
			"url": require.resolve("url/"),
			"stream": require.resolve("stream-browserify"),
			"buffer": require.resolve("buffer/"),
			"crypto": require.resolve("crypto-browserify"),
			"path": require.resolve('path-browserify'),
			"vm": require.resolve("vm-browserify"),
		}
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		libraryTarget: 'commonjs2',
	},
	mode: 'development',
	plugins: [
		new Dotenv()
	]
};
