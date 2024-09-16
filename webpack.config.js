/**
 * The webpack bundling is necessary for client side code. It significantly improves the
 * module loading time, roughly reduce from 500 ms to 120 ms.
 *
 * In webpack, the .ts files are bundled to .js files with ESM module system. In
 * this way, the resulted webpack/DisplayWindowClient.js and webpack/MainWindowClient.js
 * can be directly loaded in both web browser and electron.js (yes, electron.js can natively
 * load ESM module).
 *
 * The electron.js can load CommonJS module if its nodeIntegration
 * option is enabled. The TypeScript must transpile the .ts to .js with CommonJS module system
 * because the main process can be correctly executed in node.js enviroment.
 * In this way, we can use the un-bundled DisplayWindowClient.js
 * and MainWindowClient.js in electron.js BrowserWindow. The downside is the EmbeddedDisplay
 * cannot be shown as it is considered to be running inside a web browser.
 *
 */

const path = require("path");
const webpack = require("webpack");
// const BundleAnalyzerPlugin =
//   require("webpack-bundle-analyzer").BundleAnalyzerPlugin

module.exports = {
	//HH ------------ html -----------------
	//HH html-webpack-plugin, convert src/index.html --> dist/index.html
	//HH  - src/index.html does not need to contain any <script />
	//HH  - dist/index.html contains the webpack generated main.js file
	plugins: [
		new webpack.ProvidePlugin({
			process: "process/browser",
		}),
		new webpack.HotModuleReplacementPlugin(),
        // new BundleAnalyzerPlugin()
	],
	//HH ------------ javascript -----------------
	//HH the webpack inject this file's transpilation to generated html file: dist/index.html
	//HH "src/index.tsx"'s transpilation file is an intermediate file, everything eventually goes
	//HH to "dist/main.js", which is loaded by `dist/index.html`

	entry: {
		DisplayWindowClient: "./src/mainProcess/windows/DisplayWindow/DisplayWindowClient.tsx",
		MainWindowClient: "./src/mainProcess/windows/MainWindow/MainWindowClient.tsx",
	},

	output: {
		path: path.resolve(__dirname, "dist/webpack"),
        // otherwise comes with a blank window
        publicPath: "",
	},

	// entry: './src/mainProcess/windows/DisplayWindow/DisplayWindowClient.tsx',
	// output: {
	//   filename: 'DisplayWindowClient.js',
	//   path: path.resolve(__dirname, 'dist/webpack'),
	//   // Set the target to 'web' to enable ES6 modules
	// //   environment: {
	// //     module: 'web',
	// //   },
	// },

	//HH --------------- typescript --------------
	//HH If we want to use typescript, we must install "ts-loader" and set below
	// target: ['web', 'es5'],

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: {
							transpileOnly: true,
						},
					},
				],
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
		fallback: {
			// fs: require.resolve("browserify-fs"),
			// os: require.resolve("os-browserify/browser"),
			path: require.resolve("path-browserify"),
            fs: false,
            os: false,
            // path: false,
			//! the only place that uses child_process on client side is the ActionButton "execute command" choice
			child_process: false,
		},
	},

	//HH -------------- npm run dev --------------
	//HH "webpack-dev-server" is an http server. It can be used for development,
	//HH very convenient: automatic udpate ...
	devServer: {
		// open: true,
        // hot update bundle file 
        hot: true,
        devMiddleware: {
            writeToDisk: true,
         },    
      
	},
};
