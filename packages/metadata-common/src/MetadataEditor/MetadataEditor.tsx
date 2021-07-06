/*
 * Copyright 2018-2021 Elyra Authors
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

import { IDictionary } from '@elyra/services';
import { DropDown, ThemeProvider, TextInput } from '@elyra/ui-components';

import { ILabStatus } from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';

import { InputLabel, Button, Link, styled } from '@material-ui/core';

import * as React from 'react';

import { CodeBlock } from './CodeBlock';
import { TagEditor } from './TagEditor';
import { useMetadata } from './use-metadata';

const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
// const DIRTY_CLASS = 'jp-mod-dirty';

const SaveButton = styled(Button)({
  borderColor: 'var(--jp-border-color0)',
  color: 'var(--jp-ui-font-color1)',
  '&:hover': {
    borderColor: ' var(--jp-ui-font-color1)'
  }
});

// const isValueEmpty = (schemaValue: any): boolean => {
//   return (
//     schemaValue === undefined ||
//     schemaValue === null ||
//     schemaValue === '' ||
//     (Array.isArray(schemaValue) && schemaValue.length === 0) ||
//     (Array.isArray(schemaValue) &&
//       schemaValue.length === 1 &&
//       schemaValue[0] === '') ||
//     schemaValue === '(No selection)'
//   );
// };

interface IFieldProps {
  name: string;
  fieldName: string;
  language: string;
  code: string[];
  requiredFields: string[];
  allTags: string[];
  schema: IDictionary<any>;
  metadata: IDictionary<any>;
  editorServices: IEditorServices | null;
}

const Field: React.FC<IFieldProps> = ({
  name,
  fieldName,
  language,
  code,
  requiredFields,
  allTags,
  schema,
  metadata,
  editorServices
}) => {
  let uihints = schema[fieldName].uihints;
  const required = requiredFields && requiredFields.includes(fieldName);
  const defaultValue = schema[fieldName].default ?? '';
  if (uihints === undefined) {
    uihints = {};
    schema[fieldName].uihints = uihints;
  }
  if (uihints.field_type === 'textinput' || uihints.field_type === undefined) {
    return (
      <TextInput
        label={schema[fieldName].title}
        description={schema[fieldName].description}
        key={`${fieldName}TextInput`}
        fieldName={fieldName}
        defaultValue={metadata[fieldName] ?? defaultValue}
        required={required}
        secure={uihints.secure}
        defaultError={uihints.error}
        placeholder={uihints.placeholder}
        onChange={(value): void => {
          handleTextInputChange(fieldName, value);
        }}
      />
    );
  } else if (uihints.field_type === 'dropdown') {
    return (
      <DropDown
        label={schema[fieldName].title}
        key={`${fieldName}DropDown`}
        description={schema[fieldName].description}
        required={required}
        defaultError={uihints.error}
        placeholder={uihints.placeholder}
        defaultValue={schema[fieldName].default}
        readonly={schema[fieldName].enum !== undefined}
        initialValue={metadata[fieldName]}
        options={getDefaultChoices(fieldName)}
        onChange={(value): void => {
          handleDropdownChange(fieldName, value);
        }}
      />
    );
  } else if (uihints.field_type === 'code') {
    let initialCodeValue = '';
    if (name) {
      initialCodeValue = metadata.code.join('\n');
    } else if (code) {
      metadata.code = code;
      initialCodeValue = code.join('\n');
    }

    return (
      <div
        className={'elyra-metadataEditor-formInput elyra-metadataEditor-code'}
        key={`${fieldName}CodeEditor`}
      >
        {editorServices !== null && (
          <CodeBlock
            editorServices={editorServices}
            language={language ?? metadata.language}
            defaultValue={initialCodeValue}
            onChange={(value): void => {
              metadata.code = value;
              handleDirtyState(true);
              return;
            }}
            defaultError={uihints.error}
            required={required ?? false}
            label={schema[fieldName].title}
          />
        )}
      </div>
    );
  } else if (uihints.field_type === 'tags') {
    return (
      <div
        className="elyra-metadataEditor-formInput"
        key={`${fieldName}TagList`}
      >
        <InputLabel> Tags </InputLabel>
        <TagEditor
          selectedTags={metadata.tags}
          tags={allTags}
          handleChange={handleChangeOnTag}
        />
      </div>
    );
  } else {
    return null;
  }
};

interface ICategoryProps {
  category: string;
}

const Category: React.FC<ICategoryProps> = ({ category }) => {
  if (category === '_noCategory') {
    return null;
  }
  return <h4 style={{ flexBasis: '100%', padding: '10px' }}>{category}</h4>;
};

export interface IMetadataEditorProps {
  schema: string;
  namespace: string;
  name?: string;
  code?: string[];
  onSave: () => void;
  editorServices: IEditorServices | null;
  status: ILabStatus;
  themeManager?: IThemeManager;
}

export const MetadataEditor: React.FC<IMetadataEditorProps> = ({
  schema: schemaName,
  namespace,
  name,
  code,
  onSave,
  editorServices,
  status,
  themeManager
}) => {
  const [junk] = useMetadata(namespace, schemaName, name);

  let headerText = `Edit "${junk.displayName}"`;
  if (!name) {
    headerText = `Add new ${junk.schemaDisplayName}`;
  }

  const error = junk.displayName === '' && invalidForm;

  return (
    <ThemeProvider themeManager={themeManager}>
      <div className={ELYRA_METADATA_EDITOR_CLASS}>
        <h3>{headerText}</h3>
        <p style={{ width: '100%', marginBottom: '10px' }}>
          All fields marked with an asterisk are required.{' '}
          {!!junk.referenceURL && (
            <Link
              href={junk.referenceURL}
              target="_blank"
              rel="noreferrer noopener"
            >
              [Learn more ...]
            </Link>
          )}
        </p>
        {junk.displayName !== undefined && (
          <TextInput
            label="Name"
            key="displayNameTextInput"
            fieldName="display_name"
            defaultValue={junk.displayName}
            required={true}
            secure={false}
            defaultError={error}
            onChange={(value): void => {
              handleTextInputChange('display_name', value);
            }}
          />
        )}
        {junk.schemaPropertiesByCategory.map((c: any) => (
          <React.Fragment key={c}>
            <Category category={c} />
            <Field
              allTags={[]}
              code={code}
              editorServices={editorServices}
              fieldName={}
              language={}
              metadata={}
              name={}
              requiredFields={}
              schema={}
            />
          </React.Fragment>
        ))}
        <div
          className={
            'elyra-metadataEditor-formInput elyra-metadataEditor-saveButton'
          }
          key={'SaveButton'}
        >
          <SaveButton
            variant="outlined"
            color="primary"
            onClick={(): void => {
              saveMetadata();
            }}
          >
            Save & Close
          </SaveButton>
        </div>
      </div>
    </ThemeProvider>
  );
};

/**
 * Metadata editor widget
 */
