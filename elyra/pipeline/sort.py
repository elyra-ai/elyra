#
# Copyright 2018-2020 IBM Corporation
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

from elyra.pipeline import Operation


def get_operations_sorted_topologically(operations_by_id: dict(Operation)):
    ordered_operations = []
    print('>>>')
    for operation in operations_by_id.values():
        if operation not in ordered_operations:
            print(f'>>> processing operation [{operation.name}]')
            # operation is a root node
            if not operation.parent_operations:
                print(f'   adding root operation [{operation.name}] to ordered list')
                ordered_operations.append(operation)
            else:
                if operation not in ordered_operations:
                    visit_operation(operations_by_id, ordered_operations, operation)

    return ordered_operations


def visit_operation(operations_by_id, ordered_operations, operation):
    list = ''
    for o in ordered_operations:
        list = list + ', ' + o.name
    print(f'### ordered --> {list}')

    print(f'   visiting operation [{operation.name}]')

    for parent_operation_id in operation.parent_operations:
        parent_operation = operations_by_id[parent_operation_id]
        print(f'   processing parent operation [{parent_operation.name}] from operation [{operation.name}]')
        if parent_operation not in ordered_operations:
            print(f'   processing parent operation [{parent_operation.name}]')
            visit_operation(operations_by_id, ordered_operations, parent_operation)
    print(f'   adding [{operation.name}] to ordered operation list')
    ordered_operations.append(operation)
