#!/bin/bash

# Assumptions are existing kubeflow installation is in the kubeflow namespace
DEFAULT_RUNTIME_FILE=$(jupyter --data-dir)/metadata/runtimes/my_kfp.json

if  [[ ! -z "$JUPYTERHUB_USER_NAME" ]]; then
  # Use COS_BUCKET env variable set in spawner, if not set, use default
  export COS_BUCKET=${COS_BUCKET:-default}
else
  # Otherwise, use jupyterhub username and replace any special characters with a dash
  COS_BUCKET=$(python -c 'import sys;print(sys.argv[1].translate ({ord(c): "-" for c in "!@#$%^&*()[]{};:,./<>?\|`~=_+"}))' "$JUPYTERHUB_USER_NAME")
  export COS_BUCKET
fi

if [[ ! -f "$DEFAULT_RUNTIME_FILE" ]]; then
  elyra-metadata install runtimes --schema_name=kfp \
                                  --name=my_kfp \
                                  --display_name="Default Kubeflow Pipeline Runtime" \
                                  --api_endpoint=http://ml-pipeline-ui.kubeflow/pipeline \
                                  --cos_endpoint=http://minio-service.kubeflow:9000 \
                                  --cos_username="$AWS_ACCESS_KEY_ID" \
                                  --cos_password="$AWS_SECRET_ACCESS_KEY" \
                                  --cos_bucket="$COS_BUCKET"
fi
