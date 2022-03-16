/*
 * Copyright 2018-2022 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DropDown } from '@elyra/ui-components';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { IFormComponentRegistry } from '@jupyterlab/ui-components';
import Form, { IChangeEvent } from '@rjsf/core';
import * as React from 'react';

import { CodeBlock } from './CodeBlock';
import { MetadataEditorTagsField } from './MetadataEditorTags';

interface IFormEditorProps {
  schema: any;
  onChange: (formData: any) => void;
  setInvalid: (invalid: boolean) => void;
  editorServices: IEditorServices | null;
  componentRegistry?: IFormComponentRegistry;
  originalData?: any;
  allTags?: string[];
  languageOptions?: string[];
}

export const FormEditor: React.FC<IFormEditorProps> = ({
  schema,
  onChange,
  setInvalid,
  editorServices,
  componentRegistry,
  originalData,
  allTags,
  languageOptions
}) => {
  const [formData, setFormData] = React.useState(originalData ?? ({} as any));
  const [tags, setTags] = React.useState(allTags);

  const uiSchema: any = {};
  for (const field in schema?.properties) {
    uiSchema[field] = schema.properties[field].uihints ?? {};
    uiSchema[field]['ui:field'] = uiSchema[field]['field_type'];
    uiSchema[field].classNames = `${field}Field`;
  }

  return (
    <Form
      schema={schema}
      formData={formData}
      formContext={{
        editorServices: editorServices,
        language: formData?.language ?? '',
        allTags: tags,
        updateAllTags: (updatedTags: string[]): void => {
          setTags(updatedTags);
        },
        languageOptions: languageOptions
      }}
      fields={{
        code: CodeBlock,
        tags: MetadataEditorTagsField,
        dropdown: DropDown
      }}
      uiSchema={uiSchema}
      onChange={(e: IChangeEvent<any>): void => {
        setFormData(e.formData);
        onChange(e.formData);
        setInvalid(e.errors.length > 0 || false);
      }}
      liveValidate={true}
    />
  );
};
