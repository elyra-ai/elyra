from typing import Dict, Optional

import datetime


class LogRecord:

  def __init__(self, pipeline_name: str, pipeline_id: str, 
      step_name: str, status: str, start_time_epoch: float, 
      end_time_epoch: float, duration: float, extra_data: Optional[Dict[str, str]] = None):
      
    self.pipeline_name = [pipeline_name]
    self.pipeline_id = [pipeline_id]
    self.step_name = [step_name]
    self.status = [status]
    self.start_time = datetime.datetime.fromtimestamp(start_time_epoch).strftime("%m/%d/%Y %H:%M:%S")
    self.end_time = datetime.datetime.fromtimestamp(end_time_epoch).strftime("%m/%d/%Y %H:%M:%S")
    self.duration = duration
    self.extra_data = extra_data

  def __str__(self):
    return "pipeline_name: {}, pipeline_id: {}, step_name: {}, status: {}," +\
     "start_time: {}, end_time: {}, duration: {}, extra_data: {}".format(
      self.pipeline_name, self.pipeline_id, self.step_name, self.status, 
      self.start_time, self.end_time, self.duration, self.extra_data)

  def to_dict(self):
    d = {
      "pipeline_name": self.pipeline_name,
      "pipeline_id": self.pipeline_id,
      "step_name": self.step_name,
      "status": self.status,
      "start_time": self.start_time,
      "end_time": self.end_time,
      "duration": self.duration
    }
    for k, v in self.extra_data.items():
      d[k] = v
    return d