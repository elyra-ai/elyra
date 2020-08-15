#!/bin/bash

# Assumptions are existing kubeflow installation is in the kubeflow namespace
DEFAULT_RUNTIME_FILE=$(jupyter --data-dir)/metadata/runtimes/my_kfp.json
export COS_BUCKET=${COS_BUCKET:-test}

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
