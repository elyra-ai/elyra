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

# R Script with Environment Variables

# This R script contains various environment variables to test the parser
# functionality.

Sys.setenv(VAR1 = "value1")
Sys.getenv(VAR2)

Sys.getenv("VAR3")
Sys.setenv("VAR4" = "value4")

Sys.getenv('VAR5')
Sys.setenv('VAR6' = 6)  # Sys.getenv('VAR7')

# Sys.getenv('VAR8')
