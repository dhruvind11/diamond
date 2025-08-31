import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FaRegEdit, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { deleteInvoice, getInvoice } from "../../store/invoice/invoiceSlice";
import { MdDelete, MdPreview } from "react-icons/md";
import PaymentModel from "./PaymentModel";
import DeletePopupMessage from "../../components/DeletePopupMessage";
import { Visibility } from "@mui/icons-material";

const InvoiceListing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [confirmation, setConfirmation] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>("");
  const { user } = useAppSelector((state: any) => state.auth);
  const { loading, invoiceData } = useAppSelector(
    (state: any) => state.invoice
  );
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: "",
    amount: "",
    note: "",
  });
  console.log("invoiceData", invoiceData);
  const invoiceDetails = [
    "Invoice No",
    "Bill Status",
    "Invoice Type",
    "Party",
    "Total",
    "Issued Date",
    "Payment Status",
    "Action",
  ];
  console.log("invoiceData", invoiceData);

  const handleOpenPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      paymentDate: new Date().toISOString().split("T")[0], // default today
      amount: invoice?.totalAmount || "",
      note: "",
    });
    setOpenPaymentModal(true);
  };

  // Handle close modal
  const handleClosePayment = () => {
    setOpenPaymentModal(false);
    setSelectedInvoice(null);
  };
  useEffect(() => {
    if (user?.companyId) {
      dispatch(getInvoice({ companyId: user.companyId }));
    }
  }, [user]);

  // Handle save
  const handleSavePayment = () => {
    console.log("Saving Payment:", {
      ...paymentForm,
      invoiceId: selectedInvoice?._id,
    });

    // 🚀 Dispatch API call here (e.g., addPaymentAction)
    // dispatch(addPayment({ invoiceId: selectedInvoice._id, ...paymentForm }));

    handleClosePayment();
  };

  const handleDeleteClick = (invoiceId: string) => {
    setSelectedUserId(invoiceId);
    setConfirmation(true);
  };

  const handleDelete = async () => {
    if (selectedUserId) {
      await dispatch(deleteInvoice({ invoiceId: selectedUserId }));
      // setTimeout(() => {
      //   dispatch(resetMessage());
      // }, 1500);
    }
    setConfirmation(false);
    setSelectedUserId("");
  };
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Box className="flex justify-between">
        <Box className="text-2xl font-semibold">Invoice Lisitng</Box>
        <Box className="flex gap-x-2">
          <Box className="flex items-center">
            {loading && <FaSpinner className="animate-spin" />}
            {/* <Box className="text-sm font-semibold">{message}</Box> */}
          </Box>

          <Button
            size="small"
            variant="contained"
            className="!bg-[#3a2ae2b3] !text-xs !rounded-md !py-1.5 !capitalize"
            onClick={() =>
              navigate("/add-invoice", { state: { invoiceType: "sell" } })
            }
          >
            Sell Invoice
          </Button>
          <Button
            size="small"
            variant="contained"
            className="!bg-[#3a2ae2b3] !text-xs !rounded-md !py-1.5 !capitalize"
            onClick={() =>
              navigate("/add-invoice", { state: { invoiceType: "buy" } })
            }
          >
            Buy Invoice
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden" }} className="mt-4">
        <TableContainer sx={{ maxHeight: 440 }}>
          {loading ? (
            <Box className="h-[550px] flex justify-center items-center">
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {invoiceDetails?.map((item, index) => (
                    <TableCell key={index}>
                      <Box
                        className={`flex items-center font-semibold gap-x-1.5`}
                      >
                        {item}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData?.length > 0 ? (
                  invoiceData?.map((row: any, rowIndex: number) => (
                    <TableRow key={rowIndex} hover>
                      <TableCell className=" ">{row?.invoiceNo}</TableCell>
                      <TableCell className="">{row?.billStatus}</TableCell>
                      <TableCell className="">{row?.invoiceType}</TableCell>
                      <TableCell className="">
                        {row?.invoiceType === "sell"
                          ? row?.buyerId?.username
                          : row?.sellerId?.username}
                      </TableCell>

                      <TableCell className="">{row?.totalAmount}</TableCell>
                      <TableCell className="">
                        {new Date(row?.createdDate).toISOString().split("T")[0]}
                      </TableCell>
                      <TableCell className="">{row?.paymentStatus}</TableCell>
                      <TableCell>
                        <Box className="flex items-center gap-x-2">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenPayment(row)}
                          >
                            Payment
                          </Button>
                          <Box className="cursor-pointer">
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
                          </Box>
                          {/* <Box className="cursor-pointer">
                            <FaRegEdit
                              fill="green"
                              size={18}
                              //   onClick={() => {
                              //     dispatch(getSingleUser(row));
                              //     setOpenEditModal(true);
                              //   }}
                            />
                          </Box> */}
                          <Box className="cursor-pointer">
                            <MdDelete
                              size={20}
                              fill="#d10000"
                              onClick={() => handleDeleteClick(row?._id)}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={invoiceData?.length}>
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
        onClose={handleClosePayment}
        onSave={handleSavePayment}
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
    </Box>
  );
};

export default InvoiceListing;
