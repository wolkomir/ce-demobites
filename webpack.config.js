const path = require('path');
const webpack = require('webpack');
// const git = require("git-rev-sync");
const FilemanagerPlugin = require('filemanager-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ExtensionReloader = require('./webExtReloader/webpack-ext-reloader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WextManifestWebpackPlugin = require('wext-manifest-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const ReactDevtoolsScriptHTMLPlugin = require('./react-devtools-script-html-plugin');

const viewsPath = path.join(__dirname, 'views');
const sourcePath = path.join(__dirname, 'source');
const destPath = path.join(__dirname, 'extension');
const nodeEnv = process.env.NODE_ENV || 'development';
const targetBrowser = process.env.TARGET_BROWSER;

const isDev = nodeEnv === 'development';

const extensionReloaderPlugin = isDev
  ? new ExtensionReloader({
      port: 9090,
      reloadPage: true,
      entries: {
        // TODO: reload manifest on update
        contentScript: 'contentScript',
        background: 'background',
        extensionPage: ['popup'],
      },
    })
  : () => {
      this.apply = () => {};
    };

const getExtensionFileType = (browser) => {
  if (browser === 'opera') {
    return 'crx';
  }

  if (browser === 'firefox') {
    return 'xpi';
  }

  return 'zip';
};

module.exports = {
  devtool: isDev ? 'cheap-module-source-map' : false,

  stats: {
    all: false,
    builtAt: true,
    errors: true,
    hash: true,
  },

  mode: nodeEnv,

  entry: {
    manifest: path.join(sourcePath, 'manifest.json'),
    background: path.join(sourcePath, 'Background', 'index.ts'),
    contentScript: path.join(sourcePath, 'ContentScript', 'index.tsx'),
    popup: path.join(sourcePath, 'Popup', 'index.tsx')
  },

  output: {
    path: path.join(destPath, targetBrowser),
    filename: 'js/[name].bundle.js',
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'webextension-polyfill': path.resolve(
        path.join(__dirname, 'node_modules', 'webextension-polyfill')
      ),
    },
  },

  module: {
    rules: [
      {
        type: 'javascript/auto', // prevent webpack handling json with its own loaders,
        test: /manifest\.json$/,
        use: {
          loader: 'wext-manifest-loader',
          options: {
            usePackageJSONVersion: true, // set to false to not use package.json version for manifest
          },
        },
        exclude: /node_modules/,
      },
      {test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/},
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        // type: 'asset/resource',
        loader: 'file-loader',
      },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader, // It creates a CSS file per JS file which contains CSS
          },
          {
            loader: 'css-loader', // Takes the CSS files and returns the CSS with imports and url(...) for Webpack
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  [
                    'autoprefixer',
                    {
                      // Options
                    },
                  ],
                ],
              },
            },
          },
          'resolve-url-loader', // Rewrites relative paths in url() statements
          'sass-loader', // Takes the Sass/SCSS file and compiles to the CSS
        ],
      },
    ],
  },

  plugins: [
    // Plugin to not generate js bundle for manifest entry
    new WextManifestWebpackPlugin(),
    new webpack.ProvidePlugin({
      React: 'react', // automatically import react where needed
    }),
    // Generate sourcemaps
    new webpack.SourceMapDevToolPlugin({filename: false}),
    // environmental variables
    new webpack.EnvironmentPlugin({
      NODE_ENV: nodeEnv,
      TARGET_BROWSER: process.env.TARGET_BROWSER || '',
    }),
    // delete previous build files
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        path.join(process.cwd(), `extension/${targetBrowser}`),
        path.join(
          process.cwd(),
          `extension/${targetBrowser}.${getExtensionFileType(targetBrowser)}`
        ),
      ],
      cleanStaleWebpackAssets: false,
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, 'popup.html'),
      inject: 'body',
      chunks: ['popup'],
      hash: true,
      filename: 'popup.html',
    }),
    // write css file(s) to build folder
    new MiniCssExtractPlugin({filename: 'css/[name].css'}),
    // copy static assets
    new CopyWebpackPlugin({
      patterns: [{from: 'source/assets', to: 'assets'}],
    }),
    // new ReactDevtoolsScriptHTMLPlugin(),
    // plugin to enable browser reloading in development mode
    extensionReloaderPlugin,
    new Dotenv({path: `./.env.${nodeEnv}`}),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: ['default', {discardComments: {removeAll: true}}],
        },
      }),
      new FilemanagerPlugin({
        events: {
          onEnd: {
            archive: [
              {
                format: 'zip',
                source: path.join(destPath, targetBrowser),
                destination: `${path.join(
                  destPath,
                  targetBrowser
                )}.${getExtensionFileType(targetBrowser)}`,
                options: {zlib: {level: 6}},
              },
            ],
          },
        },
      }),
    ],
  },
};
