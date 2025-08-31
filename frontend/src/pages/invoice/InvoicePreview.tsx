"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
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
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getInvoiceById } from "../../store/invoice/invoiceSlice";

export default function InvoicePreview() {
  const { company } = useAppSelector((state) => state.auth);
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { loading, singleInvoiceData } = useAppSelector(
    (state: any) => state.invoice
  );

  useEffect(() => {
    if (id) {
      dispatch(getInvoiceById({ invoiceId: id }));
    }
  }, [id]);

  console.log("first singleInvoiceData", singleInvoiceData);
  return (
    <Box className="w-full bg-gray-50 flex flex-col items-center py-6">
      {loading ? (
        <Box className="h-[550px] flex justify-center items-center">
          <CircularProgress />
        </Box>
      ) : (
        <Box className="flex gap-6 w-full max-w-6xl">
          <Card className="flex-1 p-8 rounded-xl shadow-sm !bg-white">
            <Box className="bg-gray-100 rounded-lg p-6 flex justify-between items-start mb-6">
              <Box className="flex items-center gap-4 w-[70%]">
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
              <Box className="flex flex-col gap-3 w-[30%]">
                <Box className="flex items-center justify-between ">
                  <span className="text-gray-500">Invoice</span>
                  {/* <TextField
                    size="small"
                    value={`#${nextInvoiceNumber}`}
                    disabled
                    className="w-48"
                  /> */}
                </Box>
                <Box className="flex items-center justify-between ">
                  <span className="text-gray-500">Bill Number:</span>
                  {/* <TextField
                    size="small"
                    value={formData.billNo}
                    name="billNo"
                    className="w-48"
                    onChange={handleInputChange}
                    placeholder="Enter Bill Number"
                  /> */}
                </Box>
                <Box className="flex items-center justify-between">
                  <span className="text-gray-500">Date Issued:</span>
                  <Box className="flex flex-col">
                    {/* <DatePickerComponent
                      name="createdDate"
                      value={formData?.createdDate}
                      onChange={handleDateChange}
                    />
                    {errors?.createdDate && (
                      <span className="text-xs text-[red]">
                        {errors?.createdDate}
                      </span>
                    )} */}
                  </Box>
                </Box>
                <Box className="flex items-center justify-between">
                  <span className="text-gray-500">Due Day:</span>
                  <Box className="flex flex-col">
                    {/* <TextField
                      size="small"
                      type="number"
                      name="dueDay"
                      value={formData.dueDay}
                      onChange={handleDueDayChange}
                      className="w-48"
                      placeholder="Enter Days"
                    />
                    {errors?.dueDay && (
                      <span className="text-xs text-[red]">
                        {errors?.dueDay}
                      </span>
                    )}
                    {formData.dueDate && (
                      <span className="text-xs text-gray-500 mt-1">
                        Due Date: {dayjs(formData.dueDate).format("YYYY-MM-DD")}
                      </span>
                    )} */}
                  </Box>
                </Box>
              </Box>
            </Box>
            <TableContainer
              component={Paper}
              elevation={0}
              className="rounded-xl border border-gray-200"
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
                  {singleInvoiceData?.items?.map((it, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="text-gray-800">
                        {it.itemName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {it.itemDescription}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        ${it.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {it.price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="caption" className="sr-only">
                Invoice items list
              </Typography>
            </TableContainer>
          </Card>
        </Box>
      )}
    </Box>
  );
}
