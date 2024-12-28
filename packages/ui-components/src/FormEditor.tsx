/*
 * Copyright 2018-2023 Elyra Authors
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
import { TranslationBundle } from '@jupyterlab/translation';
import { IFormRendererRegistry } from '@jupyterlab/ui-components';
import Form from '@rjsf/core';
import {
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  RegistryFieldsType,
  RegistryWidgetsType
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import * as React from 'react';

/**
 * Props passed to the FormEditor.
 */
interface IFormEditorProps {
  /**
   * Schema for form fields to be displayed.
   */
  schema: any;

  /**
   * Handler to update form data / error state in parent component.
   */
  onChange: (formData: any, invalid: boolean) => void;

  /**
   * Editor services to create new editors in code fields.
   */
  editorServices: IEditorServices | null;

  /**
   * Translator for internationalization
   */
  translator: TranslationBundle;

  /**
   * Registry to retrieve custom renderers.
   */
  componentRegistry?: IFormRendererRegistry;

  /**
   * Metadata that already exists (if there is any)
   */
  originalData?: any;

  /**
   * All existing tags to give as options.
   */
  allTags?: string[];

  /**
   * All existing languages to give as options.
   */
  languageOptions?: string[];
}

/**
 * React component that allows for custom add / remove buttons in the array
 * field component.
 */
const CustomArrayTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
  return (
    <div className={props.className}>
      {props.items.map((item) => {
        return (
          <div key={item.key} className={item.className}>
            {item.children}
            <button
              className="jp-mod-styled jp-mod-warn"
              onClick={item.onDropIndexClick(item.index)}
              disabled={!item.hasRemove}
            >
              {props.formContext.trans.__('Remove')}
            </button>
          </div>
        );
      })}
      {props.canAdd && (
        <button
          className="jp-mod-styled jp-mod-reject"
          onClick={props.onAddClick}
        >
          {props.formContext.trans.__('Add') ?? 'Add'}
        </button>
      )}
    </div>
  );
};

const CustomFieldTemplate: React.FC<FieldTemplateProps> = (props) => {
  return (
    <div className={props.classNames}>
      {props.schema.title !== undefined && props.schema.title !== ' ' ? (
        <div className="label-header">
          <label className="control-label" htmlFor={props.id}>
            {`${props.schema.title}${props.required ? '*' : ''}`}
          </label>
          {props.schema.description && (
            <div className="description-wrapper">
              <div className="description-button">?</div>
              <p
                className={`field-description ${
                  props.schema.title.length < 10 ? 'short-title' : ''
                }`}
              >
                {props.schema.description}
              </p>
            </div>
          )}
        </div>
      ) : undefined}
      {props.children}
      {props.errors}
    </div>
  );
};

/**
 * React component that wraps the RJSF form editor component.
 * Creates a uiSchema from given uihints and passes relevant information
 * to the custom renderers.
 */
export const FormEditor: React.FC<IFormEditorProps> = ({
  schema,
  onChange,
  editorServices,
  componentRegistry,
  translator,
  originalData,
  allTags,
  languageOptions
}) => {
  const [formData, setFormData] = React.useState(originalData ?? ({} as any));

  /**
   * Generate the rjsf uiSchema from uihints in the elyra metadata schema.
   */
  const uiSchema: any = {
    classNames: 'elyra-formEditor'
  };
  for (const category in schema?.properties) {
    const properties = schema.properties[category];
    uiSchema[category] = {};
    for (const field in properties.properties) {
      uiSchema[category][field] = properties.properties[field].uihints ?? {};
      uiSchema[category][field].classNames = `elyra-formEditor-form-${field}`;
    }
  }

  const fieldRenderers: RegistryFieldsType = Object.fromEntries(
    Object.entries(componentRegistry?.renderers ?? {})
      .filter(([_, value]) => value.fieldRenderer !== undefined)
      .map(([key, value]) => [key, value.fieldRenderer!])
  );

  const widgetRenderers: RegistryWidgetsType = Object.fromEntries(
    Object.entries(componentRegistry?.renderers ?? {})
      .filter(([_, value]) => value.widgetRenderer !== undefined)
      .map(([key, value]) => [key, value.widgetRenderer!])
  );

  return (
    <Form
      schema={schema}
      formData={formData}
      formContext={{
        editorServices: editorServices,
        language: formData?.['Source']?.language ?? '',
        allTags: allTags,
        languageOptions: languageOptions,
        trans: translator
      }}
      validator={validator}
      widgets={widgetRenderers}
      fields={fieldRenderers}
      templates={{
        FieldTemplate: CustomFieldTemplate,
        ArrayFieldTemplate: CustomArrayTemplate
      }}
      uiSchema={uiSchema}
      onChange={(e): void => {
        setFormData(e.formData);
        onChange(e.formData, e.errors.length > 0 || false);
      }}
      liveValidate={true}
      noHtml5Validate={
        /** noHtml5Validate is set to true to prevent the html validation from moving the focus when the live validate is called. */
        true
      }
    />
  );
};
