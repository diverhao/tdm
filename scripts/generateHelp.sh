#!/bin/bash

# assuming this script is run from the scripts directory
# and the help directory is at ../../misc-github/tdm/help
help_dir=../../misc-github/tdm/help

if [ -d "$help_dir" ]; then
    cp -av ../dist/webpack/HelpWindow.html "$help_dir"
    cp -av ../dist/webpack/HelpWindowClient.js "$help_dir"
    cp -av ../dist/webpack/resources/help/* "$help_dir/resources/help/"
    cp -av ../dist/webpack/resources/webpages/* "$help_dir/resources/webpages/"
fi
