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

import { IEditorServices } from '@jupyterlab/codeeditor';
import { ITranslator } from '@jupyterlab/translation';
import { IFormComponentRegistry } from '@jupyterlab/ui-components';
import Form, { ArrayFieldTemplateProps, IChangeEvent } from '@rjsf/core';
import * as React from 'react';

interface IFormEditorProps {
  schema: any;
  onChange: (formData: any) => void;
  setInvalid: (invalid: boolean) => void;
  editorServices: IEditorServices | null;
  translator: ITranslator;
  componentRegistry?: IFormComponentRegistry;
  originalData?: any;
  allTags?: string[];
  languageOptions?: string[];
}

const ArrayTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  return (
    <div className={props.className}>
      <props.TitleField
        title={props.title}
        required={props.required}
        id={`${props.idSchema.$id}-title`}
      />
      <props.DescriptionField
        id={`${props.idSchema.$id}-description`}
        description={props.schema.description ?? ''}
      />
      {props.items.map(item => {
        return (
          <div key={item.key} className={item.className}>
            {item.children}
            <div className="jp-ArrayOperations">
              <button
                className="jp-mod-styled jp-mod-reject"
                onClick={item.onReorderClick(item.index, item.index - 1)}
                disabled={!item.hasMoveUp}
              >
                {props.formContext?.trans?.__?.('Move Up') ?? 'Move up'}
              </button>
              <button
                className="jp-mod-styled jp-mod-reject"
                onClick={item.onReorderClick(item.index, item.index + 1)}
                disabled={!item.hasMoveDown}
              >
                {props.formContext?.trans?.__?.('Move Down') ?? 'Move down'}
              </button>
              <button
                className="jp-mod-styled jp-mod-warn"
                onClick={item.onDropIndexClick(item.index)}
                disabled={!item.hasRemove}
              >
                {props.formContext?.trans?.__?.('Remove') ?? 'remove'}
              </button>
            </div>
          </div>
        );
      })}
      {props.canAdd && (
        <button
          className="jp-mod-styled jp-mod-reject"
          onClick={props.onAddClick}
        >
          {props.formContext?.trans?.__?.('Add') ?? 'Add'}
        </button>
      )}
    </div>
  );
};

export const FormEditor: React.FC<IFormEditorProps> = ({
  schema,
  onChange,
  setInvalid,
  editorServices,
  componentRegistry,
  translator,
  originalData,
  allTags,
  languageOptions
}) => {
  const [formData, setFormData] = React.useState(originalData ?? ({} as any));
  const [tags, setTags] = React.useState(allTags);

  const uiSchema: any = {};
  for (const category in schema?.properties) {
    const properties = schema.properties[category];
    uiSchema[category] = {};
    for (const field in properties.properties) {
      uiSchema[category][field] = properties.properties[field].uihints ?? {};
      uiSchema[category][field]['ui:field'] =
        uiSchema[category][field]['field_type'];
      uiSchema[category][field].classNames = `${field}Field`;
    }
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
        languageOptions: languageOptions,
        trans: translator
      }}
      fields={componentRegistry?.renderers}
      ArrayFieldTemplate={ArrayTemplate}
      uiSchema={uiSchema}
      noHtml5Validate={true}
      onChange={(e: IChangeEvent<any>): void => {
        setFormData(e.formData);
        onChange(e.formData);
        setInvalid(e.errors.length > 0 || false);
      }}
      liveValidate={true}
    />
  );
};
