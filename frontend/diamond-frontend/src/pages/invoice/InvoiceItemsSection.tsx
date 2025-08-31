import { Box, Button, TextField } from "@mui/material";
import { FiPlus } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";

const InvoiceItemsSection = ({
  items,
  handleItemChange,
  handleAddItem,
  handleRemoveItem,
  errors,
}: any) => {
  return (
    <Box className="mt-8">
      <Box className="grid grid-cols-12 gap-x-4 font-semibold text-gray-500 px-2 py-2 border-b">
        <div className="col-span-6">Item</div>
        <div className="col-span-2">Cost</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Price</div>
      </Box>
      {items?.map((item: any, idx: any) => (
        <Box
          key={idx}
          className="!relative grid grid-cols-12 gap-x-4 items-start px-2 py-4 border border-gray-400 bg-white rounded-md my-3 shadow"
        >
          <div className="col-span-6 flex flex-col gap-2">
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="name"
              value={item.name}
              onChange={(e) => handleItemChange(idx, "name", e.target.value)}
              error={!!errors[idx]?.name}
              helperText={errors[idx]?.name}
            />
            {}
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="description"
              value={item.description}
              onChange={(e) =>
                handleItemChange(idx, "description", e.target.value)
              }
              multiline
              minRows={3}
              error={!!errors[idx]?.description}
              helperText={errors[idx]?.description}
            />
          </div>

          <div className="col-span-2">
            <TextField
              size="small"
              value={item.cost}
              placeholder="Cost"
              onChange={(e) =>
                handleItemChange(
                  idx,
                  "cost",
                  e.target.value.replace(/[^0-9.]/g, "")
                )
              }
              error={!!errors[idx]?.cost}
              helperText={errors[idx]?.cost}
            />
          </div>

          <div className="col-span-2">
            <TextField
              size="small"
              value={item.qty}
              placeholder="Qty"
              onChange={(e) =>
                handleItemChange(
                  idx,
                  "qty",
                  e.target.value.replace(/[^0-9]/g, "")
                )
              }
              error={!!errors[idx]?.qty}
              helperText={errors[idx]?.qty}
            />
          </div>

          <div className="col-span-2 flex items-center">
            {item?.price || "0.00"}
          </div>

          <Box
            className="absolute -top-2.5 -right-2 z-10"
            onClick={() => handleRemoveItem(idx)}
          >
            <IoCloseCircle className="text-gray-400 cursor-pointer" />
          </Box>
        </Box>
      ))}

      <Button
        variant="contained"
        color="primary"
        size="small"
        startIcon={<FiPlus />}
        className="!bg-violet-500 !text-white !normal-case !mt-3"
        onClick={handleAddItem}
      >
        Add Item
      </Button>
    </Box>
  );
};

export default InvoiceItemsSection;
