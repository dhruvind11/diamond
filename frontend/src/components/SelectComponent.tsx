import { Autocomplete, TextField } from "@mui/material";

const SelectComponent = ({ options, onChange, value }: any) => {
  return (
    <Autocomplete
      size="small"
      disablePortal
      value={value}
      options={options?.filter((i: any) => !!i && i?.value !== value?.value)}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} />}
      onChange={(_, newValue) => onChange && onChange(newValue)}
      renderOption={(props, option: any) => {
        return (
          <li {...props} key={props?.id}>
            {option?.label ? option?.label : option}
          </li>
        );
      }}
    />
  );
};

export default SelectComponent;
