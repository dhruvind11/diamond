import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Box,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useParams } from "react-router-dom";
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
    <div className="m-6">
      <Typography variant="h4" gutterBottom>
        {singlePartyLedgerData?.partyName} – Ledger Details
      </Typography>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="h6">Total Balance</Typography>
          <Typography
            variant="h5"
            className={
              singlePartyLedgerData?.totalAmount >= 0
                ? "!text-green-600"
                : "!text-red-600"
            }
          >
            ₹{singlePartyLedgerData?.totalAmount?.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transactions
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Sr No</b>
                </TableCell>
                <TableCell>
                  <b>Description</b>
                </TableCell>
                <TableCell>
                  <b>Date</b>
                </TableCell>
                <TableCell align="right">
                  <b>Debit</b>
                </TableCell>
                <TableCell align="right">
                  <b>Credit</b>
                </TableCell>
                <TableCell align="right">
                  <b>Balance</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {singlePartyLedgerData?.invoices?.map(
                (inv: any, index: number) => (
                  <TableRow key={inv.invoiceId}>
                    <TableCell>{index + 1}</TableCell>

                    <TableCell>
                      <Box className="flex items-center gap-2">
                        {inv.description || "—"}
                        {inv.type === "credit brokerage" && (
                          <Chip label="Commission" />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="!text-red-600 !font-bold"
                    >
                      {inv.type === "debit" ? inv?.amount?.toFixed(2) : "0.00"}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="!text-green-500 !font-bold"
                    >
                      {inv.type === "credit" || inv.type === "credit brokerage"
                        ? inv?.amount?.toFixed(2)
                        : "0.00"}
                    </TableCell>

                    {/* Balance (you’ll probably calculate running balance in backend or here) */}
                    <TableCell align="right">
                      {inv.amount?.toFixed(2) ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default PartyLedgerDetail;
