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

import { trashIcon } from '@elyra/ui-components';
import * as React from 'react';

const SvgIcon = ({ children }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      {children}
    </svg>
  );
};

const theme: any = {
  palette: {
    focus: 'var(--jp-border-color1)',
    border: 'black',
    divider: 'black',
    hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.18)',
    primary: {
      main: 'var(--jp-inverse-layout-color4)',
      hover: 'var(--jp-inverse-layout-color3)',
      contrastText: 'var(--jp-layout-color1)'
    },
    secondary: {
      main: 'var(--jp-border-color1)',
      contrastText: 'black'
    },
    error: {
      main: 'var(--jp-error-color0)',
      contrastText: 'var(--jp-icon-contrast-color3)'
    },
    icon: {
      primary: 'var(--jp-ui-font-color0)',
      secondary: 'var(--jp-ui-font-color0)'
    },
    text: {
      primary: 'var(--jp-content-font-color0)',
      secondary: 'var(--jp-ui-font-color1)',
      bold: 'var(--jp-inverse-layout-color2)',
      inactive: 'var(--jp-inverse-layout-color4)',
      disabled: 'var(--jp-inverse-layout-color3)',
      link: 'var(--jp-content-link-color)',
      error: 'var(--jp-error-color0)'
    },
    background: {
      default: 'var(--jp-layout-color1)',
      secondary: 'var(--jp-editor-selected-background)',
      input: 'var(--jp-editor-selected-background)'
    },
    highlight: {
      border: 'rgba(0, 0, 0, 0.12)',
      hover: 'rgba(128, 128, 128, 0.07)',
      focus: 'rgba(128, 128, 128, 0.14)'
    }
  },
  typography: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontWeight: 'normal',
    fontSize: 'var(--jp-code-font-size)'
  },
  overrides: {
    deleteIcon: trashIcon,
    editIcon: (
      <SvgIcon>
        <path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z" />
      </SvgIcon>
    ),
    folderIcon: (
      <SvgIcon>
        <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 8.49V13h-12V7h4.49l.35-.15.86-.86H14v1.5l-.01 4zm0-6.49h-6.5l-.35.15-.86.86H2v-3h4.29l.85.85.36.15H14l-.01.99z" />
      </SvgIcon>
    ),
    closeIcon: (
      <SvgIcon>
        <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z" />
      </SvgIcon>
    ),
    propertiesIcon: (
      <SvgIcon>
        <path d="M3.5 2h-1v5h1V2zm6.1 5H6.4L6 6.45v-1L6.4 5h3.2l.4.5v1l-.4.5zm-5 3H1.4L1 9.5v-1l.4-.5h3.2l.4.5v1l-.4.5zm3.9-8h-1v2h1V2zm-1 6h1v6h-1V8zm-4 3h-1v3h1v-3zm7.9 0h3.19l.4-.5v-.95l-.4-.5H11.4l-.4.5v.95l.4.5zm2.1-9h-1v6h1V2zm-1 10h1v2h-1v-2z" />
      </SvgIcon>
    ),
    paletteIcon: (
      <SvgIcon>
        <path d="M8 1.003a7 7 0 0 0-7 7v.43c.09 1.51 1.91 1.79 3 .7a1.87 1.87 0 0 1 2.64 2.64c-1.1 1.16-.79 3.07.8 3.2h.6a7 7 0 1 0 0-14l-.04.03zm0 13h-.52a.58.58 0 0 1-.36-.14.56.56 0 0 1-.15-.3 1.24 1.24 0 0 1 .35-1.08 2.87 2.87 0 0 0 0-4 2.87 2.87 0 0 0-4.06 0 1 1 0 0 1-.9.34.41.41 0 0 1-.22-.12.42.42 0 0 1-.1-.29v-.37a6 6 0 1 1 6 6l-.04-.04zM9 3.997a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 7.007a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-7-5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
      </SvgIcon>
    ),
    checkIcon: (
      <SvgIcon>
        <path d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z" />
      </SvgIcon>
    )
  }
};

export { theme };
