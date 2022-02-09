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

import * as React from 'react';
import Form, { Field, IChangeEvent } from '@rjsf/core';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { MetadataEditorTags } from './MetadataEditorTags';
import { DropDown } from '@elyra/ui-components';
import { CodeBlock } from './CodeBlock';

interface IFormEditorProps {
  schema: any;
  onChange: (formData: any) => void;
  setInvalid: (invalid: boolean) => void;
  editorServices: IEditorServices | null;
  originalData?: any;
  allTags?: string[];
  languageOptions?: string[];
}

const CustomArray: Field = props => {
  if (props.name === 'code') {
    return (
      <CodeBlock
        editorServices={props.formContext.editorServices}
        defaultValue={
          props.formData?.join('\n') ??
          (props.defaultValue as string[])?.join('\n')
        }
        language={props.formContext.language}
        label={props.title ?? 'Code'}
        required={props.required}
        defaultError={false}
        onChange={props.onChange}
      />
    );
  } else if (props.name === 'tags') {
    return (
      <MetadataEditorTags
        selectedTags={props.formData ?? []}
        tags={props.formContext.allTags ?? []}
        handleChange={(selectedTags: string[], allTags: string[]) => {
          props.onChange(selectedTags);
          props.formContext.updateAllTags?.(allTags);
        }}
      />
    );
  }

  return <div>{props.children}</div>;
};

export const FormEditor: React.FC<IFormEditorProps> = ({
  schema,
  onChange,
  setInvalid,
  editorServices,
  originalData,
  allTags,
  languageOptions
}) => {
  const [formData, setFormData] = React.useState(originalData ?? ({} as any));
  const [tags, setTags] = React.useState(allTags);

  const uiSchema: any = {};
  for (const field in schema?.properties) {
    uiSchema[field] = schema.properties[field].uihints ?? {};
    uiSchema[field]['ui:widget'] = uiSchema[field]['field_type'];
  }

  return (
    <Form
      schema={schema}
      formData={formData}
      formContext={{
        editorServices: editorServices,
        language: formData?.language ?? '',
        allTags: tags,
        updateAllTags: (updatedTags: string[]) => {
          setTags(updatedTags);
        },
        languageOptions: languageOptions
      }}
      widgets={{
        dropdown: DropDown
      }}
      uiSchema={uiSchema}
      onChange={(e: IChangeEvent<any>) => {
        setFormData(e.formData);
        onChange(e.formData);
        setInvalid(e.errors.length > 0 || false);
      }}
      fields={{
        ArrayField: CustomArray
      }}
      liveValidate={true}
    />
  );
};
