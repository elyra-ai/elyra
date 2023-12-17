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

import { MetadataService } from '@elyra/services';
import { RequestErrors, FormEditor } from '@elyra/ui-components';

import * as React from 'react';

import { IMetadataEditorProps } from './MetadataEditorWidget';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';

/**
 * Props for the metadata editor component.
 */
interface IMetadataEditorComponentProps extends IMetadataEditorProps {
  /**
   * Schema including the metadata wrapper and other fields like display name.
   */
  schemaTop: any;

  /**
   * Metadata that has already been defined (if this is not a new instance)
   */
  initialMetadata: any;

  /**
   * Handler for setting dirty state in the parent component.
   */
  setDirty: (dirty: boolean) => void;

  /**
   * Handler to trigger close after saving.
   */
  close: () => void;

  /**
   * All tags defined between all metadata instances.
   */
  allTags: string[];

  /**
   * Function to find default choices based on uihints and existing values for that field.
   */
  getDefaultChoices: (fieldName: string) => string[];
}

/**
 * Metadata editor widget
 */
export const MetadataEditor: React.FC<IMetadataEditorComponentProps> = ({
  editorServices,
  schemaspace,
  onSave,
  schemaName,
  schemaTop,
  initialMetadata,
  translator,
  name,
  setDirty,
  close,
  allTags,
  componentRegistry,
  getDefaultChoices,
  titleContext,
}: IMetadataEditorComponentProps) => {
  const [invalidForm, setInvalidForm] = React.useState(name === undefined);

  const schema = schemaTop.properties.metadata;

  const [metadata, setMetadata] = React.useState(initialMetadata);
  const displayName = initialMetadata?.['_noCategory']?.['display_name'];
  const referenceURL = schemaTop.uihints?.reference_url;

  /**
   * Saves metadata through either put or post request.
   */
  const saveMetadata = (): void => {
    if (invalidForm) {
      return;
    }

    const newMetadata: any = {
      schema_name: schemaName,
      display_name: metadata?.['_noCategory']?.['display_name'],
      metadata: flattenFormData(metadata),
    };

    if (!name) {
      MetadataService.postMetadata(schemaspace, JSON.stringify(newMetadata))
        .then((response: any): void => {
          setDirty(false);
          onSave();
          close();
        })
        .catch((error) => RequestErrors.serverError(error));
    } else {
      MetadataService.putMetadata(
        schemaspace,
        name,
        JSON.stringify(newMetadata),
      )
        .then((response: any): void => {
          setDirty(false);
          onSave();
          close();
        })
        .catch((error) => RequestErrors.serverError(error));
    }
  };

  let headerText = `Edit "${displayName}"`;
  if (!displayName) {
    headerText = `Add new ${schemaTop.title} ${titleContext ?? ''}`;
  }

  /**
   * Removes category wrappers in the data before sending to the server.
   * @param newFormData - Form data with category wrappers.
   * @returns - Form data as the server expects it.
   */
  const flattenFormData = (newFormData: any): any => {
    const flattened: { [id: string]: any } = {};
    for (const category in newFormData) {
      for (const property in newFormData[category]) {
        flattened[property] = newFormData[category][property];
      }
    }
    return flattened;
  };

  /**
   * Triggers save and close on pressing enter key (outside of a text area)
   */
  const onKeyPress: React.KeyboardEventHandler = (
    event: React.KeyboardEvent,
  ) => {
    const targetElement = event.nativeEvent.target as HTMLElement;
    if (event.key === 'Enter' && targetElement?.tagName !== 'TEXTAREA') {
      saveMetadata();
    }
  };

  return (
    <div onKeyPress={onKeyPress} className={ELYRA_METADATA_EDITOR_CLASS}>
      <h3> {headerText} </h3>
      <p style={{ width: '100%', marginBottom: '10px' }}>
        {translator.__('All fields marked with an asterisk are required.')}
        &nbsp;
        {referenceURL ? (
          <a href={referenceURL} target="_blank" rel="noreferrer noopener">
            {translator.__('[Learn more ...]')}
          </a>
        ) : null}
      </p>
      <FormEditor
        schema={schema}
        onChange={(formData: any, invalid: boolean): void => {
          setMetadata(formData);
          setInvalidForm(invalid);
          setDirty(true);
        }}
        componentRegistry={componentRegistry}
        translator={translator}
        editorServices={editorServices}
        originalData={metadata}
        allTags={allTags}
        languageOptions={getDefaultChoices('language')}
      />
      <div
        className={`elyra-metadataEditor-formInput elyra-metadataEditor-saveButton ${
          invalidForm ? 'errorForm' : ''
        }`}
        key={'SaveButton'}
      >
        {invalidForm ? (
          <p className="formError">
            {translator.__('Cannot save invalid form.')}
          </p>
        ) : (
          <div />
        )}
        <button
          onClick={(): void => {
            saveMetadata();
          }}
        >
          {translator.__('Save & Close')}
        </button>
      </div>
    </div>
  );
};
