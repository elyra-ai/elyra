<!--
{% comment %}
This program is an unpublished work fully protected by the United States
copyright laws and is considered a trade secret belonging to Attala Systems Corporation.
To the extent that this work may be considered "published", the following notice applies
"(C) 2020, 2021, Attala Systems Corporation"

Any unauthorized use, reproduction, distribution, display, modification,
or disclosure of this program is strictly prohibited.

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

Instruction to build integra/elyra jupyter distributions
================================================================

Dependencies:
   - Get Miniconda for python3 (https://docs.conda.io/en/latest/miniconda.html)(https://repo.anaconda.com/miniconda/Miniconda3-py37_4.12.0-Linux-x86_64.sh)
   - Install using the command 
     	bash Miniconda3-latest-Linux-x86_64.sh (https://conda.io/projects/conda/en/latest/user-guide/install/linux.html)
      
Create conda venv:
   conda create -n <env-name> python==3.7.9

Install required packages inside conda venv:
   - Activate previous created conda venv
     	conda activate <env-name>
   - Install nodejs
   	conda install -y -c conda-forge/label/main nodejs
   - Install yarn 
     	conda install -y -c conda-forge/label/main yarn
   - git clone eleoai/elyra
     	git clone https://github.com/elevo-ai/elyra
        cd elyra
   - run create_integra_release.py python script to get the integra distribution files
     	python create_integra_release.py prepare --version 3.11.0.dev0
     
