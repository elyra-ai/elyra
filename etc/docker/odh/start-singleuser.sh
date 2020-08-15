#!/bin/bash


set -x

JUPYTER_PROGRAM_ARGS="$JUPYTER_PROGRAM_ARGS $NOTEBOOK_ARGS"

if [ x"$JUPYTER_MASTER_FILES" != x"" ]; then
    if [ x"$JUPYTER_WORKSPACE_NAME" != x"" ]; then
        JUPYTER_WORKSPACE_PATH=/opt/app-root/src/$JUPYTER_WORKSPACE_NAME
        setup-volume.sh $JUPYTER_MASTER_FILES $JUPYTER_WORKSPACE_PATH
    fi
fi

JUPYTER_PROGRAM_ARGS="$JUPYTER_PROGRAM_ARGS --NotebookApp.default_url=/lab"

if [ x"$JUPYTER_WORKSPACE_NAME" != x"" ]; then
    JUPYTER_PROGRAM_ARGS="$JUPYTER_PROGRAM_ARGS --NotebookApp.default_url=/lab/$JUPYTER_WORKSPACE_NAME"
fi

if [[ "$JUPYTER_PROGRAM_ARGS $@" != *"--ip="* ]]; then
    JUPYTER_PROGRAM_ARGS="--ip=0.0.0.0 $JUPYTER_PROGRAM_ARGS"
fi

if [ -n "${JUPYTER_PRELOAD_REPOS}" ]; then
    for repo in `echo ${JUPYTER_PRELOAD_REPOS} | tr ',' ' '`; do
        echo "Checking if repository $repo exists locally"
        REPO_DIR=$(basename ${repo})
        if [ -d "${REPO_DIR}" ]; then
            pushd ${REPO_DIR}
            GIT_SSL_NO_VERIFY=true git pull --ff-only
            popd
        else
            GIT_SSL_NO_VERIFY=true git clone ${repo} ${REPO_DIR}
        fi
    done
fi

set -eo pipefail

if [[ "$NOTEBOOK_ARGS $@" != *"--ip="* ]]; then
  NOTEBOOK_ARGS="--ip=0.0.0.0 $NOTEBOOK_ARGS"
fi

JUPYTER_PROGRAM_ARGS="$JUPYTER_PROGRAM_ARGS --config=/opt/app-root/etc/jupyter_notebook_config.py"

JUPYTER_PROGRAM="jupyterhub-singleuser"

/opt/app-root/bin/setup-elyra-metadata.sh

exec /opt/app-root/bin/start.sh $JUPYTER_PROGRAM $JUPYTER_PROGRAM_ARGS "$@"
