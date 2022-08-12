#
# Copyright 2018-2022 Elyra Authors
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
RUNTIME_IMAGE = "runtime_image"
ENV_VARIABLES = "env_vars"
MOUNTED_VOLUMES = "mounted_volumes"
KUBERNETES_SECRETS = "kubernetes_secrets"
KUBERNETES_TOLERATIONS = "kubernetes_tolerations"
KUBERNETES_POD_ANNOTATIONS = "kubernetes_pod_annotations"
PIPELINE_META_PROPERTIES = ["name", "description", "runtime"]
# optional static prefix to be used when generating an object name for object storage
COS_OBJECT_PREFIX = "cos_object_prefix"
ELYRA_COMPONENT_PROPERTIES = [MOUNTED_VOLUMES, KUBERNETES_TOLERATIONS, KUBERNETES_POD_ANNOTATIONS]
