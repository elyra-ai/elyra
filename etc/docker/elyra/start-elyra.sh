#!/bin/bash

export NB_PORT=${NB_PORT:-8888}
export GATEWAY_HOST=${GATEWAY_HOST:-localhost}
export KG_URL=${KG_URL:-http://${GATEWAY_HOST}:${NB_PORT}}
export KG_HTTP_USER=${KG_HTTP_USER:-jovyan}
export KG_REQUEST_TIMEOUT=${KG_REQUEST_TIMEOUT:-120}
export KERNEL_USERNAME=${KG_HTTP_USER}

echo "Gateway URL: " ${JUPYTER_GATEWAY_URL}
echo "JupyterLab port: " ${NB_PORT}
echo "Kernel user: " ${KERNEL_USERNAME}

echo "${@: -1}"


exec /usr/local/bin/start-singleuser.sh $*
