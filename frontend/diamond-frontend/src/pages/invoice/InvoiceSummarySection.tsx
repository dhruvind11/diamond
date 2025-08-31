import { Box, Divider, TextField, Typography } from "@mui/material";
import SelectComponent from "../../components/SelectComponent";
import { FaRupeeSign } from "react-icons/fa";

const InvoiceSummarySection = ({
  broker,
  note,
  discount,
  tax,
  subTotal,
  handleSummaryChange,
  getBrokerOption,
  brokeragePercentage,
  errors,
}: any) => {
  const total = parseFloat(
    (subTotal - discount + (subTotal * tax) / 100).toFixed(2)
  );
  return (
    <Box className="mt-8">
      <Divider className="!my-6" />
      <Box className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
        <Box className="flex-1">
          <Box className="flex items-center mb-3">
            <Typography className="!font-semibold !mr-2">Broker:</Typography>
            <Box className="flex flex-col">
              <SelectComponent
                options={getBrokerOption()}
                name="broker"
                id="broker"
                value={broker}
                onChange={(option: any) =>
                  handleSummaryChange("broker", option)
                }
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
