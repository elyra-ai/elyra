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

import { IDictionary } from '@elyra/services';
import { addIcon, refreshIcon } from '@jupyterlab/ui-components';
import {
  Box,
  ButtonGroup,
  ClickAwayListener,
  Button,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  styled
} from '@material-ui/core';
import React from 'react';

export const METADATA_HEADER_BUTTON_CLASS = 'elyra-metadataHeader-button';
export const METADATA_HEADER_POPPER_CLASS = 'elyra-metadataHeader-popper';

export interface IMetadataHeaderButtonsProps {
  schemas?: IDictionary<any>[];
  addMetadata: (schema: string, titleContext?: string) => void;
  titleContext?: string;
  appendToTitle?: boolean;
  refreshMetadata: () => void;
  refreshButtonTooltip?: string;
}

const StyledButton = styled(Button)({
  minWidth: 'auto'
});

export const MetadataHeaderButtons = (
  props: IMetadataHeaderButtonsProps
): React.ReactElement => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  let singleSchema = false;

  if (props.schemas?.length === 1) {
    singleSchema = true;
  }

  const handleToggle = (): void => {
    setOpen((prevOpen: boolean) => !prevOpen);
  };

  const sortedSchema = props.schemas?.sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  const handleClose = (event: React.MouseEvent<Document, MouseEvent>): void => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <Box>
      <ButtonGroup ref={anchorRef} variant="text">
        <StyledButton
          size="small"
          className={METADATA_HEADER_BUTTON_CLASS}
          onClick={(): void => {
            props.refreshMetadata();
            setOpen(false);
          }}
          title={props.refreshButtonTooltip ?? 'Refresh list'}
        >
          <refreshIcon.react tag="span" elementPosition="center" width="16px" />
        </StyledButton>
        <StyledButton
          size="small"
          className={METADATA_HEADER_BUTTON_CLASS}
          onClick={
            singleSchema
              ? (): void => props.addMetadata(props.schemas?.[0].name)
              : handleToggle
          }
          title={`Create new ${props.titleContext}`}
        >
          <addIcon.react tag="span" elementPosition="center" width="16px" />
        </StyledButton>
      </ButtonGroup>
      <Popper
        className={METADATA_HEADER_POPPER_CLASS}
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
      >
        <Paper>
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList id="split-button-menu">
              {sortedSchema?.map((schema: IDictionary<any>) => (
                <MenuItem
                  key={schema.title}
                  title={`New ${schema.title} ${
                    props.appendToTitle ? props.titleContext : ''
                  }`}
                  onClick={(event: any): void => {
                    props.addMetadata(schema.name, props.titleContext);
                    handleClose(event);
                  }}
                >
                  {`New ${schema.title} ${
                    props.appendToTitle ? props.titleContext : ''
                  }`}
                </MenuItem>
              ))}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </Box>
  );
};
