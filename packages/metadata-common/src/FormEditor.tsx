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
import Form, {
  ErrorSchema,
  Field,
  FormProps,
  IChangeEvent,
  Widget
} from '@rjsf/core';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { FormHelperText, InputLabel } from '@material-ui/core';
import { MetadataEditorTags } from './MetadataEditorTags';

interface IFormEditorProps {
  schema: any;
  onChange: (formData: any) => void;
  setInvalid: (invalid: boolean) => void;
  editorServices: IEditorServices | null;
  originalData?: any;
  allTags?: string[];
}

interface ICodeBlockProps {
  editorServices: IEditorServices;
  defaultValue: string;
  language: string;
  onChange?: (value: string) => any;
  defaultError: boolean;
  label: string;
  required: boolean;
}

const CustomArray: Field = props => {
  if (props.name === 'code') {
    return (
      <CodeBlock
        editorServices={props.formContext.editorServices}
        defaultValue={
          props.formData?.join(' ') ??
          (props.defaultValue as string[])?.join(' ')
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

const CodeBlock: React.FC<ICodeBlockProps> = ({
  editorServices,
  defaultValue,
  language,
  onChange,
  defaultError,
  label,
  required
}) => {
  const [error, setError] = React.useState(defaultError);

  const codeBlockRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<CodeEditor.IEditor>();

  // `editorServices` should never change so make it a ref.
  const servicesRef = React.useRef(editorServices);

  // This is necessary to rerender with error when clicking the save button.
  React.useEffect(() => {
    setError(defaultError);
  }, [defaultError]);

  React.useEffect(() => {
    const handleChange = (args: any): void => {
      setError(required && args.text === '');
      onChange?.(args.text.split('\n'));
    };

    if (codeBlockRef.current !== null) {
      editorRef.current = servicesRef.current.factoryService.newInlineEditor({
        host: codeBlockRef.current,
        model: new CodeEditor.Model({
          value: defaultValue,
          mimeType: servicesRef.current.mimeTypeService.getMimeTypeByLanguage({
            name: language,
            codemirror_mode: language
          })
        })
      });
      editorRef.current?.model.value.changed.connect(handleChange);
    }

    return (): void => {
      editorRef.current?.model.value.changed.disconnect(handleChange);
    };
    // NOTE: The parent component is unstable so props change frequently causing
    // new editors to be created unnecessarily. This effect on mount should only
    // run on mount. Keep in mind this could have side effects, for example if
    // the `onChange` callback actually does change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (editorRef.current !== undefined) {
      editorRef.current.model.mimeType = servicesRef.current.mimeTypeService.getMimeTypeByLanguage(
        {
          name: language,
          codemirror_mode: language
        }
      );
    }
  }, [language]);

  return (
    <div>
      <InputLabel error={error} required={required}>
        {label}
      </InputLabel>
      <div ref={codeBlockRef} className="elyra-form-code" />
      {error === true && (
        <FormHelperText error>This field is required.</FormHelperText>
      )}
    </div>
  );
};

export const FormEditor: React.FC<IFormEditorProps> = ({
  schema,
  onChange,
  setInvalid,
  editorServices,
  originalData,
  allTags
}) => {
  const [formData, setFormData] = React.useState(originalData ?? ({} as any));
  const [tags, setTags] = React.useState(allTags);

  React.useEffect(() => {
    setFormData(originalData);
  }, [originalData]);

  return (
    <Form
      schema={schema}
      formData={formData}
      formContext={{
        editorServices: editorServices,
        language: formData.source?.language ?? '',
        allTags: tags,
        updateAllTags: (updatedTags: string[]) => {
          setTags(updatedTags);
        }
      }}
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
