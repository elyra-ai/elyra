#!/bin/bash

# Determine the directory from which to start the chmod operation
data_dir=`jupyter --data-dir`
metadata_dir=${data_dir}"/metadata"

# For each item (including directories) remove its permissions for groups
# and others, leaving only the user (owner) permissions in place.
echo "Changing permissions on metadata files under ${metadata_dir}..."
find ${metadata_dir} -print -exec chmod go-rwx {} \;

exit 0
