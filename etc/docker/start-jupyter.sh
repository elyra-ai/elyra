#!/bin/bash

CMD=${1:-"notebook"}
if [[ "${CMD}" == "lab" ]];
then
	jupyter serverextension enable --py jupyterlab --sys-prefix
elif [[ "${CMD}" != "notebook" ]];
then
	echo ""
	echo "usage: <docker run arguments> [notebook | lab]"
	echo "Entering shell..."
	/bin/bash
	exit 0
fi

enterprise_scheduler &

jupyter ${CMD} \
  --log-level=DEBUG \
  --NotebookApp.port=8888 \
  --NotebookApp.ip=0.0.0.0
