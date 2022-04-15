
import enum

class SinkType(enum.Enum):
  """
  Enum for the different types of sinks that can be used to store the monitoring logs.
  """
  BIGQUERY = "bigquery"
  # TODO: Add more sink types here.