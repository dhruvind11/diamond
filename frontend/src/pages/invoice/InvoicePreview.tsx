import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../store/store";
import logoImage from "../../../public/eco-5465482_1280.webp";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInvoiceById } from "../../store/invoice/invoiceSlice";
import { Payment } from "@mui/icons-material";
import PaymentModel from "./PaymentModel";
import ClosePaymentPopupMessage from "../../components/ClosePaymentPopupMessage";

export default function InvoicePreview() {
  const { company } = useAppSelector((state) => state.auth);
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const { loading, singleInvoiceData } = useAppSelector(
    (state: any) => state.invoice
  );

  useEffect(() => {
    if (id) {
      dispatch(getInvoiceById({ invoiceId: id }));
    }
  }, [id]);

  console.log("first singleInvoiceData", singleInvoiceData);
  const handleOpenPayment = () => {
    setOpenPaymentModal(true);
  };
  const handleClosePayment = () => {
    setOpenPaymentModal(false);
  };
  return (
    <Box className="w-full bg-gray-50 flex flex-col items-center py-6 h-screen">
      {loading ? (
        <Box className="h-[550px] flex justify-center items-center">
          <CircularProgress />
        </Box>
      ) : (
        <Box className="flex gap-6 w-full max-w-6xl">
          <Card className="flex-1 p-8 rounded-xl shadow-sm !bg-white">
            <Box className="bg-gray-100 rounded-lg p-6 flex justify-between items-start mb-6">
              <Box className="flex items-center gap-4 w-[75%]">
                <Box className="bg-white rounded-md flex items-center justify-center w-16 h-16 shadow">
                  <img
                    src={logoImage}
                    alt="Company Logo"
                    className="w-12 h-12 object-contain"
                    loading="lazy"
                  />
                </Box>
                <Box className="w-1/2">
                  <Box className="text-2xl font-semibold">
                    {company?.companyName}
                  </Box>
                  <Box className="text-gray-600 whitespace-break-spaces text-base mt-2">
                    {company?.address}
                    <br />
                    {company?.phone}
                  </Box>
                </Box>
              </Box>
              <Box className="flex flex-col gap-3 w-[25%]">
                <Box className="flex items-center gap-x-2">
                  <span className="text-gray-500">Invoice:</span>
                  <span className="text-gray-500 font-semibold">
                    {`#${singleInvoiceData?.invoiceNo}`}
                  </span>
                </Box>
                <Box className="flex items-center gap-x-2">
                  <span className="text-gray-500">Bill Number:</span>
                  <span className="text-gray-500 font-semibold">
                    {singleInvoiceData?.billNo}
                  </span>
                </Box>
                <Box className="flex items-center gap-x-2">
                  <span className="text-gray-500">Date Issued:</span>
                  <span className="text-gray-500 font-semibold">
                    {singleInvoiceData?.createdAt
                      ? new Date(singleInvoiceData.createdAt)
                          .toISOString()
                          .split("T")[0]
                      : ""}
                  </span>
                </Box>
                <Box className="flex items-center gap-x-2">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="text-gray-500 font-semibold">
                    {singleInvoiceData?.dueDate
                      ? new Date(singleInvoiceData.dueDate)
                          .toISOString()
                          .split("T")[0]
                      : ""}
                  </span>
                </Box>
              </Box>
            </Box>
            <Box className="">
              {singleInvoiceData?.invoiceType !== "sell" && (
                <Box className="">
                  <Box className="!font-semibold !mb-1 text-gray-500">
                    Seller:
                  </Box>
                  <Box className="text-gray-800">
                    {singleInvoiceData?.sellerId?.username}
                  </Box>
                  <Box className="text-gray-600 text-sm">
                    {singleInvoiceData?.sellerId?.email}
                  </Box>
                </Box>
              )}

              <Box className="">
                {singleInvoiceData?.invoiceType !== "buy" && (
                  <>
                    <Box className="!font-semibold !mb-1 text-gray-500">
                      Buyer:
                    </Box>
                    <Box className="text-gray-800">
                      {singleInvoiceData?.buyerId?.username}
                    </Box>
                    <Box className="text-gray-600 text-sm">
                      {singleInvoiceData?.buyerId?.email}
                    </Box>
                  </>
                )}
              </Box>
            </Box>
            <TableContainer
              component={Paper}
              elevation={0}
              className="rounded-xl border border-gray-200 !mt-8"
            >
              <Table aria-label="invoice items">
                <TableHead>
                  <TableRow className="bg-white">
                    <TableCell className="text-gray-600 font-medium">
                      Item
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      Description
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      Cost
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      Qty
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      Price
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {singleInvoiceData?.items?.map((it: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="text-gray-800">
                        {it?.itemName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {it?.itemDescription}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {it?.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {it?.quantity}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {it?.price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="caption" className="sr-only">
                Invoice items list
              </Typography>
            </TableContainer>

            <Box className="mt-8">
              <Divider className="!my-6" />
              <Box className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
                <Box className="flex-1">
                  {/* Broker info */}
                  <Box className="flex items-center mb-3">
                    <Typography className="!font-semibold !mr-2 text-gray-500">
                      Broker:
                    </Typography>
                    <Box className="flex flex-col">
                      <span className="text-gray-800">
                        {singleInvoiceData?.brokerId?.username}
                      </span>
                    </Box>
                  </Box>

                  <Box className="flex items-center mb-3">
                    <Typography className="!font-semibold !mr-2 text-gray-500">
                      Brokerage Percentage:
                    </Typography>
                    <span className="text-gray-800">
                      {singleInvoiceData?.brokeragePercentage}%
                    </span>
                  </Box>

                  <Box className="flex items-center mb-3">
                    <Typography className="!font-semibold !mr-2 text-gray-500">
                      Brokerage Amount:
                    </Typography>
                    <span className="text-gray-800">
                      {singleInvoiceData?.brokerageAmount?.toFixed(2)}
                    </span>
                  </Box>
                </Box>

                <Box className="!w-[18%] md:w-64 flex flex-col gap-1 text-right">
                  <Box className="flex justify-between items-center">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="text-gray-800">
                      {singleInvoiceData?.subTotal?.toFixed(2)}
                    </span>
                  </Box>
                  <Box className="flex justify-between items-center">
                    <span className="text-gray-500 mr-2">Discount:</span>
                    <span className="text-gray-800">
                      {singleInvoiceData?.discount?.toFixed(2)}
                    </span>
                  </Box>
                  <Divider className="!my-2" />
                  <Box className="flex justify-between items-center">
                    <span className="text-gray-500">Total:</span>
                    <span className="text-gray-800 font-semibold">
                      {singleInvoiceData?.totalAmount?.toFixed(2)}
                    </span>
                  </Box>
                </Box>
              </Box>
              <Divider className="!my-6" />
              <Box>
                <Typography className="!font-semibold !mb-1 text-gray-500">
                  Note:
                </Typography>
                <Typography className="text-gray-600 text-sm">
                  {singleInvoiceData?.note || "—"}
                </Typography>
              </Box>
            </Box>

            <Box className="mt-8">
              <Divider className="!my-6" />
              <Typography className="!text-gray-500 !font-semibold mb-4">
                Payments
              </Typography>

              <TableContainer
                component={Paper}
                elevation={0}
                className="rounded-xl border border-gray-200"
              >
                <Table aria-label="payments table">
                  <TableHead>
                    <TableRow className="bg-white">
                      <TableCell className="text-gray-600 font-medium">
                        Date
                      </TableCell>

                      <TableCell className="text-gray-600 font-medium">
                        Type
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        Amount
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {singleInvoiceData?.payments?.length > 0 ? (
                      singleInvoiceData.payments.map((p: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="text-gray-700">
                            {
                              new Date(p.createdDate)
                                .toISOString()
                                .split("T")[0]
                            }
                          </TableCell>

                          <TableCell className="text-gray-600">
                            {p.type}
                          </TableCell>
                          <TableCell className="text-gray-800 font-medium">
                            ₹{p.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {p.description}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-gray-500 py-6"
                        >
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className="flex justify-end gap-x-2 mt-4">
              <Button
                size="small"
                variant="contained"
                color="info"
                startIcon={<Payment />}
                onClick={() => setOpenPaymentModal(true)}
                // disabled={row?.dueAmount === 0}
              >
                Pay
              </Button>
              {/* {row.dueAmount > 0 && ( */}
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setCloseOpen(true);
                }}
              >
                Close Payment
              </Button>
              {/* )} */}
            </Box>
          </Card>
        </Box>
      )}
      <PaymentModel
        open={openPaymentModal}
        setOpen={setOpenPaymentModal}
        onClose={handleClosePayment}
        invoice={singleInvoiceData}
      />

      {closeOpen && (
        <ClosePaymentPopupMessage
          open={closeOpen}
          setOpen={setCloseOpen}
          invoice={singleInvoiceData}
        />
      )}
    </Box>
  );
}
