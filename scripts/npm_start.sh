#!/bin/bash

echo $1

TDM_ROOT=$1

# rebuild `node_expat` for `xml2json`,
# ${TSDM_ROOT}/node_modules/.bin/electron-rebuild

cp ${TDM_ROOT}/src/mainProcess/windows/MainWindow/MainWindow.html ${TDM_ROOT}/dist/mainProcess/windows/MainWindow/
cp ${TDM_ROOT}/src/mainProcess/windows/DisplayWindow/DisplayWindow.html ${TDM_ROOT}/dist/mainProcess/windows/DisplayWindow/
cp ${TDM_ROOT}/src/mainProcess/windows/HelpWindow/HelpWindow.html ${TDM_ROOT}/dist/mainProcess/windows/HelpWindow/

cp ${TDM_ROOT}/src/mainProcess/windows/MainWindow/MainWindow-web.html ${TDM_ROOT}/dist/webpack/MainWindow.html
cp ${TDM_ROOT}/src/mainProcess/windows/DisplayWindow/DisplayWindow-web.html ${TDM_ROOT}/dist/webpack/DisplayWindow.html
cp ${TDM_ROOT}/src/mainProcess/windows/HelpWindow/HelpWindow-web.html ${TDM_ROOT}/dist/webpack/HelpWindow.html

cp -a ${TDM_ROOT}/src/mainProcess/resources/css/fonts ${TDM_ROOT}/dist/mainProcess/windows/DisplayWindow/

cp -a ${TDM_ROOT}/src/mainProcess/resources ${TDM_ROOT}/dist/mainProcess/

cp -a ${TDM_ROOT}/src/mainProcess/mainProcess/*.py ${TDM_ROOT}/dist/mainProcess/mainProcess/
cp -a ${TDM_ROOT}/src/test/tdmDemo ${TDM_ROOT}/dist/test
ln -s ${TDM_ROOT}/dist/mainProcess/resources ${TDM_ROOT}/dist/webpack/

# inject build date to package.json, which could be loaded by GlobalMethods.generateAboutInfo()
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i -E "s/\"buildDate\": \".*\"/\"buildDate\": \"$DATE\"/" ${TDM_ROOT}/package.json
