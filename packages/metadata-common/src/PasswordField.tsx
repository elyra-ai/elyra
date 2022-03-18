import { Field } from '@rjsf/core';
import React from 'react';
import { viewIcon, viewOffIcon } from '@elyra/ui-components';

export const PasswordField: Field = props => {
  const { StringField } = props.registry.fields;
  const [showPassword, setShowPassword] = React.useState(false);
  const onChange = (e: any, es: any) => {
    console.log(e);
    props.onChange(e, es);
  };

  return (
    <div>
      <StringField
        {...props}
        uiSchema={{
          ...props.uiSchema,
          'ui:widget': showPassword ? undefined : 'password'
        }}
        onChange={onChange}
      />
      <button onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <viewOffIcon.react /> : <viewIcon.react />}
      </button>
    </div>
  );
};
