import os
import json
import argparse


parser = argparse.ArgumentParser(description='Description of your program')
parser.add_argument('-f', '--file',
                    dest="pipeline_file",
                    help='The pipeline file to convert to new format',
                    required=True)
parser.add_argument('-o', '--overwrite',
                    dest="overwrite",
                    type=bool,
                    default=False,
                    help='Overwrite the existing file with the new name variables True or False',
                    required=False)
args = vars(parser.parse_args())

with open(args['pipeline_file'], "r") as file:
    json_data = json.load(file)
    for pipeline in json_data['pipelines']:
        if 'title' in pipeline['app_data']:
            pipeline['app_data']['name'] = pipeline['app_data'].pop('title')
        if 'export' in pipeline['app_data']:
            pipeline['app_data'].pop('export')
        for node in pipeline['nodes']:
            if 'ui_data' in node['app_data']:
                node['app_data'].pop('ui_data')
            if 'artifact' in node['app_data']:
                node['app_data']['filename'] = node['app_data'].pop('artifact')
            if 'image' in node['app_data']:
                node['app_data']['runtime_image'] = node['app_data'].pop('image')
            if 'vars' in node['app_data']:
                node['app_data']['env_vars'] = node['app_data'].pop('vars', [])
            if 'file_dependencies' in node['app_data']:
                node['app_data']['dependencies'] = node['app_data'].pop('file_dependencies', [])
            if 'recursive_dependencies' in node['app_data']:
                node['app_data']['include_subdirectories'] = node['app_data'].pop('recursive_dependencies', False)

        # dump json to another file
        if args['overwrite']:
            new_pipeline_file = args['pipeline_file']
        else:
            new_pipeline_file = os.path.basename(args['pipeline_file']).split(".")[0] + '-new.json'
        with open(new_pipeline_file, "w") as f:
            f.write(json.dumps(json_data, indent=4))
