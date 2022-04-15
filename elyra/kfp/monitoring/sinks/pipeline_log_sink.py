
import abc

from elyra.kfp.monitoring.sinks.sink_types import SinkType

class PipelineLogSink(abc.ABC):

    def __init__(self, sink_type: SinkType):
      self.sink_type = sink_type
    
    @abc.abstractmethod
    def authenticate_to_sink(self):
        """
        Authenticate to the persistence layer that is used to store the monitoring logs.
        """
        pass

