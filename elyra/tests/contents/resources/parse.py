#
# Copyright 2018-2023 Elyra Authors
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
"""
Python Script with Environment Variables

This python script contains various environment variables to test the parser
functionality.
"""

import os

os.getenv("VAR1")
os.environ["VAR2"]
os.environ.get("VAR3")

print(os.environ["VAR4"])
print(os.getenv("VAR5", "localhost"))

os.environ["VAR6"] = "value6"
print(os.environ.get("VAR7", "value7"))
os.getenv("VAR8")

os.environ["VAR1"] = "newvalue"  # os.environ["VAR9"] = "value"

# os.getenv('VAR10')
