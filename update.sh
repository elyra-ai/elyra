#!/usr/bin/env bash

pip install --upgrade -e .
jupyter serverextension enable --py enterprise_scheduler_extension --sys-prefix
jupyter nbextension install --py enterprise_scheduler_extension --sys-prefix
jupyter nbextension enable --py enterprise_scheduler_extension --sys-prefix
