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
import * as React from 'react';

interface ICodeBlockProps {
  formContext: {
    editorServices: any;
    language: string;
  };
  formData?: any;
  schema: {
    default?: string[];
  };
  onChange: (newData: string[]) => void;
}

export const CodeBlock: React.FC<ICodeBlockProps> = (
  props: ICodeBlockProps,
) => {
  const codeBlockRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<CodeEditor.IEditor>();

  // `editorServices` should never change so make it a ref.
  const servicesRef = React.useRef(props.formContext.editorServices);

  React.useEffect(() => {
    const handleChange = (args: any): void => {
      props.onChange(args.text.split('\n'));
    };

    if (codeBlockRef.current !== null) {
      editorRef.current = servicesRef.current.factoryService.newInlineEditor({
        host: codeBlockRef.current,
        model: new CodeEditor.Model({
          sharedModel:
            props.formData?.join('\n') ??
            (props.schema.default as string[])?.join('\n'),
          mimeType: servicesRef.current.mimeTypeService.getMimeTypeByLanguage({
            name: props.formContext.language,
            codemirror_mode: props.formContext.language,
          }),
        }),
      });
      editorRef.current?.model.sharedModel.changed.connect(handleChange);
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
          name: props.formContext.language,
          codemirror_mode: props.formContext.language,
        });
    }
  }, [props.formContext.language]);

  return <div ref={codeBlockRef} className="elyra-form-code" />;
};
