#!/bin/sh

# Path to the CSS file in the container
THEME_CSS_PATH="/app/node_modules/primeng/resources/themes/lara-light-blue/theme.css"

# Modify the CSS file
sed -i 's/#3B82F6/#1f3870/g' $THEME_CSS_PATH
