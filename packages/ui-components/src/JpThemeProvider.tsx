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

import React, { useEffect, useState } from 'react';

export interface IJpThemeProviderProps {
  children: React.ReactElement;
  themeManager: IThemeManager;
  updateWidget?: () => void;
}

const lightTheme = createMuiTheme({
  palette: {
    type: 'light'
  }
});

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark'
  }
});

const isLightTheme = (themeManager: IThemeManager): boolean => {
  return themeManager.theme && themeManager.isLight(themeManager.theme);
};

export const JpThemeProvider = ({
  children,
  themeManager,
  updateWidget
}: IJpThemeProviderProps): React.ReactElement => {
  const [isLight, setIsLight] = useState(isLightTheme(themeManager));

  useEffect(() => {
    const updateTheme = (): void => {
      setIsLight(isLightTheme(themeManager));
      if (updateWidget) {
        updateWidget();
      }
    };

    updateTheme();

    if (themeManager) {
      themeManager.themeChanged.connect(updateTheme);
    }
  }, [themeManager, updateWidget]);

  return (
    <ThemeProvider theme={isLight ? lightTheme : darkTheme}>
      {children}
    </ThemeProvider>
  );
};
