/*
 * Copyright 2018-2025 Elyra Authors
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

import { Dialog } from '@jupyterlab/apputils';
import {
  BreadCrumbs,
  DirListing,
  FileBrowserModel,
  FilterFileBrowserModel
} from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';
import { IScore } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Widget, PanelLayout } from '@lumino/widgets';

const BROWSE_FILE_CLASS = 'elyra-browseFileDialog';
const BROWSE_FILE_OPEN_CLASS = 'elyra-browseFileDialog-open';

export interface IBrowseFileDialogArgs {
  startPath?: string;
  rootPath?: string;
  acceptFileOnDblClick?: boolean;
  multiselect?: boolean;
  includeDir?: boolean;
  manager: FileBrowserModel['manager'];
  filter: (value: Contents.IModel) => Partial<IScore> | null;
}

interface IBrowseFileBreadCrumbsOptions extends BreadCrumbs.IOptions {
  rootPath?: string;
}

/**
 * Breadcrumbs widget for browse file dialog body.
 */
class BrowseFileDialogBreadcrumbs extends BreadCrumbs {
  model: FileBrowserModel;
  rootPath?: string;

  constructor(options: IBrowseFileBreadCrumbsOptions) {
    super(options);
    this.model = options.model;
    this.rootPath = options.rootPath;
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    const contents = this.model.manager.services.contents;
    const localPath = contents.localPath(this.model.path);

    // if 'rootPath' is defined prevent navigating to it's parent/grandparent directories
    if (localPath && this.rootPath && localPath.indexOf(this.rootPath) === 0) {
      const breadcrumbs = document.querySelectorAll(
        '.elyra-browseFileDialog .jp-BreadCrumbs > span[title]'
      );

      breadcrumbs.forEach((crumb: Element): void => {
        if (
          (crumb as HTMLSpanElement).title.indexOf(this.rootPath ?? '') === 0
        ) {
          crumb.className = crumb.className
            .replace('elyra-BreadCrumbs-disabled', '')
            .trim();
        } else if (
          crumb.className.indexOf('elyra-BreadCrumbs-disabled') === -1
        ) {
          crumb.className += ' elyra-BreadCrumbs-disabled';
        }
      });
    }
  }
}

/**
 * Browse file widget for dialog body
 */
class BrowseFileDialog extends Widget implements Dialog.IBodyWidget<string[]> {
  directoryListing: DirListing;
  breadCrumbs: BreadCrumbs;
  dirListingHandleEvent: (event: Event) => void;
  multiselect: boolean;
  includeDir: boolean;
  acceptFileOnDblClick: boolean;
  model: FilterFileBrowserModel;

  constructor(args: IBrowseFileDialogArgs) {
    super({});

    this.model = new FilterFileBrowserModel({
      manager: args.manager,
      filter: args.filter
    });

    const layout = (this.layout = new PanelLayout());

    this.directoryListing = new DirListing({
      model: this.model
    });

    this.acceptFileOnDblClick = !!args.acceptFileOnDblClick;
    this.multiselect = !!args.multiselect;
    this.includeDir = !!args.includeDir;
    this.dirListingHandleEvent = this.directoryListing.handleEvent;
    this.directoryListing.handleEvent = (event: Event): void => {
      this.handleEvent(event);
    };

    this.breadCrumbs = new BrowseFileDialogBreadcrumbs({
      model: this.model,
      rootPath: args.rootPath
    });

    layout.addWidget(this.breadCrumbs);
    layout.addWidget(this.directoryListing);
  }

  static async init(args: IBrowseFileDialogArgs): Promise<BrowseFileDialog> {
    const browseFileDialog = new BrowseFileDialog(args);
    if (args.startPath) {
      if (!args.rootPath || args.startPath.indexOf(args.rootPath) === 0) {
        await browseFileDialog.model.cd(args.startPath);
      }
    } else if (args.rootPath) {
      await browseFileDialog.model.cd(args.rootPath);
    }

    return browseFileDialog;
  }

  getValue(): string[] {
    const selected: string[] = [];

    for (const item of this.directoryListing.selectedItems()) {
      if (this.includeDir || item.type !== 'directory') {
        selected.push(item.path);
      }
    }

    return selected;
  }

  handleEvent(event: Event): void {
    let modifierKey = false;
    if (event instanceof MouseEvent) {
      modifierKey =
        (event as MouseEvent).shiftKey || (event as MouseEvent).metaKey;
    } else if (event instanceof KeyboardEvent) {
      modifierKey =
        (event as KeyboardEvent).shiftKey || (event as KeyboardEvent).metaKey;
    }

    switch (event.type) {
      case 'keydown':
      case 'keyup':
      case 'mousedown':
      case 'mouseup':
      case 'click':
        if (this.multiselect || !modifierKey) {
          this.dirListingHandleEvent.call(this.directoryListing, event);
        }
        break;
      case 'dblclick': {
        const clickedItem = this.directoryListing.modelForClick(
          event as MouseEvent
        );
        if (clickedItem?.type === 'directory') {
          this.dirListingHandleEvent.call(this.directoryListing, event);
        } else {
          event.preventDefault();
          event.stopPropagation();
          if (this.acceptFileOnDblClick) {
            const okButton = document.querySelector(
              `.${BROWSE_FILE_OPEN_CLASS} .jp-mod-accept`
            );
            if (okButton) {
              (okButton as HTMLButtonElement).click();
            }
          }
        }
        break;
      }
      default:
        this.dirListingHandleEvent.call(this.directoryListing, event);
        break;
    }
  }
}

export const showBrowseFileDialog = async (
  args: IBrowseFileDialogArgs
): Promise<Dialog.IResult<string[]>> => {
  const browseFileDialogBody = await BrowseFileDialog.init({
    ...args,
    acceptFileOnDblClick: Object.prototype.hasOwnProperty.call(
      args,
      'acceptFileOnDblClick'
    )
      ? args.acceptFileOnDblClick
      : true
  });

  const dialog = new Dialog({
    title: 'Select a file',
    body: browseFileDialogBody,
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Select' })]
  });

  dialog.addClass(BROWSE_FILE_CLASS);
  document.body.className += ` ${BROWSE_FILE_OPEN_CLASS}`;

  return dialog.launch().then((result: Dialog.IResult<string[]>) => {
    document.body.className = document.body.className
      .replace(BROWSE_FILE_OPEN_CLASS, '')
      .trim();
    if (args.rootPath && result.button.accept && result.value?.length) {
      const relativeToPath = args.rootPath.endsWith('/')
        ? args.rootPath
        : args.rootPath + '/';
      result.value = result.value.map((val: string) => {
        return val.replace(relativeToPath, '');
      });
    }

    return result;
  });
};
