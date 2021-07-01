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

import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { InputLabel, FormHelperText } from '@material-ui/core';
import * as React from 'react';

interface ICodeBlockProps {
  editorServices: IEditorServices;
  defaultValue: string;
  language: string;
  onChange?: (value: string) => any;
  defaultError: boolean;
  label: string;
  required: boolean;
}

export const CodeBlock: React.FC<ICodeBlockProps> = ({
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
