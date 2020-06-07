#!/bin/bash
#
# Copyright 2018-2020 IBM Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Determine the directory from which to start the chmod operation
data_dir=`jupyter --data-dir`
metadata_dir=${data_dir}"/metadata"

# For each item (including directories) remove its permissions for groups
# and others, leaving only the user (owner) permissions in place.
echo "Changing permissions on metadata files under ${metadata_dir}..."
find ${metadata_dir} -print -exec chmod go-rwx {} \;

exit 0
