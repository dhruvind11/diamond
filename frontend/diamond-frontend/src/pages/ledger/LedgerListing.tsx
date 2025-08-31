import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";
import { Visibility, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { getCompanyLedger } from "../../store/ledger/ledgerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useNavigate } from "react-router-dom";

export default function LedgerListing() {
  const { user } = useAppSelector((state) => state.auth);
  const { ledgerData }: any = useAppSelector((state) => state.ledger);

  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  console.log("ledgerData", ledgerData);
  useEffect(() => {
    if (user?.companyId) {
      dispatch(getCompanyLedger(user.companyId));
    }
  }, [user?.companyId]);

  console.log("ledgerData", ledgerData);

  return (
    <div className="m-6">
      <h1 className="text-3xl font-bold mb-4">Ledger (Hisab-Kitab)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <CardContent className="flex items-center space-x-2">
            <ArrowDownward className="text-red-600" />

            <div>
              <p className="text-sm text-gray-500">Total Receivable</p>
              <p className="text-lg font-semibold text-green-600">
                ₹{ledgerData?.summary?.totalReceivable}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="flex items-center space-x-2">
            <ArrowUpward className="text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Payable</p>
              <p className="text-lg font-semibold text-red-600">
                ₹{ledgerData?.summary?.totalPayable}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="p-4">
          <CardContent className="flex items-center space-x-2">
            <People className="text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Broker Commission</p>
              <p className="text-lg font-semibold text-orange-600">
                ₹{totalBrokerCommission.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card> */}

        <Card className="p-4">
          <CardContent>
            <p className="text-sm text-gray-500">Net Balance</p>
            <p
              className={`text-lg font-semibold ${
                ledgerData?.summary?.netBalance >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              ₹{ledgerData?.summary?.netBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* <Card className="p-4">
          <CardContent>
            <p className="text-sm text-gray-500">Total Entries</p>
            <p className="text-lg font-semibold">{allParties.length}</p>
          </CardContent>
        </Card> */}
      </div>

      <div className="mb-4">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search parties and brokers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <Typography variant="h6">Party Ledger Management</Typography>
        </CardHeader>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-100">
                  <TableCell>
                    <b>Party Name</b>
                  </TableCell>

                  <TableCell align="right">
                    <b>Balance</b>
                  </TableCell>
                  <TableCell align="center">
                    <b>Action</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledgerData?.partyLedger?.map((entry: any) => (
                  <TableRow key={entry._id} hover>
                    <TableCell>{entry.partyName}</TableCell>

                    <TableCell
                      align="right"
                      className={`!font-semibold ${
                        entry?.totalAmount >= 0
                          ? "!text-green-400"
                          : "!text-red-600"
                      }`}
                    >
                      ₹{entry.totalAmount}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/ledger/${entry._id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* {filteredParties.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No parties found matching your search.
            </div>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}
