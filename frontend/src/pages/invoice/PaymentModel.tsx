import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import DatePickerComponent from "../../components/DatePickerComponent";
import { FaRupeeSign } from "react-icons/fa";
import dayjs from "dayjs";
import { useAppDispatch } from "../../store/store";
import { makePayment } from "../../store/invoice/invoiceSlice";

interface PaymentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  invoice: any;
}
const PaymentModel = ({
  open,
  setOpen,
  onClose,
  invoice,
}: PaymentModalProps) => {
  const [paymentForm, setPaymentForm] = useState<any>({
    createdDate: null,
    amount: "",
    description: "",
  });
  const [error, setError] = useState<string>("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (invoice) {
      setPaymentForm({
        createdDate: dayjs(),
        amount: invoice?.dueAmount || "",
        // note: "",
      });
    }
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm({
      ...paymentForm,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleDateChange = (date: any, name: string) => {
    setPaymentForm((prev: any) => ({
      ...prev,
      [name]: date,
    }));
    setError("");
  };

  const validateForm = () => {
    const enteredAmount = Number(paymentForm.amount);
    const dueAmount = Number(invoice?.dueAmount || 0);

    if (!enteredAmount) {
      setError("Amount is required");
      return false;
    }
    if (enteredAmount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }
    if (enteredAmount > dueAmount) {
      setError("Amount cannot exceed due balance");
      return false;
    }
    return true;
  };
  const handleSave = () => {
    if (!validateForm()) return;

    console.log("paymentForm", paymentForm);
    if (invoice?._id) {
      dispatch(
        makePayment({
          invoiceId: invoice?._id,
          paymentData: paymentForm,
        })
      );
    }
    setOpen(false);
  };

  console.log("invoice", invoice);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {invoice?.invoiceType === "buy" ? "Make" : "Receive"} Payment
      </DialogTitle>
      <DialogContent dividers>
        <Box className="flex justify-between bg-gray-100 p-2 mb-4">
          <Box className="mb-0">Due Invoice Balance:</Box>
          <Box className="font-medium mb-0 flex items-center">
            <FaRupeeSign size={14} />
            {invoice?.dueAmount || 0}
          </Box>
        </Box>
        <Box className="flex flex-col gap-y-4 mt-2">
          <Box>Payment Date</Box>
          <DatePickerComponent
            name="createdDate"
            value={paymentForm?.createdDate}
            onChange={handleDateChange}
            width={"w-full"}
          />
          <Box>Amount</Box>
          <TextField
            type="number"
            name="amount"
            value={paymentForm?.amount}
            onChange={handleChange}
            fullWidth
            error={!!error}
            helperText={error}
          />
          <Box>Payment Note</Box>
          <TextField
            name="description"
            value={paymentForm.description}
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
