import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Box,
} from "@mui/material";
import {
  Visibility,
  ArrowUpward,
  ArrowDownward,
  Search,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { getCompanyLedger } from "../../store/ledger/ledgerSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useNavigate } from "react-router-dom";

export default function LedgerListing() {
  const { user } = useAppSelector((state) => state.auth);
  const { ledgerData }: any = useAppSelector((state) => state.ledger);

  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.companyId) {
      dispatch(getCompanyLedger(user.companyId));
    }
  }, [user?.companyId]);

  return (
    <div className="m-6 space-y-6">
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Ledger (Hisab-Kitab)
      </Typography>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receivable */}
        <Card
          sx={{
            borderRadius: "16px",
            background: "linear-gradient(135deg, #ffe6e6, #fff0f0)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            transition: "0.3s",
            "&:hover": { transform: "translateY(-4px)" },
          }}
        >
          <CardContent className="flex items-center space-x-3">
            <ArrowDownward sx={{ fontSize: 36, color: "#d32f2f" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Receivable
              </Typography>
              <Typography variant="h6" color="green">
                ₹{ledgerData?.summary?.totalReceivable}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Payable */}
        <Card
          sx={{
            borderRadius: "16px",
            background: "linear-gradient(135deg, #e6fff5, #f0fffa)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            transition: "0.3s",
            "&:hover": { transform: "translateY(-4px)" },
          }}
        >
          <CardContent className="flex items-center space-x-3">
            <ArrowUpward sx={{ fontSize: 36, color: "#2e7d32" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Payable
              </Typography>
              <Typography variant="h6" color="error">
                ₹{ledgerData?.summary?.totalPayable}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card
          sx={{
            borderRadius: "16px",
            background: "linear-gradient(135deg, #e6f0ff, #f5faff)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            transition: "0.3s",
            "&:hover": { transform: "translateY(-4px)" },
          }}
        >
          <CardContent className="flex items-center space-x-3">
            <AccountBalanceWallet sx={{ fontSize: 36, color: "#1976d2" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Net Balance
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color:
                    ledgerData?.summary?.netBalance >= 0
                      ? "green"
                      : "error.main",
                }}
              >
                ₹{ledgerData?.summary?.netBalance?.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <TextField
        variant="outlined"
        size="small"
        placeholder="Search parties and brokers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/3"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "gray" }} />
            </InputAdornment>
          ),
        }}
        sx={{
          borderRadius: "50px",
          "& fieldset": { borderRadius: "50px" },
        }}
      />

      {/* Table */}
      <Card
        sx={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Party Ledger Management
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: "12px" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f9fafb" }}>
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
                  <TableRow
                    key={entry._id}
                    hover
                    sx={{
                      "&:hover": { background: "#f5faff" },
                      transition: "0.2s",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {entry.partyName}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        color: entry?.totalAmount >= 0 ? "green" : "red",
                      }}
                    >
                      ₹{entry.totalAmount}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Visibility />}
                        sx={{
                          borderRadius: "20px",
                          textTransform: "none",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          background: "linear-gradient(90deg,#1976d2,#42a5f5)",
                        }}
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
        </CardContent>
      </Card>
    </div>
  );
}
