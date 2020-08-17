/*
 * Copyright 2018-2020 IBM Corporation
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
}

/**
 * Browse file widget for dialog body
 */
export class BrowseFileDialog extends Widget
  implements Dialog.IBodyWidget<IBrowseFileDialogOptions> {
  directoryListing: DirListing;
  breadCrumbs: BreadCrumbs;
  dirListingHandleEvent: (event: Event) => void;
  multiselect: boolean;
  includeDir: boolean;
  acceptFileOnDblClick: boolean;

  constructor(props: any) {
    super(props);

    const model = new FilterFileBrowserModel({
      manager: props.manager,
      filter: props.filter
    });

    const layout = (this.layout = new PanelLayout());

    this.directoryListing = new DirListing({
      model: model
    });

    this.acceptFileOnDblClick = props.acceptFileOnDblClick;
    this.multiselect = props.multiselect;
    this.includeDir = props.includeDir;
    this.dirListingHandleEvent = this.directoryListing.handleEvent;
    this.directoryListing.handleEvent = (event: Event): void => {
      this.handleEvent(event);
    };

    this.breadCrumbs = new BreadCrumbs({
      model: model
    });

    layout.addWidget(this.breadCrumbs);
    layout.addWidget(this.directoryListing);
  }

  getValue(): any {
    const itemsIter = this.directoryListing.selectedItems();
    const selected = [];
    let item = null;

    while ((item = itemsIter.next()) !== undefined) {
      if (this.includeDir || item.type !== 'directory') {
        selected.push(item);
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
        if (clickedItem.type === 'directory') {
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

export const showBrowseFileDialog = (
  manager: IDocumentManager,
  options: IBrowseFileDialogOptions
): Promise<Dialog.IResult<any>> => {
  const dialog = new Dialog({
    title: 'Select a file',
    body: new BrowseFileDialog({
      manager: manager,
      filter: options.filter,
      multiselect: options.multiselect,
      includeDir: options.includeDir,
      acceptFileOnDblClick: Object.prototype.hasOwnProperty.call(
        options,
        'acceptFileOnDblClick'
      )
        ? options.acceptFileOnDblClick
        : true
    }),
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Select' })]
  });

  dialog.addClass(BROWSE_FILE_CLASS);
  document.body.className += ` ${BROWSE_FILE_OPEN_CLASS}`;

  return dialog.launch().then((result: any) => {
    document.body.className = document.body.className
      .replace(BROWSE_FILE_OPEN_CLASS, '')
      .trim();
    return result;
  });
};
