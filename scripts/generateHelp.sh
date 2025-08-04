#!/bin/bash

# assuming this script is run from the scripts directory
# and the help directory is at ../../misc-github/tdm/help
help_dir=../../misc-github/tdm/help

if [ -d "$help_dir" ]; then
    cp -av ../dist/webpack/HelpWindow.html "$help_dir"
    cp -av ../dist/webpack/HelpWindowClient.js "$help_dir"
    cp -av ../dist/webpack/resources/help/* "$help_dir/resources/help/"
    cp -av ../dist/webpack/resources/fonts/Inter "$help_dir/resources/fonts/"
    cp -av ../dist/webpack/resources/webpages/* "$help_dir/resources/webpages/"
    # for AI agent traning
    cp -av ../src/rendererProcess/helperWidgets/Help/* "$help_dir/doc_raw/"
    find "$help_dir/doc_raw" -type f -name "*.tsx" -exec bash -c 'mv "$0" "${0%.tsx}.txt"' {} \;
fi
