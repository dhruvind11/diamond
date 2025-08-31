import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import DatePickerComponent from "../../components/DatePickerComponent";
import { FaRupeeSign } from "react-icons/fa";
import dayjs from "dayjs";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (paymentData: any) => void;
  invoice: any;
}
const PaymentModel = ({
  open,
  onClose,
  onSave,
  invoice,
}: PaymentModalProps) => {
  const [paymentForm, setPaymentForm] = useState<any>({
    paymentDate: null,
    amount: "",
    note: "",
  });

  useEffect(() => {
    if (invoice) {
      setPaymentForm({
        paymentDate: dayjs(),
        amount: invoice?.totalAmount || "",
        note: "",
      });
    }
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm({
      ...paymentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (date: any, name: string) => {
    setPaymentForm((prev: any) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleSave = () => {
    onSave({
      ...paymentForm,
      invoiceId: invoice?._id,
    });
  };

  console.log("first");
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Make Payment</DialogTitle>
      <DialogContent dividers>
        <Box className="flex justify-between bg-gray-100 p-2 mb-4">
          <Box className="mb-0">Invoice Balance:</Box>
          <Box className="font-medium mb-0 flex items-center">
            <FaRupeeSign size={14} />
            {paymentForm?.amount}
          </Box>
        </Box>
        <Box className="flex flex-col gap-y-4 mt-2">
          <Box>Payment Date</Box>
          <DatePickerComponent
            name="paymentDate"
            value={paymentForm?.paymentDate}
            onChange={handleDateChange}
            width={"w-full"}
          />
          <Box>Amount</Box>
          <TextField
            type="number"
            name="amount"
            value={paymentForm.amount}
            onChange={handleChange}
            fullWidth
          />
          <Box>Payment Note</Box>
          <TextField
            name="note"
            value={paymentForm.note}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModel;
