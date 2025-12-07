#!/bin/bash

echo $1

TDM_ROOT=$1

# rebuild `node_expat` for `xml2json`,
# ${TSDM_ROOT}/node_modules/.bin/electron-rebuild

# html for desktop mode
cp ${TDM_ROOT}/src/mainProcess/windows/MainWindow/MainWindow.html ${TDM_ROOT}/dist/mainProcess/windows/MainWindow/
cp ${TDM_ROOT}/src/mainProcess/windows/DisplayWindow/DisplayWindow.html ${TDM_ROOT}/dist/mainProcess/windows/DisplayWindow/
cp ${TDM_ROOT}/src/mainProcess/windows/HelpWindow/HelpWindow.html ${TDM_ROOT}/dist/mainProcess/windows/HelpWindow/

# html for web mode
cp ${TDM_ROOT}/src/mainProcess/windows/MainWindow/MainWindow-web.html ${TDM_ROOT}/dist/webpack/MainWindow.html
cp ${TDM_ROOT}/src/mainProcess/windows/DisplayWindow/DisplayWindow-web.html ${TDM_ROOT}/dist/webpack/DisplayWindow.html
cp ${TDM_ROOT}/src/mainProcess/windows/HelpWindow/HelpWindow-web.html ${TDM_ROOT}/dist/webpack/HelpWindow.html


# resources: images, css, js
cp -a ${TDM_ROOT}/src/common/resources ${TDM_ROOT}/dist/common/
ln -s ${TDM_ROOT}/dist/common/resources ${TDM_ROOT}/dist/webpack/
# for desktop mode katex
ln -s ${TDM_ROOT}/dist/common/resources/css/fonts ${TDM_ROOT}/dist/mainProcess/windows/DisplayWindow/fonts

# others
cp -a ${TDM_ROOT}/src/mainProcess/mainProcess/*.py ${TDM_ROOT}/dist/mainProcess/mainProcess/
cp -a ${TDM_ROOT}/src/test/tdmDemo ${TDM_ROOT}/dist/test

# inject build date to package.json, which could be loaded by GlobalMethods.generateAboutInfo()
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i -E "s/\"buildDate\": \".*\"/\"buildDate\": \"$DATE\"/" ${TDM_ROOT}/package.json
