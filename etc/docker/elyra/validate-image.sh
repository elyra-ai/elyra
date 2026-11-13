#!/usr/bin/env bash
#
# Copyright 2018-2026 Elyra Authors
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
# Validates that Elyra is installed in the image's system environment, so it
# survives a volume mounted over the user's home directory (as JupyterHub user
# storage does). See https://github.com/elyra-ai/elyra/issues/3453.
#
# This script runs *inside* the image. `make validate-elyra-image` pipes it in
# over stdin, once per mode:
#   built       the image as built, home directory untouched
#   empty-home  an empty volume mounted on $HOME

set -uo pipefail

mode="${1:-}"
failures=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; failures=$((failures + 1)); }

# Run a check command and report it under the given description.
check() {
    local description="$1"
    shift
    if "$@"; then pass "$description"; else fail "$description"; fi
}

# Print a jupyter listing without color codes (jupyter colors its output even
# when it isn't writing to a terminal). Captured before grepping, so that an
# early-exiting `grep -q` can't SIGPIPE the listing and fail the pipeline.
jupyter_listing() {
    local listing
    listing="$(jupyter "$@" 2>&1)"
    sed 's/\x1b\[[0-9;]*m//g' <<<"$listing"
}

elyra_in_system_prefix() {
    python3 -c 'import sys, elyra; sys.exit(not elyra.__file__.startswith(sys.prefix + "/"))'
}

elyra_labextension_enabled() {
    # "OK" means the extension is compatible with the JupyterLab that is running.
    jupyter_listing labextension list | grep -Eq '@elyra/pipeline-editor-extension .* enabled OK'
}

elyra_server_extension_enabled() {
    local listing
    listing="$(jupyter_listing server extension list)"
    # The validation line is "elyra <version> OK"; the version can be empty.
    grep -Eq '^ +elyra enabled$' <<<"$listing" && grep -Eq '^ +elyra( [^ ]*)? OK$' <<<"$listing"
}

no_user_site_packages() {
    [[ ! -e "$(python3 -m site --user-site)" ]]
}

no_root_owned_files_in_home() {
    [[ -z "$(find "$HOME" -user root -print -quit 2>/dev/null)" ]]
}

case "$mode" in
    built)
        echo "Validating image as built (HOME=$HOME)"
        check "no packages installed in the user site" no_user_site_packages
        check "no root-owned files in $HOME" no_root_owned_files_in_home
        ;;
    empty-home)
        echo "Validating image with an empty volume on HOME=$HOME"
        ;;
    *)
        echo "Usage: validate-image.sh built|empty-home" >&2
        exit 2
        ;;
esac

check "elyra is importable from the system prefix" elyra_in_system_prefix
check "@elyra lab extensions are enabled" elyra_labextension_enabled
check "elyra server extension is enabled" elyra_server_extension_enabled

if ((failures > 0)); then
    echo "$failures check(s) failed in '$mode' mode"
    exit 1
fi
echo "All checks passed in '$mode' mode"
