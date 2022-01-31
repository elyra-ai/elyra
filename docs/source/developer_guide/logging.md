<!--
{% comment %}
Copyright 2018-2022 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
{% endcomment %}
-->
## Logging

This section will go over how to properly log messages in Elyra

### Pipelines Extension Logging

#### Python 
The Kubeflow Pipelines extension uses a custom IPython handler to handle interactions with 
the Notebook server instance. By extending the IPython handler we are able to leverage Tornado logging 
since the Jupyter Notebook server uses Tornado as its web framework. <p>
 
###### Pipelines -> IPythonHandler -> Tornado.log -> lib/logging <p>

##### When to add log messages
Use INFO level for routines(functions), like when handling requests or state changes and DEBUG for troubleshooting and diagnostics.<p>
```
  def foo (arg):
    self.debug.info("doing something with this %s", arg)
    do something with arg
    self.log.info("Result of arg is ... %s", result)
```    
Use WARNING level when it is important, but not an error, for example, when a user attempts to login with an incorrect password<p>
```
  def authenticate(username, password):
    if username and password doesn't work:
        self.log.warn("Failed login attempt from %s : $s", username, password)
```     
Use ERROR level when something is actually wrong, like when an exception is thrown, IO operation failure or connectivity 
issue (e.g. Minio client cant connect to endpoint)<p>
``` 
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
    except ResponseError:
        self.log.error("Minio error", exc_info=True)
```
##### Adding log messages
Add log messages by inserting statements as follows:<p>
`self.log.debug("insert debug message", *args, *kwargs)`<p>
Use the appropriate logging levels when inserting specific messages e.g. log.debug, log.warn etc. <p>

The log output will be color coded, legend as follows:

| Log Level | Color | 
|-----------|-------|
| DEBUG     | Blue  | 
| INFO      | Green |
| WARNING   | Yellow |
| ERROR     | Red   |
| CRITICAL  | Magenta |

##### Setting the Log Level
The default Log Level is set to INFO. If you need to increase log verbosity, you can start Jupyterlab with 
the `--debug` option for example:  
```
    jupyter lab --debug <other options>
```
If too verbose, you can filter out only the most important messages by directly setting the value
with `--log-level=` using one of the following `{DEBUG|INFO|WARN|ERROR|CRITICAL}`.  For example:
```
    jupyter lab --log-level=WARN <other options>
```
indicates that only log levels of `WARN` (or higher: `ERROR` and `CRITICAL`) will be logged.

#### TypeScript / JS

Use console.log(), console.warn() to output debug messages


