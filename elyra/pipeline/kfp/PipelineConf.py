from typing import Union
from kubernetes.client.models import V1PodDNSConfig

class PipelineConf():
    """PipelineConf contains pipeline level settings."""

    def __init__(self):
        self.image_pull_secrets = []
        self.timeout = 0
        self.ttl_seconds_after_finished = -1
        self._pod_disruption_budget_min_available = None
        self.op_transformers = []
        self.default_pod_node_selector = {}
        self.image_pull_policy = None
        self.parallelism = None
        self._data_passing_method = None
        self.dns_config = None

    def set_image_pull_secrets(self, image_pull_secrets):
        """Configures the pipeline level imagepullsecret.

        Args:
          image_pull_secrets: a list of Kubernetes V1LocalObjectReference For
            detailed description, check Kubernetes V1LocalObjectReference definition
            https://github.com/kubernetes-client/python/blob/master/kubernetes/docs/V1LocalObjectReference.md
        """
        self.image_pull_secrets = image_pull_secrets
        return self

    def set_timeout(self, seconds: int):
        """Configures the pipeline level timeout.

        Args:
          seconds: number of seconds for timeout
        """
        self.timeout = seconds
        return self

    def set_parallelism(self, max_num_pods: int):
        """Configures the max number of total parallel pods that can execute at
        the same time in a workflow.

        Args:
          max_num_pods: max number of total parallel pods.
        """
        if max_num_pods < 1:
            raise ValueError(
                'Pipeline max_num_pods set to < 1, allowed values are > 0')

        self.parallelism = max_num_pods
        return self

    def set_ttl_seconds_after_finished(self, seconds: int):
        """Configures the ttl after the pipeline has finished.

        Args:
          seconds: number of seconds for the workflow to be garbage collected after
            it is finished.
        """
        self.ttl_seconds_after_finished = seconds
        return self

    def set_pod_disruption_budget(self, min_available: Union[int, str]):
        """PodDisruptionBudget holds the number of concurrent disruptions that
        you allow for pipeline Pods.

        Args:
          min_available (Union[int, str]):  An eviction is allowed if at least
            "minAvailable" pods selected by "selector" will still be available after
            the eviction, i.e. even in the absence of the evicted pod.  So for
            example you can prevent all voluntary evictions by specifying "100%".
            "minAvailable" can be either an absolute number or a percentage.
        """
        self._pod_disruption_budget_min_available = min_available
        return self

    def set_default_pod_node_selector(self, label_name: str, value: str):
        """Add a constraint for nodeSelector for a pipeline.

        Each constraint is a key-value pair label.

        For the container to be eligible to run on a node, the node must have each
        of the constraints appeared as labels.

        Args:
          label_name: The name of the constraint label.
          value: The value of the constraint label.
        """
        self.default_pod_node_selector[label_name] = value
        return self

    def set_image_pull_policy(self, policy: str):
        """Configures the default image pull policy.

        Args:
          policy: the pull policy, has to be one of: Always, Never, IfNotPresent.
            For more info:
            https://github.com/kubernetes-client/python/blob/10a7f95435c0b94a6d949ba98375f8cc85a70e5a/kubernetes/docs/V1Container.md
        """
        self.image_pull_policy = policy
        return self

    def add_op_transformer(self, transformer):
        """Configures the op_transformers which will be applied to all ops in
        the pipeline. The ops can be ResourceOp, VolumeOp, or ContainerOp.

        Args:
          transformer: A function that takes a kfp Op as input and returns a kfp Op
        """
        self.op_transformers.append(transformer)

    def set_dns_config(self, dns_config: V1PodDNSConfig):
        """Set the dnsConfig to be given to each pod.

        Args:
          dns_config: Kubernetes V1PodDNSConfig For detailed description, check
            Kubernetes V1PodDNSConfig definition
            https://github.com/kubernetes-client/python/blob/master/kubernetes/docs/V1PodDNSConfig.md

        Example:
          ::

            import kfp
            from kubernetes.client.models import V1PodDNSConfig, V1PodDNSConfigOption
            pipeline_conf = kfp.dsl.PipelineConf()
            pipeline_conf.set_dns_config(dns_config=V1PodDNSConfig(
                nameservers=["1.2.3.4"],
                options=[V1PodDNSConfigOption(name="ndots", value="2")],
            ))
        """
        self.dns_config = dns_config

    @property
    def data_passing_method(self):
        return self._data_passing_method

    @data_passing_method.setter
    def data_passing_method(self, value):
        """Sets the object representing the method used for intermediate data
        passing.

        Example:
          ::

            from kfp.dsl import PipelineConf, data_passing_methods
            from kubernetes.client.models import V1Volume, V1PersistentVolumeClaimVolumeSource
            pipeline_conf = PipelineConf()
            pipeline_conf.data_passing_method =
            data_passing_methods.KubernetesVolume(
                volume=V1Volume(
                    name='data',
                    persistent_volume_claim=V1PersistentVolumeClaimVolumeSource('data-volume'),
                ),
                path_prefix='artifact_data/',
            )
        """
        self._data_passing_method = value