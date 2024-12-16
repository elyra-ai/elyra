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

import { CodeEditor } from '@jupyterlab/codeeditor';
import { FieldProps } from '@rjsf/utils';
import * as React from 'react';

export const CodeBlock: React.FC<FieldProps> = (props: FieldProps) => {
  const { formData, formContext, onChange, schema } = props;
  const codeBlockRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<CodeEditor.IEditor>();

  // `editorServices` should never change so make it a ref.
  const servicesRef = React.useRef(formContext.editorServices);

  React.useEffect(() => {
    const handleChange = (): void => {
      const source = editorRef.current?.model.sharedModel.getSource();
      onChange(source ? source.split('\n') : undefined);
    };

    if (codeBlockRef.current !== null) {
      const content =
        formData?.join('\n') ?? (schema.default as string[])?.join('\n');
      const mimeType =
        servicesRef.current.mimeTypeService.getMimeTypeByLanguage({
          name: formContext.language,
          codemirror_mode: formContext.language
        });
      const newEditor = servicesRef.current.factoryService.newInlineEditor({
        host: codeBlockRef.current,
        model: new CodeEditor.Model({ mimeType })
      });
      if (content) {
        newEditor.model.sharedModel.setSource(content);
      }
      newEditor.model.sharedModel.changed.connect(handleChange);
      editorRef.current = newEditor;
    }

    return (): void => {
      editorRef.current?.model.sharedModel.changed.disconnect(handleChange);
    };
    // NOTE: The parent component is unstable so props change frequently causing
    // new editors to be created unnecessarily. This effect on mount should only
    // run on mount. Keep in mind this could have side effects, for example if
    // the `onChange` callback actually does change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (editorRef.current !== undefined) {
      editorRef.current.model.mimeType =
        servicesRef.current.mimeTypeService.getMimeTypeByLanguage({
          name: formContext.language,
          codemirror_mode: formContext.language
        });
    }
  }, [formContext.language]);

  return <div ref={codeBlockRef} className="elyra-form-code" />;
};
