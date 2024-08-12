const HtmlWebPackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const printCompilationMessage = require("./compilation.config.js");
const deps = require("./package.json").dependencies;
const webpack = require("webpack");

module.exports = (_, argv) => {
  const isProduction =
    argv.mode === "production" || process.env.NODE_ENV === "production";

  const publicPath = isProduction
    ? "https://k8s-ist.homecredit.id/" // URL produksi
    : "http://localhost:3000/"; // URL lokal

  console.log(".env", process.env);
  console.log("argv", argv);

  return {
    output: {
      publicPath: publicPath,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    devServer: {
      port: 3000,
      historyApiFallback: true,
      watchFiles: [path.resolve(__dirname, "src")],
      onListening: function (devServer) {
        const port = devServer.server.address().port;
        printCompilationMessage("compiling", port);
        devServer.compiler.hooks.done.tap("OutputMessagePlugin", (stats) => {
          setImmediate(() => {
            if (stats.hasErrors()) {
              printCompilationMessage("failure", port);
            } else {
              printCompilationMessage("success", port);
            }
          });
        });
      },
    },
    module: {
      rules: [
        {
          test: /\.m?js/,
          type: "javascript/auto",
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "images/", // Ensure outputPath is set correctly
              },
            },
          ],
        },
        {
          test: /\.(css|s[ac]ss)$/i,
          use: [
            "style-loader",
            "css-loader",
            "postcss-loader",
            {
              loader: "resolve-url-loader",
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "mf_ist_home",
        filename: "remoteEntry.js",
        remotes: {
          mf_ist_slik: `mf_ist_slik@${
            isProduction
              ? "https://k8s-ist.homecredit.id/mf_ist_slik/remoteEntry.js"
              : "http://localhost:3006/remoteEntry.js"
          }`,
          mf_ist_rtsd: `mf_ist_rtsd@${
            isProduction
              ? "https://k8s-ist.homecredit.id/mf_ist_rtsd/remoteEntry.js"
              : "http://localhost:3004/remoteEntry.js"
          }`,
          mf_ist_ums: `mf_ist_ums@${
            isProduction
              ? "https://k8s-ist.homecredit.id/mf_ist_ums/remoteEntry.js"
              : "http://localhost:3003/remoteEntry.js"
          }`,
        },
        exposes: {
          "./Home-ist": "./src/container/Home.tsx",
          "./Loader": "./src/components/Loader.tsx",
          "./AppProvider": "./src/providers/AppProvider",
          "./UseAppContext": "./src/providers/UseAppContext",
        },
        shared: {
          ...deps,
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          "react-dom": {
            singleton: true,
            requiredVersion: deps["react-dom"],
          },
          "react-router-dom": { singleton: true },
        },
      }),
      new HtmlWebPackPlugin({
        template: "./src/index.html",
      }),
      new Dotenv({
        path: `./.env`,
      }),
    ],
  };
};
