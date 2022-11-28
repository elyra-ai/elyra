import React from 'react';

export interface IParameterProps {
  parameters?: {
    name: string;
    default_value?: {
      type: 'String' | 'Integer' | 'Float' | 'Bool';
      value: any;
    };
    type?: string;
    required?: boolean;
  }[];
}

export const ParameterInputForm: React.FC<IParameterProps> = ({
  parameters
}) => {
  return parameters ? (
    <div>
      <label
        style={{
          fontWeight: '600',
          fontSize: 'var(--jp-content-font-size1)'
        }}
      >
        Parameters
      </label>
      {parameters.map(param => {
        if (!param.name) {
          return undefined;
        }
        let type = 'text';
        switch (param.default_value?.type) {
          case 'Bool':
            type = 'checkbox';
            break;
          case 'Float':
          case 'Integer':
            type = 'number';
            break;
        }
        if (type === 'checkbox') {
          return (
            <div key={param.name}>
              <input
                id={`${param.name}-paramInput`}
                name={`${param.name}-paramInput`}
                defaultValue={param.default_value?.value}
                data-form-required={param.required}
                type="checkbox"
              />
              <label htmlFor={`${param.name}-paramInput`}>{param.name}</label>
              <br />
              <br />
            </div>
          );
        }
        return (
          <div key={param.name}>
            <label htmlFor={`${param.name}-paramInput`}>{param.name}:</label>
            <br />
            <input
              id={`${param.name}-paramInput`}
              name={`${param.name}-paramInput`}
              type={type}
              defaultValue={param.default_value?.value}
              data-form-required={param.required === true ? true : undefined}
            />
            <br />
            <br />
          </div>
        );
      })}
    </div>
  ) : (
    <div />
  );
};
