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

import { IDebugger } from '@jupyterlab/debugger';

/**
 * Utility class to enable debugging scripts
 */
export class ScriptDebugger {
  disableButton: (disabled: boolean, buttonType: string) => void;
  breakpoints: IDebugger.IBreakpoint[];

  /**
   * Construct a new debugger.
   */
  constructor(disableButton: (disabled: boolean, buttonType: string) => void) {
    this.disableButton = disableButton;
    this.breakpoints = [];
  }

  updateBreakpoints = (breakpoints: IDebugger.IBreakpoint[]): void => {
    this.breakpoints = breakpoints;
  };

  /**
   * TODO
   * Function: Starts a session with a proper kernel and executes script in debug mode
   */

  /**
   * TODO
   * Function: Starts new debugger session.
   */

  /**
   * TODO
   * Function: Shuts down debugger session.
   */
}
