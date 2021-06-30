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

import { IDictionary } from '@elyra/services';
import { addIcon } from '@jupyterlab/ui-components';
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

const StyledButton = styled(Button)({
  minWidth: 'auto'
});

const CreateButton: React.FC<any> = props => {
  return (
    <StyledButton
      size="small"
      className="elyra-metadataHeader-button"
      {...props}
    >
      <addIcon.react tag="span" elementPosition="center" width="16px" />
    </StyledButton>
  );
};

interface IProps {
  schemas?: IDictionary<any>[];
  // Optional string to append to the schema display name
  schemaType?: string;
  addMetadata: (schema: string) => void;
}

export const AddMetadataButton: React.FC<IProps> = ({
  schemas,
  addMetadata,
  schemaType
}) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const handleToggle = (): void => {
    setOpen((prevOpen: boolean) => !prevOpen);
  };

  const handleClose = (
    event: React.MouseEvent<HTMLElement | Document>
  ): void => {
    if (anchorRef.current?.contains(event.target as Node)) {
      return;
    }

    setOpen(false);
  };

  const singleSchema = schemas?.length === 1;

  return (
    <Box>
      <ButtonGroup ref={anchorRef} variant="text">
        {singleSchema ? (
          <CreateButton
            onClick={(): void => addMetadata(schemas?.[0].name)}
            title={`Create new ${schemas?.[0].display_name}`}
          />
        ) : (
          <CreateButton
            onClick={handleToggle}
            title={`Create new ${schemas?.[0].namespace}`}
          />
        )}
      </ButtonGroup>
      <Popper
        className="elyra-metadataHeader-popper"
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
      >
        <Paper>
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList id="split-button-menu">
              {schemas?.map(schema => {
                const title = `New ${schema.display_name} ${schemaType ?? ''}`;
                return (
                  <MenuItem
                    key={schema.display_name}
                    title={title}
                    onClick={(event): void => {
                      addMetadata(schema.name);
                      handleClose(event);
                    }}
                  >
                    {title}
                  </MenuItem>
                );
              })}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </Box>
  );
};
