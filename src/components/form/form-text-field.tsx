import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { TextField } from '@/components/ui';

type Props<T extends FieldValues, TTransformed> = Omit<
  ComponentProps<typeof TextField>,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  // The parsed output may differ from the text inputs (e.g. prices parsed to numbers).
  control: Control<T, any, TTransformed>;
  name: Path<T>;
};

/** TextField connected to React Hook Form; shows the field's validation message. */
export function FormTextField<T extends FieldValues, TTransformed = T>({
  control,
  name,
  ...props
}: Props<T, TTransformed>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