// export class XMetadataEditor extends ReactWidget {
//   onSave: () => void;
//   editorServices: IEditorServices | null;
//   status: ILabStatus;
//   schemaName: string;
//   namespace: string;
//   name?: string;
//   code?: string[];
//   allTags: string[];
//   clearDirty: IDisposable | null;
//   invalidForm: boolean;
//   showSecure: IDictionary<boolean>;
//   widgetClass: string;
//   themeManager?: IThemeManager;

//   displayName?: string;
//   editor?: CodeEditor.IEditor;
//   schemaDisplayName?: string;
//   dirty?: boolean;
//   requiredFields?: string[];
//   referenceURL?: string;
//   language?: string;

//   schema: IDictionary<any> = {};
//   schemaPropertiesByCategory: IDictionary<string[]> = {};
//   allMetadata: IDictionary<any>[] = [];
//   metadata: IDictionary<any> = {};

//   /**
//    * Checks that all required fields have a value before submitting the form.
//    * Returns false if the form is valid. Sets any invalid fields' intent to danger
//    * so that the form will highlight the input(s) causing issues in red.
//    */
//   hasInvalidFields(): boolean {
//     this.invalidForm = false;
//     if (this.displayName === null || this.displayName === '') {
//       this.invalidForm = true;
//     }
//     for (const schemaField in this.schema) {
//       const value =
//         this.metadata[schemaField] || this.schema[schemaField].default;
//       if (this.requiredFields?.includes(schemaField) && isValueEmpty(value)) {
//         this.invalidForm = true;
//         this.schema[schemaField].uihints.error = true;
//       } else {
//         this.schema[schemaField].uihints.error = false;
//       }
//     }
//     return this.invalidForm;
//   }

