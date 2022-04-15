
import base64
import logging
from typing import Dict

import pandas as pd
from elyra.kfp.monitoring.sinks.pipeline_log_sink import PipelineLogSink
from elyra.kfp.monitoring.sinks.sink_types import SinkType

from google.oauth2 import service_account
from kubernetes import client, config

logger = logging.getLogger('elyra')

@PipelineLogSink.register
class BigQuerySink(PipelineLogSink):
    def __init__(self):
        super().__init__(sink_type=SinkType.BIGQUERY)

    def authenticate_to_sink(self) -> None:
        config.load_incluster_config()
        v1 = client.CoreV1Api()

        dict_creds = v1.read_namespaced_secret("monitoring-kfp-google-sa", "kubeflow").data
        decoded_sec = base64.decodebytes(dict_creds['key.json'].encode('ascii'))
        decoded_sec = decoded_sec.decode('ascii')
        
        self._credentials = service_account.Credentials.from_service_account_info(decoded_sec)
        logger.info("Authenticated to BigQuery")

    def write_log(self, status: Dict[str, str]) -> None:
        logger.debug("Writing log to BigQuery")

        if(self._credentials is None):
            logger.error("Credentials not found")
            return

        df_status = pd.DataFrame(status)

        date_format = "%d/%m/%y %H:%M:%S"
        schema = [ 
            {"name":"squad", "type": "STRING"},
            {"name":"pipeline_name", "type": "STRING"},
            {"name":"pipeline_id", "type": "STRING"},
            {"name":"step_name", "type": "STRING"},
            {"name":"status", "type": "STRING"},
            {"name":"start_time", "type": "DATETIME"},
            {"name":"end_time", "type": "DATETIME"},
            {"name":"duration", "type": "FLOAT"}
        ]

        df_status['squad'] = df_status['squad'].astype(str)
        df_status['start_time'] = pd.to_datetime(df_status['start_time'], format=date_format)
        df_status['end_time'] = pd.to_datetime(df_status['end_time'], format=date_format)

        pandas_gbq.to_gbq(df_status,
                            'elyra-monitoring.kfp_monitoring_logs',
                            table_schema=schema,
                            if_exists='append',
                            credentials=self._credentials)
        logger.debug("Log sent to BigQuery")
        