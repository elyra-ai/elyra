/*
 * Copyright 2018-2025 Elyra Authors
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
  RegistryWidgetsType,
  RJSFValidationError,
  UiSchema
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import * as React from 'react';

type ElyraSchema = GenericObjectType & {
  uihints?: { title: string; icon: string; reference_url: string };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a record that holds any value
export type GenericObjectType = Record<string, any>;

/**
 * Props passed to the FormEditor.
 */
interface IFormEditorProps {
  /**
   * Schema for form fields to be displayed.
   */
  schema: GenericObjectType;

  /**
   * Handler to update form data in parent component.
   */
  onChange: (formData: GenericObjectType) => void;

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
  originalData?: GenericObjectType;

  /**
   * All existing tags to give as options.
   */
  allTags?: string[];

  /**
   * All existing languages to give as options.
   */
  languageOptions?: string[];
}

export type FormValidationState =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      errors: RJSFValidationError[];
    };

export interface IFormEditorRef {
  validateForm: (data: GenericObjectType) => FormValidationState;
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
const RefForwardingFormEditor: React.ForwardRefRenderFunction<
  IFormEditorRef,
  IFormEditorProps
> = (
  {
    schema,
    onChange,
    editorServices,
    componentRegistry,
    translator,
    originalData,
    allTags,
    languageOptions
  },
  forwardedRef
) => {
  const [formData, setFormData] = React.useState(originalData ?? {});
  const [liveValidateEnabled, setLiveValidateEnabled] = React.useState(false);

  /**
   * Generate the rjsf uiSchema from uihints in the elyra metadata schema.
   */
  const uiSchema: UiSchema = {
    classNames: 'elyra-formEditor'
  };
  for (const category in schema?.properties) {
    const properties = schema.properties[category] as GenericObjectType;
    uiSchema[category] = {};
    for (const field in properties.properties) {
      const fieldProperties = properties.properties[field] as ElyraSchema;
      uiSchema[category][field] = fieldProperties.uihints ?? {};
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

  React.useImperativeHandle(
    forwardedRef,
    (): IFormEditorRef => ({
      validateForm: (data) => {
        setLiveValidateEnabled(true);
        const result = validator.validateFormData(data, schema);
        return result.errors.length === 0
          ? { isValid: true }
          : { isValid: false, errors: result.errors };
      }
    })
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
        onChange(e.formData);
      }}
      liveValidate={liveValidateEnabled}
      noHtml5Validate={
        /** noHtml5Validate is set to true to prevent the html validation from moving the focus when the live validate is called. */
        true
      }
    />
  );
};

export const FormEditor = React.forwardRef(RefForwardingFormEditor);
