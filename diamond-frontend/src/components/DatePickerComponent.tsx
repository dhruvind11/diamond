import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const DatePickerComponent = ({ name, value, onChange, width }: any) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        onChange={(date) => {
          onChange(date, name);
        }}
        slotProps={{
          popper: {
            sx: { zIndex: 1350 },
          },
          field: {
            clearable: true,
          },
          textField: {
            size: "small",
            inputProps: {
              className: "text-[15px] rounded-lg px-2 py-1 focus:outline-none",
            },
          },
        }}
        className={`${width || "!w-48"}`}
      />
    </LocalizationProvider>
  );
};

export default DatePickerComponent;
