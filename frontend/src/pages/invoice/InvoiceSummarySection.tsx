import {
  Autocomplete,
  Box,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import SelectComponent from "../../components/SelectComponent";
import { FaRupeeSign, FaSpinner } from "react-icons/fa";
import { useAppSelector } from "../../store/store";

const InvoiceSummarySection = ({
  broker,
  note,
  discount,
  tax,
  subTotal,
  handleSummaryChange,
  handleInputSelectChange,
  getBrokerOption,
  formData,
  invoiceType,
  brokeragePercentage,
  errors,
}: any) => {
  const total = parseFloat(
    (subTotal - discount + (subTotal * tax) / 100).toFixed(2)
  );
  console.log("formData", formData);
  const { userDropdown } = useAppSelector((state) => state.user);
  console.log("userDropdown", userDropdown);
  const getOption = () => {
    const option =
      userDropdown?.length > 0
        ? userDropdown
            ?.filter((user: any) =>
              invoiceType === "sell"
                ? formData?.buyer?.value !== user?._id
                : formData?.seller?.value !== user?._id
            )
            ?.map((user: any) => {
              return {
                label: user?.username,
                value: user?._id,
                email: user?.email,
              };
            })
        : [];
    return option;
  };
  return (
    <Box className="mt-8">
      <Divider className="!my-6" />
      <Box className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
        <Box className="flex-1">
          <Box className="flex items-center mb-3">
            {/* <Box className="flex items-center gap-x-1.5 text-[#A54EB0]">
              {userSearchingLoader && <FaSpinner className="animate-spin" />}
              <Box className="text-sm font-semibold">
                {userSearchingMessage}
              </Box>
            </Box> */}
            <Typography className="!font-semibold !mr-2">Broker:</Typography>
            <Box className="w-1/2">
              {/* <SelectComponent
                options={getBrokerOption()}
                name="broker"
                id="broker"
                value={broker}
                onChange={(option: any) =>
                  handleSummaryChange("broker", option)
                }
              /> */}
              <Autocomplete
                className=" "
                freeSolo
                options={getOption()}
                id="broker"
                value={broker}
                onChange={(_, option: any) =>
                  handleSummaryChange("broker", option)
                }
                onInputChange={(_, value) => {
                  handleInputSelectChange(value);
                }}
                renderOption={(props, option: any) => {
                  return (
                    <li {...props} key={props.id}>
                      {option.label ? option?.label : option}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Please search"
                    className="!rounded-lg !px-1"
                    sx={{
                      "&.MuiTextField-root": {
                        border: "1px solid #d3d3d3",
                        "&:focus-within fieldset, &:focus-visible fieldset, & fieldset":
                          {
                            border: 0,
                            padding: 0,
                          },
                        "& .MuiInputBase-root": {
                          padding: 0,
                        },
                        "& .MuiOutlinedInput-root": {
                          "& input": {
                            color: "black",
                            paddingLeft: "10px",
                          },
                        },
                      },
                    }}
                  />
                )}
              />

              {errors.broker && (
                <span className="text-xs text-red-600">{errors.broker}</span>
              )}
            </Box>
          </Box>
          <Box className="flex items-center mb-3">
            <Typography className="!font-semibold !mr-2">
              Brokerage Percentage:
            </Typography>
            <TextField
              size="small"
              type="number"
              name="brokeragePercentage"
              sx={{ width: 180 }}
              value={brokeragePercentage}
              onChange={(e) =>
                handleSummaryChange(
                  "brokeragePercentage",
                  Number(e.target.value)
                )
              }
            />
          </Box>
        </Box>
        <Box className="!w-[18%] md:w-64 flex flex-col gap-1 text-right">
          <Box className="flex justify-between items-center">
            <span className="text-gray-500">Subtotal:</span>
            <span className="ml-2 font-bold flex items-center">
              <FaRupeeSign size={14} />
              {subTotal}
            </span>
          </Box>
          <Box className="flex justify-between items-center">
            <span className="text-gray-500 mr-2">Discount:</span>
            <Box>
              <TextField
                size="small"
                // type="number"
                value={discount}
                onChange={(e) =>
                  handleSummaryChange("discount", Number(e.target.value))
                }
                fullWidth
                className="!w-20"
              />
            </Box>
          </Box>
          {/* <Box className="flex justify-between items-center">
            <span className="text-gray-500 mr-2">Tax (%):</span>
            <TextField
              size="small"
              fullWidth
              // type="number"
              value={tax}
              onChange={(e) =>
                handleSummaryChange("tax", Number(e.target.value))
              }
              className="!w-20"
            />
          </Box> */}
          <Divider className="!my-2" />
          <Box className="flex justify-between items-center">
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-bold flex items-center">
              <FaRupeeSign size={14} />
              {total}
            </span>
          </Box>
        </Box>
      </Box>
      <Divider className="!my-6" />
      <Box>
        <Typography className="!font-semibold !mb-1">Note:</Typography>
        <TextField
          size="small"
          fullWidth
          value={note}
          multiline
          minRows={2}
          onChange={(e) => handleSummaryChange("note", e.target.value)}
        />
      </Box>
    </Box>
  );
};
export default InvoiceSummarySection;
