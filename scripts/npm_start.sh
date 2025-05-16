#!/bin/bash

echo $1

TDM_ROOT=$1

# rebuild `node_expat` for `xml2json`,
# ${TSDM_ROOT}/node_modules/.bin/electron-rebuild

cp ${TDM_ROOT}/src/mainProcess/windows/MainWindow/MainWindow.html ${TDM_ROOT}/dist/mainProcess/windows/MainWindow/
cp ${TDM_ROOT}/src/mainProcess/windows/DisplayWindow/DisplayWindow.html ${TDM_ROOT}/dist/mainProcess/windows/DisplayWindow/
cp ${TDM_ROOT}/src/mainProcess/windows/MainWindow/MainWindow-web.html ${TDM_ROOT}/dist/webpack/MainWindow.html
cp ${TDM_ROOT}/src/mainProcess/windows/DisplayWindow/DisplayWindow-web.html ${TDM_ROOT}/dist/webpack/DisplayWindow.html

cp -a ${TDM_ROOT}/src/mainProcess/resources/css/fonts ${TDM_ROOT}/dist/mainProcess/windows/DisplayWindow/

cp -a ${TDM_ROOT}/src/mainProcess/resources ${TDM_ROOT}/dist/mainProcess/

cp -a ${TDM_ROOT}/src/mainProcess/wsPv/*.py ${TDM_ROOT}/dist/mainProcess/wsPv/
cp -a ${TDM_ROOT}/src/test/tdmDemo ${TDM_ROOT}/dist/test
ln -s ${TDM_ROOT}/dist/mainProcess/resources ${TDM_ROOT}/dist/webpack/
