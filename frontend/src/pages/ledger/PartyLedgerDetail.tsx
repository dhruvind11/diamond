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
import { useEffect, useMemo } from "react";
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

  const grouped = useMemo(() => {
    if (!singlePartyLedgerData?.invoices) return [];

    const result = singlePartyLedgerData.invoices.reduce(
      (acc: any, txn: any) => {
        if (!acc[txn.invoiceId]) {
          acc[txn.invoiceId] = {
            invoiceId: txn.invoiceId,
            entries: [],
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
          };
        }

        acc[txn.invoiceId].entries.push(txn);

        if (txn.type === "debit") {
          acc[txn.invoiceId].totalDebit += txn.amount;
        } else {
          acc[txn.invoiceId].totalCredit += txn.amount;
        }

        acc[txn.invoiceId].balance =
          acc[txn.invoiceId].totalCredit - acc[txn.invoiceId].totalDebit;

        return acc;
      },
      {}
    );

    return Object.values(result);
  }, [singlePartyLedgerData]);

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
            sx={{
              color:
                singlePartyLedgerData?.totalAmount >= 0
                  ? "success.main"
                  : "error.main",
            }}
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

          {grouped?.map((invoice: any, index) => (
            <Accordion
              defaultExpanded
              key={invoice.invoiceId}
              sx={{
                mb: 2,
                borderRadius: "12px !important",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold" variant="subtitle1">
                    Invoice #{index + 1}{" "}
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
                  </Typography>
                  {/* <Typography variant="body2" color="text.secondary">
                    Debit:{" "}
                    <b style={{ color: "#d32f2f" }}>{invoice.totalDebit}</b> |
                    Credit:{" "}
                    <b style={{ color: "#2e7d32" }}>{invoice.totalCredit}</b> |
                    Balance:{" "}
                    <b
                      style={{
                        color: invoice.balance >= 0 ? "#2e7d32" : "#d32f2f",
                      }}
                    >
                      {invoice.balance}
                    </b>
                  </Typography> */}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f9fafb" }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Pending Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.entries.map((entry: any, i: any) => (
                      <TableRow
                        key={i}
                        sx={{
                          "&:hover": { backgroundColor: "#f5f5f5" },
                          transition: "all 0.2s",
                        }}
                      >
                        <TableCell>
                          {
                            new Date(entry.createdDate)
                              .toISOString()
                              .split("T")[0]
                          }
                        </TableCell>
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
                            color:
                              entry.type === "debit"
                                ? "error.main"
                                : "success.main",
                            fontWeight: "bold",
                          }}
                        >
                          {entry.type}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          ₹{entry.amount.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          ₹{entry.pendingAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default PartyLedgerDetail;
