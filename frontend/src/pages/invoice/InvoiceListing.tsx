import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { deleteInvoice, getInvoice } from "../../store/invoice/invoiceSlice";
import { MdDelete } from "react-icons/md";
import { Visibility, Payment } from "@mui/icons-material";
import PaymentModel from "./PaymentModel";
import DeletePopupMessage from "../../components/DeletePopupMessage";
import { FaSpinner } from "react-icons/fa";
import ClosePaymentPopupMessage from "../../components/ClosePaymentPopupMessage";

const InvoiceListing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [confirmation, setConfirmation] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>("");
  const [closeOpen, setCloseOpen] = useState(false);
  const { user } = useAppSelector((state: any) => state.auth);
  const { loading, invoiceData } = useAppSelector(
    (state: any) => state.invoice
  );
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const invoiceDetails = [
    "Invoice No",
    "Bill Status",
    "Invoice Type",
    "Party",
    "Total",
    "Due Amount",
    "Issued Date",
    "Payment Status",
    "Action",
  ];

  const handleOpenPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setOpenPaymentModal(true);
  };

  const handleClosePayment = () => {
    setOpenPaymentModal(false);
    setSelectedInvoice(null);
  };

  useEffect(() => {
    if (user?.companyId) {
      dispatch(getInvoice({ companyId: user.companyId }));
    }
  }, [user]);

  const handleDeleteClick = (invoiceId: string) => {
    setSelectedUserId(invoiceId);
    setConfirmation(true);
  };

  const handleDelete = async () => {
    if (selectedUserId) {
      await dispatch(deleteInvoice({ invoiceId: selectedUserId }));
    }
    setConfirmation(false);
    setSelectedUserId("");
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h5" fontWeight="bold">
          📑 Invoice Listing
        </Typography>
        <Box className="flex gap-x-2">
          {loading && <FaSpinner className="animate-spin text-blue-500" />}
          <Button
            size="small"
            variant="contained"
            sx={{
              background: "linear-gradient(45deg, #6a11cb, #2575fc)",
              borderRadius: "8px",
              textTransform: "capitalize",
              fontWeight: "bold",
            }}
            onClick={() =>
              navigate("/add-invoice", { state: { invoiceType: "sell" } })
            }
          >
            Sell Invoice
          </Button>
          <Button
            size="small"
            variant="contained"
            sx={{
              background: "linear-gradient(45deg, #ff6a00, #ee0979)",
              borderRadius: "8px",
              textTransform: "capitalize",
              fontWeight: "bold",
            }}
            onClick={() =>
              navigate("/add-invoice", { state: { invoiceType: "buy" } })
            }
          >
            Buy Invoice
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <TableContainer sx={{ maxHeight: 500 }}>
          {loading ? (
            <Box className="h-[550px] flex justify-center items-center">
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {invoiceDetails.map((item, index) => (
                    <TableCell
                      key={index}
                      sx={{ fontWeight: "bold", background: "#f9fafb" }}
                    >
                      {item}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData?.length > 0 ? (
                  invoiceData.map((row: any, rowIndex: number) => (
                    <TableRow
                      key={rowIndex}
                      hover
                      sx={{
                        transition: "all 0.2s",
                        "&:hover": { backgroundColor: "#f5faff" },
                      }}
                    >
                      <TableCell>{row?.invoiceNo}</TableCell>
                      <TableCell>
                        <Chip
                          label={row?.billStatus}
                          color={
                            row?.billStatus === "In Progress"
                              ? "primary"
                              : "warning"
                          }
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row?.invoiceType}
                          color={
                            row?.invoiceType === "sell" ? "success" : "info"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row?.invoiceType === "sell"
                          ? row?.buyerId?.username
                          : row?.sellerId?.username}
                      </TableCell>
                      <TableCell>₹{row?.totalAmount}</TableCell>
                      <TableCell>₹{row?.dueAmount}</TableCell>
                      <TableCell>
                        {
                          new Date(row?.createdDate)
                            ?.toISOString()
                            .split("T")[0]
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row?.paymentStatus}
                          color={
                            row?.paymentStatus === "Paid" ? "success" : "error"
                          }
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box className="flex items-center gap-x-2">
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            startIcon={<Payment />}
                            onClick={() => handleOpenPayment(row)}
                            disabled={row?.dueAmount === 0}
                          >
                            Pay
                          </Button>
                          {row.dueAmount > 0 && (
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => {
                                setSelectedInvoice(row);
                                setCloseOpen(true);
                              }}
                            >
                              Close Payment
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() =>
                              navigate(`/preview-invoice/${row?._id}`)
                            }
                          >
                            View
                          </Button>
                          <MdDelete
                            size={22}
                            fill="#d10000"
                            className="cursor-pointer"
                            onClick={() => handleDeleteClick(row?._id)}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={invoiceDetails.length}>
                      <Box className="flex items-center justify-center h-[30vh] text-gray-500 font-medium">
                        No Data Found
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      <PaymentModel
        open={openPaymentModal}
        setOpen={setOpenPaymentModal}
        onClose={handleClosePayment}
        invoice={selectedInvoice}
      />

      {confirmation && (
        <DeletePopupMessage
          open={confirmation}
          setOpen={setConfirmation}
          paramId={selectedUserId}
          removeAction={handleDelete}
        />
      )}

      {closeOpen && (
        <ClosePaymentPopupMessage
          open={closeOpen}
          setOpen={setCloseOpen}
          invoice={selectedInvoice}
        />
      )}
    </Box>
  );
};

export default InvoiceListing;
