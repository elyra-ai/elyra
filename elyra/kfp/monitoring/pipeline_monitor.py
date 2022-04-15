import logging
from elyra.kfp.monitoring.log_record import LogRecord
from elyra.kfp.monitoring.sinks.factory import PipelineLogSinkFactory
from elyra.kfp.monitoring.sinks.sink_types import SinkType

logger = logging.getLogger('elyra')

class PipelineMonitor:

  def __init__(self, sink_type: SinkType):
    """
    Create a PipelineMonitor object based on the sink_type.

    args:
      - sink_type: The type of sink to use.
    """
    self.sink = PipelineLogSinkFactory.create_sink(sink_type)
    self.sink.authenticate_to_sink()

  def send_monitoring_log(self, log_record: LogRecord):
    """
    Send a monitoring log to the persistence layer.
    """
    try:
      self.sink.send_monitoring_log(log_record)
    except Exception as e:
      logger.warn(f"Failed to send monitoring log to sink: {str(e)}")



