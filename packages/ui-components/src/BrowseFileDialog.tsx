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

import { Dialog } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import {
  BreadCrumbs,
  DirListing,
  FilterFileBrowserModel
} from '@jupyterlab/filebrowser';
import { Widget, PanelLayout } from '@lumino/widgets';

const BROWSE_FILE_CLASS = 'elyra-browseFileDialog';
const BROWSE_FILE_OPEN_CLASS = 'elyra-browseFileDialog-open';

export interface IBrowseFileDialogOptions {
  filter?: (model: any) => boolean;
  multiselect?: boolean;
  includeDir?: boolean;
  acceptFileOnDblClick?: boolean;
  rootPath?: string;
  startPath?: string;
}

interface IBrowseFileBreadCrumbsOptions extends BreadCrumbs.IOptions {
  rootPath?: string;
}

/**
 * Breadcrumbs widget for browse file dialog body.
 */
class BrowseFileDialogBreadcrumbs extends BreadCrumbs {
  model: any;
  rootPath?: string;

  constructor(options: IBrowseFileBreadCrumbsOptions) {
    super(options);
    this.model = options.model;
    this.rootPath = options.rootPath;
  }

  protected onUpdateRequest(msg: any): void {
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
class BrowseFileDialog
  extends Widget
  implements Dialog.IBodyWidget<IBrowseFileDialogOptions>
{
  directoryListing: DirListing;
  breadCrumbs: BreadCrumbs;
  dirListingHandleEvent: (event: Event) => void;
  multiselect: boolean;
  includeDir: boolean;
  acceptFileOnDblClick: boolean;
  model: FilterFileBrowserModel;

  constructor(props: any) {
    super(props);

    this.model = new FilterFileBrowserModel({
      manager: props.manager,
      filter: props.filter
    });

    const layout = (this.layout = new PanelLayout());

    this.directoryListing = new DirListing({
      model: this.model
    });

    this.acceptFileOnDblClick = props.acceptFileOnDblClick;
    this.multiselect = props.multiselect;
    this.includeDir = props.includeDir;
    this.dirListingHandleEvent = this.directoryListing.handleEvent;
    this.directoryListing.handleEvent = (event: Event): void => {
      this.handleEvent(event);
    };

    this.breadCrumbs = new BrowseFileDialogBreadcrumbs({
      model: this.model,
      rootPath: props.rootPath
    });

    layout.addWidget(this.breadCrumbs);
    layout.addWidget(this.directoryListing);
  }

  static async init(options: any): Promise<BrowseFileDialog> {
    const browseFileDialog = new BrowseFileDialog(options);
    if (options.startPath) {
      if (
        !options.rootPath ||
        options.startPath.indexOf(options.rootPath) === 0
      ) {
        await browseFileDialog.model.cd(options.startPath);
      }
    } else if (options.rootPath) {
      await browseFileDialog.model.cd(options.rootPath);
    }

    return browseFileDialog;
  }

  getValue(): any {
    const selected = [];

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
  manager: IDocumentManager,
  options: IBrowseFileDialogOptions
): Promise<Dialog.IResult<any>> => {
  const browseFileDialogBody = await BrowseFileDialog.init({
    manager: manager,
    filter: options.filter,
    multiselect: options.multiselect,
    includeDir: options.includeDir,
    rootPath: options.rootPath,
    startPath: options.startPath,
    acceptFileOnDblClick: Object.prototype.hasOwnProperty.call(
      options,
      'acceptFileOnDblClick'
    )
      ? options.acceptFileOnDblClick
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
    if (options.rootPath && result.button.accept && result.value?.length) {
      const relativeToPath = options.rootPath.endsWith('/')
        ? options.rootPath
        : options.rootPath + '/';
      result.value = result.value.map((val: string) => {
        return val.replace(relativeToPath, '');
      });
    }

    return result;
  });
};
