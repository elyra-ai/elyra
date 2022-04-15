from elyra.kfp.monitoring.sinks.bigquery.bigquery_sink import BigQuerySink
from elyra.kfp.monitoring.sinks.sink_types import SinkType
from elyra.kfp.monitoring.sinks.pipeline_log_sink import PipelineLogSink

class PipelineLogSinkFactory:
  
    def __init__(self):
      pass
  
    def create_sink(self, sink_type: SinkType) -> PipelineLogSink:
      """
      Create a PipelineMonitor object based on the sink_type.
      """
      if sink_type == SinkType.BIGQUERY:
        return BigQuerySink()
      else:
        raise Exception('Unknown sink type: ' + sink_type)