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

import { trashIcon } from '@elyra/ui-components';
import {
  closeIcon,
  caretDownEmptyIcon,
  editIcon,
  folderIcon,
  LabIcon,
  paletteIcon,
} from '@jupyterlab/ui-components';
import * as React from 'react';

interface ISvgIconProps {
  children: React.ReactNode;
}

const SvgIcon: React.FC<ISvgIconProps> = ({ children }) => {
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
    focus: 'var(--jp-brand-color0)',
    border: 'var(--jp-border-color0)',
    divider: 'var(--jp-border-color0)',
    hover: 'var(--jp-border-color1)',
    active: 'rgba(255, 255, 255, 0.18)',
    inputBorder: 'var(--jp-border-color0)',
    primary: {
      main: 'var(--jp-inverse-layout-color4)',
      hover: 'transparent',
      contrastText: 'var(--jp-layout-color1)',
    },
    secondary: {
      main: 'transparent',
      contrastText: 'var(--jp-content-font-color1)',
    },
    error: {
      main: 'var(--jp-error-color0)',
      contrastText: 'var(--jp-icon-contrast-color3)',
    },
    errorMessage: {
      main: 'var(--jp-error-color1)',
      contrastText: 'rgba(255, 255, 255, 0.9)',
      errorBorder: 'var(--jp-error-color0)',
    },
    icon: {
      primary: 'var(--jp-ui-font-color0)',
      secondary: 'var(--jp-ui-font-color0)',
    },
    text: {
      primary: 'var(--jp-content-font-color0)',
      secondary: 'var(--jp-ui-font-color1)',
      bold: 'var(--jp-inverse-layout-color2)',
      inactive: 'var(--jp-inverse-layout-color4)',
      disabled: 'var(--jp-content-font-color3)',
      link: 'var(--jp-content-link-color)',
      error: 'var(--jp-error-color0)',
      icon: 'var(--jp-inverse-layout-color2)',
    },
    background: {
      default: 'var(--jp-layout-color1)',
      secondary: 'var(--jp-border-color2)',
      input: 'transparent',
    },
    highlight: {
      border: 'transparent',
      hover: 'var(--jp-content-font-color0)',
      focus: 'transparent',
    },
  },
  shape: {
    borderRadius: '4px',
  },
  typography: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontWeight: 'normal',
    fontSize: 'var(--jp-content-font-size1)',
  },
  overrides: {
    deleteIcon: LabIcon.resolveReact({ icon: trashIcon }),
    editIcon: LabIcon.resolveReact({ icon: editIcon }),
    folderIcon: LabIcon.resolveReact({ icon: folderIcon }),
    closeIcon: LabIcon.resolveReact({ icon: closeIcon }),
    propertiesIcon: (
      <SvgIcon>
        <path d="M3.5 2h-1v5h1V2zm6.1 5H6.4L6 6.45v-1L6.4 5h3.2l.4.5v1l-.4.5zm-5 3H1.4L1 9.5v-1l.4-.5h3.2l.4.5v1l-.4.5zm3.9-8h-1v2h1V2zm-1 6h1v6h-1V8zm-4 3h-1v3h1v-3zm7.9 0h3.19l.4-.5v-.95l-.4-.5H11.4l-.4.5v.95l.4.5zm2.1-9h-1v6h1V2zm-1 10h1v2h-1v-2z" />
      </SvgIcon>
    ),
    paletteIcon: LabIcon.resolveReact({ icon: paletteIcon }),
    checkIcon: (
      <SvgIcon>
        <path d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z" />
      </SvgIcon>
    ),
    chevronDownIcon: LabIcon.resolveReact({ icon: caretDownEmptyIcon }),
  },
};

export { theme };
