import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useEffect } from "react";
import { getPartyLedger } from "../../store/ledger/ledgerSlice";

function PartyLedgerDetail() {
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const { singlePartyLedgerData }: any = useAppSelector(
    (state) => state.ledger
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (user?.companyId && id) {
      dispatch(getPartyLedger({ companyId: user?.companyId, partyId: id }));
    }
  }, [user?.companyId, id]);

  return (
    <div className="m-8 space-y-6">
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {singlePartyLedgerData?.partyName} – Ledger Details
      </Typography>

      {/* Total Balance Card */}
      <Card
        sx={{
          p: 2,
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #f0f9ff, #e0f7fa)",
        }}
      >
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Total Balance
          </Typography>
          <Typography
            variant="h4"
            fontWeight="bold"
            className={`${
              singlePartyLedgerData?.totalAmount >= 0
                ? "!text-[#81c784]"
                : "!text-[#d32f2f]"
            } `}
          >
            ₹{singlePartyLedgerData?.totalAmount?.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card
        sx={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Transactions
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {singlePartyLedgerData?.invoices?.map(
            (invoice: any, index: number) => {
              const firstType = invoice?.entries?.[0]?.type ?? "";
              const isBrokerage =
                firstType === "debit brokerage" ||
                firstType === "credit brokerage";
              const isSell = invoice?.invoiceType === "sell";

              const label = isBrokerage
                ? firstType === "debit brokerage"
                  ? "Brokerage Paid"
                  : "Brokerage Received"
                : isSell
                ? "Received"
                : "Paid";

              // Header base amount
              const baseAmount = isBrokerage
                ? Number(invoice?.paidAmount || 0)
                : isSell
                ? Number(invoice?.receivedAmount || 0)
                : Number(invoice?.paidAmount || 0);

              const pending = Number(invoice?.pendingAmount || 0);
              const discount = Number(invoice?.discountAmount || 0);
              const total = baseAmount + pending + discount;

              // Amount color: green for "Received" or "Brokerage Received", red for "Paid"
              const amountColor = label.includes("Received")
                ? "#2e7d32"
                : "#d32f2f";

              return (
                <Accordion
                  defaultExpanded
                  key={invoice.invoiceId ?? index}
                  sx={{
                    mb: 2,
                    borderRadius: "12px !important",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ flex: 1 }}>
                      <Box className="flex items-center font-bold gap-2 mb-1">
                        Invoice #{invoice?.invoiceNo}
                        {invoice.invoiceId && (
                          <Link
                            to={`/preview-invoice/${invoice.invoiceId}`}
                            style={{
                              marginLeft: "8px",
                              fontSize: "0.85rem",
                              color: "#1976d2",
                              textDecoration: "underline",
                            }}
                          >
                            View Invoice
                          </Link>
                        )}
                        <Chip
                          label={invoice?.invoiceType}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      {/* Invoice summary amounts */}
                      <Typography variant="body2" color="text.secondary">
                        {label} Amount:{" "}
                        <b style={{ color: amountColor }}>
                          ₹{baseAmount.toFixed(2)}
                        </b>{" "}
                        | Pending Amount:{" "}
                        <b style={{ color: "#d32f2f" }}>
                          ₹{pending.toFixed(2)}
                        </b>
                        {discount > 0 && (
                          <>
                            {" "}
                            | Discount:{" "}
                            <b style={{ color: "#ff9800" }}>
                              ₹{discount.toFixed(2)}
                            </b>
                          </>
                        )}{" "}
                        | Total:{" "}
                        <b style={{ color: "#1976d2" }}>₹{total.toFixed(2)}</b>
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "#f9fafb" }}>
                          <TableCell>Description</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Pending Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.entries.map((entry: any, i: number) => {
                          const entryAmt = Number(entry?.amount || 0);
                          const entryPending = Number(
                            entry?.pendingAmount || 0
                          );
                          const entryIsCredit =
                            entry?.type === "credit" ||
                            entry?.type === "credit brokerage";
                          return (
                            <TableRow
                              key={i}
                              sx={{
                                "&:hover": { backgroundColor: "#f5f5f5" },
                                transition: "all 0.2s",
                              }}
                            >
                              <TableCell>
                                {entry.description}
                                {entry.type === "credit brokerage" && (
                                  <Chip
                                    label="Commission"
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      background: "#e3f2fd",
                                      color: "#1976d2",
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: entryIsCredit
                                    ? "success.main"
                                    : "error.main",
                                  fontWeight: "bold",
                                  textTransform: "capitalize",
                                }}
                              >
                                {entry.type}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: "bold" }}
                              >
                                ₹{entryAmt.toFixed(2)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: "bold" }}
                              >
                                ₹{entryPending.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionDetails>
                </Accordion>
              );
            }
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PartyLedgerDetail;
