import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { getCurrentUser } from "../../store/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { MdCurrencyRupee } from "react-icons/md";
import { FaDownload, FaEdit, FaEye, FaPlus } from "react-icons/fa";
import { FaDeleteLeft } from "react-icons/fa6";
import { getCompanyLedger } from "../../store/ledger/ledgerSlice";

const Dashboard = () => {
  const { authToken, user } = useAppSelector((state) => state.auth);
  const { ledgerData } = useAppSelector((state) => state.ledger);
  const accessToken = localStorage.getItem("authToken");
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  console.log("ledgerData", ledgerData);
  useEffect(() => {
    if (user?.companyId) {
      dispatch(getCompanyLedger(user.companyId));
    }
  }, [user?.companyId]);

  const ledgerEntries = [
    {
      id: 1,
      date: "2024-01-15",
      party: "Rajesh Jewelers",
      description: "Diamond purchase - 2.5 carat",
      debit: 125000,
      credit: 0,
      balance: 125000,
      status: "pending",
    },
    {
      id: 2,
      date: "2024-01-14",
      party: "Mumbai Diamonds",
      description: "Payment received",
      debit: 0,
      credit: 85000,
      balance: -85000,
      status: "completed",
    },
    {
      id: 3,
      date: "2024-01-13",
      party: "Surat Gold House",
      description: "Gold ornament sale",
      debit: 0,
      credit: 45000,
      balance: -45000,
      status: "completed",
    },
    {
      id: 4,
      date: "2024-01-12",
      party: "Delhi Diamond Co.",
      description: "Advance payment",
      debit: 32000,
      credit: 0,
      balance: 32000,
      status: "pending",
    },
  ];

  const parties = [
    { name: "Rajesh Jewelers", balance: 125000, type: "receivable" },
    { name: "Mumbai Diamonds", balance: -85000, type: "payable" },
    { name: "Surat Gold House", balance: -45000, type: "payable" },
    { name: "Delhi Diamond Co.", balance: 32000, type: "receivable" },
  ];
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (accessToken) {
      console.log("inside use effect");
      dispatch(getCurrentUser());
    }
  }, [authToken, accessToken]);

  return (
    <Box className="space-y-6">
      <Card className="shadow-md rounded-2xl">
        <CardHeader
          title={
            <Box className="flex items-center gap-2 text-foreground">
              <MdCurrencyRupee fontSize="medium" />
              <Typography variant="h6">
                Hisab-Kitab (Ledger Management)
              </Typography>
            </Box>
          }
          subheader="Manage your diamond business accounts, track payments, and maintain financial records"
        />
        <CardContent>
          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(e, val) => setTabValue(val)}
            className="mb-4"
          >
            <Tab label="Ledger Entries" />
            <Tab label="Party Balances" />
            <Tab label="Reports" />
          </Tabs>

          {/* Ledger Entries */}
          {tabValue === 0 && (
            <Box className="space-y-4">
              {/* Search & Filter */}
              <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Box className="flex flex-1 items-center gap-2">
                  <TextField
                    size="small"
                    placeholder="Search transactions..."
                    // value={searchTerm}
                    // onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            &#128269;
                          </InputAdornment>
                        ),
                      },
                    }}
                    className="max-w-sm"
                  />
                  <FormControl size="small" className="w-32">
                    <InputLabel>Filter</InputLabel>
                    <Select label="Filter" defaultValue="all">
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box className="flex gap-2">
                  <Button
                    variant="outlined"
                    size="small"
                    // startIcon={<Download />}
                  >
                    Export
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<FaPlus />}
                  >
                    Add Entry
                  </Button>
                </Box>
              </Box>

              {/* Ledger Table */}
              <Box className="overflow-x-auto rounded-md border">
                <TableContainer
                  component={Paper}
                  sx={{ borderRadius: 2, boxShadow: 2 }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        {[
                          "Date",
                          "Party",
                          "Description",
                          "Debit",
                          "Credit",
                          "Balance",
                          "Status",
                          "Actions",
                        ].map((col) => (
                          <TableCell
                            key={col}
                            sx={{ fontWeight: "bold", color: "text.secondary" }}
                          >
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {ledgerEntries.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {entry.party}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>
                            {entry.description}
                          </TableCell>

                          {/* Debit */}
                          <TableCell
                            // align="right"
                            sx={{
                              color:
                                entry.debit > 0
                                  ? "error.main"
                                  : "text.disabled",
                            }}
                          >
                            {entry.debit > 0
                              ? `₹${entry.debit.toLocaleString()}`
                              : "-"}
                          </TableCell>

                          {/* Credit */}
                          <TableCell
                            // align="right"
                            sx={{
                              color:
                                entry.credit > 0
                                  ? "success.main"
                                  : "text.disabled",
                            }}
                          >
                            {entry.credit > 0
                              ? `₹${entry.credit.toLocaleString()}`
                              : "-"}
                          </TableCell>

                          <TableCell
                            // align="right"
                            sx={{
                              fontWeight: "bold",
                              color:
                                entry.balance > 0
                                  ? "error.main"
                                  : "success.main",
                            }}
                          >
                            ₹{Math.abs(entry.balance).toLocaleString()}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip
                              size="small"
                              label={entry.status}
                              color={
                                entry.status === "completed"
                                  ? "success"
                                  : "warning"
                              }
                              variant="outlined"
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <IconButton size="small">
                              <FaEye fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <FaEdit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <FaDeleteLeft fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}

          {/* Party Balances */}
          {tabValue === 1 && (
            <Grid container spacing={2}>
              {parties.map((party, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Card className="rounded-xl border">
                    <CardHeader
                      title={
                        <Box className="flex items-center justify-between">
                          <Typography variant="subtitle1">
                            {party.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              party.type === "receivable"
                                ? "To Receive"
                                : "To Pay"
                            }
                            color={
                              party.type === "receivable" ? "error" : "success"
                            }
                          />
                        </Box>
                      }
                    />
                    <CardContent>
                      <Typography
                        variant="h5"
                        className={
                          party.balance > 0 ? "text-red-600" : "text-green-600"
                        }
                      >
                        ₹{Math.abs(party.balance).toLocaleString()}
                      </Typography>
                      <Box className="mt-4 flex gap-2">
                        <Button variant="outlined" size="small">
                          View Details
                        </Button>
                        <Button variant="contained" size="small">
                          Record Payment
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Reports */}
          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Monthly Summary"
                    subheader="Financial overview for current month"
                  />
                  <CardContent>
                    <Box className="flex justify-between mb-2">
                      <span className="text-gray-500">Total Receivables:</span>
                      <span className="font-medium text-red-600">
                        ₹1,57,000
                      </span>
                    </Box>
                    <Box className="flex justify-between mb-2">
                      <span className="text-gray-500">Total Payables:</span>
                      <span className="font-medium text-green-600">
                        ₹1,30,000
                      </span>
                    </Box>
                    <Divider />
                    <Box className="flex justify-between mt-2">
                      <span className="font-medium">Net Position:</span>
                      <span className="font-bold text-red-600">₹27,000</span>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Quick Reports"
                    subheader="Generate detailed financial reports"
                  />
                  <CardContent>
                    <Button
                      variant="outlined"
                      fullWidth
                      className="mb-2"
                      startIcon={<FaDownload />}
                    >
                      Party-wise Statement
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      className="mb-2"
                      startIcon={<FaDownload />}
                    >
                      Monthly Ledger
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<FaDownload />}
                    >
                      Outstanding Report
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
