import { Field } from '@rjsf/core';
import React from 'react';
import { viewIcon, viewOffIcon } from '@elyra/ui-components';

export const PasswordField: Field = props => {
  const { StringField } = props.registry.fields;
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div>
      <label className="control-label">{props.schema.title}</label>
      {props.schema.description && (
        <p className="field-description">{props.schema.description}</p>
      )}
      <div style={{ display: 'flex' }}>
        <StringField
          {...props}
          uiSchema={{
            ...props.uiSchema,
            'ui:widget': showPassword ? undefined : 'password'
          }}
        />
        <button
          className="elyra-passwordFieldButton"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <viewOffIcon.react /> : <viewIcon.react />}
        </button>
      </div>
    </div>
  );
};
