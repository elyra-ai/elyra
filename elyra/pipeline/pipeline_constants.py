#
# Copyright 2018-2025 Elyra Authors
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

PIPELINE_DEFAULTS = "pipeline_defaults"
PIPELINE_PARAMETERS = "pipeline_parameters"
RUNTIME_IMAGE = "runtime_image"
ENV_VARIABLES = "env_vars"
MOUNTED_VOLUMES = "mounted_volumes"
KUBERNETES_SECRETS = "kubernetes_secrets"
KUBERNETES_TOLERATIONS = "kubernetes_tolerations"
KUBERNETES_POD_ANNOTATIONS = "kubernetes_pod_annotations"
KUBERNETES_POD_LABELS = "kubernetes_pod_labels"
DISABLE_NODE_CACHING = "disable_node_caching"
KUBERNETES_SHARED_MEM_SIZE = "kubernetes_shared_mem_size"
COS_OBJECT_PREFIX = "cos_object_prefix"  # optional static prefix to be used when generating object name for cos storage
