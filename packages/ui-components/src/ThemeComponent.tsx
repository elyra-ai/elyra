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

import { IThemeManager } from '@jupyterlab/apputils';

import { createMuiTheme, ThemeProvider } from '@material-ui/core';

import React, { useEffect, useMemo, useState } from 'react';

export interface IProps {
  themeManager: IThemeManager;
}

const isLightTheme = (themeManager: IThemeManager): boolean => {
  // Default to light theme
  return themeManager?.theme ? themeManager.isLight(themeManager.theme) : true;
};

export const ThemeComponent: React.FC<IProps> = ({
  themeManager,
  children
}) => {
  const [isLight, setIsLight] = useState(isLightTheme(themeManager));

  // useMemo caches the theme for each value of isLight
  const theme = useMemo(() => {
    return createMuiTheme({
      palette: {
        type: isLight ? 'light' : 'dark'
      }
    });
  }, [isLight]);

  useEffect(() => {
    const updateTheme = (): void => {
      setIsLight(isLightTheme(themeManager));
    };

    if (themeManager) {
      themeManager.themeChanged.connect(updateTheme);
    }
    return (): void => {
      themeManager.themeChanged.disconnect(updateTheme);
    };
  }, [themeManager]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