//   onCloseRequest(msg: Message): void {
//     if (this.dirty) {
//       showDialog({
//         title: 'Close without saving?',
//         body: (
//           <p>
//             {`"${this.displayName}" has unsaved changes, close without saving?`}
//           </p>
//         ),
//         buttons: [Dialog.cancelButton(), Dialog.okButton()]
//       }).then((response: any): void => {
//         if (response.button.accept) {
//           this.dispose();
//           super.onCloseRequest(msg);
//         }
//       });
//     } else {
//       this.dispose();
//       super.onCloseRequest(msg);
//     }
//   }

//   saveMetadata(): void {
//     const newMetadata: any = {
//       schema_name: this.schemaName,
//       display_name: this.displayName,
//       metadata: this.metadata
//     };

//     if (this.hasInvalidFields()) {
//       this.update();
//       return;
//     }

//     if (!this.name) {
//       MetadataService.postMetadata(this.namespace, JSON.stringify(newMetadata))
//         .then((response: any): void => {
//           this.handleDirtyState(false);
//           this.onSave();
//           this.close();
//         })
//         .catch(error => RequestErrors.serverError(error));
//     } else {
//       MetadataService.putMetadata(
//         this.namespace,
//         this.name,
//         JSON.stringify(newMetadata)
//       )
//         .then((response: any): void => {
//           this.handleDirtyState(false);
//           this.onSave();
//           this.close();
//         })
//         .catch(error => RequestErrors.serverError(error));
//     }
//   }

//   handleTextInputChange(schemaField: string, value: string): void {
//     this.handleDirtyState(true);
//     // Special case because all metadata has a display name
//     if (schemaField === 'display_name') {
//       this.displayName = value;
//     } else if (!value && !this.requiredFields?.includes(schemaField)) {
//       delete this.metadata[schemaField];
//     } else {
//       this.metadata[schemaField] = value;
//     }
//   }

//   handleDropdownChange = (schemaField: string, value: string): void => {
//     this.handleDirtyState(true);
//     this.metadata[schemaField] = value;
//     if (schemaField === 'language') {
//       this.language = value;
//     }
//     this.update();
//   };

//   handleDirtyState(dirty: boolean): void {
//     this.dirty = dirty;
//     if (this.dirty && !this.clearDirty) {
//       this.clearDirty = this.status.setDirty();
//     } else if (!this.dirty && this.clearDirty) {
//       this.clearDirty.dispose();
//       this.clearDirty = null;
//     }
//     if (this.dirty && !this.title.className.includes(DIRTY_CLASS)) {
//       this.title.className += DIRTY_CLASS;
//     } else if (!this.dirty) {
//       this.title.className = this.title.className.replace(DIRTY_CLASS, '');
//     }
//   }

//   getDefaultChoices(fieldName: string): any[] {
//     let defaultChoices = this.schema[fieldName].enum;
//     if (!defaultChoices) {
//       defaultChoices =
//         Object.assign([], this.schema[fieldName].uihints.default_choices) || [];
//       for (const otherMetadata of this.allMetadata) {
//         if (
//           // Don't include the current metadata
//           otherMetadata !== this.metadata &&
//           // Don't add if otherMetadata hasn't defined field
//           otherMetadata.metadata[fieldName] &&
//           !find(defaultChoices, (choice: string) => {
//             return (
//               choice.toLowerCase() ===
//               otherMetadata.metadata[fieldName].toLowerCase()
//             );
//           })
//         ) {
//           defaultChoices.push(otherMetadata.metadata[fieldName]);
//         }
//       }
//     }
//     return defaultChoices;
//   }

//   setFormFocus(): void {
//     const isFocused = document
//       .querySelector(`.${this.widgetClass}`)
//       ?.contains(document.activeElement);

//     if (!isFocused) {
//       const input = document.querySelector(
//         `.${this.widgetClass} .elyra-metadataEditor-form-display_name input`
//       ) as HTMLInputElement;
//       if (input) {
//         input.focus();
//         input.setSelectionRange(input.value.length, input.value.length);
//       }
//     }
//   }

//   onAfterShow(msg: Message): void {
//     this.setFormFocus();
//   }

//   onUpdateRequest(msg: Message): void {
//     super.onUpdateRequest(msg);
//     this.setFormFocus();
//   }

//   handleChangeOnTag(selectedTags: string[], allTags: string[]): void {
//     this.handleDirtyState(true);
//     this.metadata.tags = selectedTags;
//     this.allTags = allTags;
//   }
// }
