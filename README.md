__TDM__

**Warning**: this software is still in pre-pre-alpha version, do not use it in production!

## About

The TDM is a display manager for EPICS-based control system.

## How to compile and build

[Install](https://nodejs.org/en/download/package-manager) the latest version of [npm](https://www.npmjs.com/) and [node.js](https://nodejs.org).

Download the TDM source code:

```shell
git clone https://github.com/diverhao/tdm.git
```

Then run the following commands:

```shell
cd tdm
# transpile the TypeScript code to JavaScript
tsc
# bundle the discrete JavaScript files to one file, 
# you may terminate this command after it successfully bundles the project
npm run dev
# start the TDM
npm start
```

The configurations are in folder `$(HOME)/.tdm/`.

You can compile the software for various platforms:

```
npm run build-mac-arm64
npm run build-mac-x64
npm run build-linux
npm run build-windows
```

or do above operations at once:

```
npm run build-all
```

The result is in `out/` folder.