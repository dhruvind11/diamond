import type React from "react";
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Paper,
  Stack,
  Divider,
  Badge,
} from "@mui/material";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FiAlertCircle, FiAlertTriangle } from "react-icons/fi";
import { TrendingDown, TrendingUp } from "@mui/icons-material";
import { FaClock } from "react-icons/fa";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function PaymentOverview() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const todayPayable = [
    {
      id: 1,
      party: "Mumbai Diamonds",
      stock: "2.5 Carat Diamond",
      amount: "₹32,000",
      description: "Advance payment",
    },
    {
      id: 2,
      party: "Delhi Diamond Co.",
      stock: "1.8 Carat Emerald",
      amount: "₹25,000",
      description: "Invoice payment",
    },
  ];

  const todayReceivable = [
    {
      id: 3,
      party: "Rajesh Jewelers",
      stock: "3.2 Carat Diamond",
      amount: "₹45,000",
      description: "Diamond purchase",
    },
    {
      id: 4,
      party: "Surat Gold House",
      stock: "Gold Ornament Set",
      amount: "₹78,000",
      description: "Gold ornament sale",
    },
  ];

  const todayPaid = [
    {
      id: 5,
      party: "Ahmedabad Gems",
      stock: "4.1 Carat Emerald",
      amount: "₹35,000",
      description: "Emerald purchase payment",
    },
    {
      id: 6,
      party: "Kolkata Gems",
      stock: "Broker Commission",
      amount: "₹8,500",
      description: "Broker commission",
    },
  ];

  const todayReceived = [
    {
      id: 7,
      party: "Mumbai Diamonds",
      stock: "Diamond Collection",
      amount: "₹85,000",
      description: "Payment received",
    },
    {
      id: 8,
      party: "Chennai Jewels",
      stock: "Advance Payment",
      amount: "₹45,000",
      description: "Advance received",
    },
  ];

  const upcomingPaymentsDue = [
    {
      id: 9,
      party: "Kolkata Gems",
      stock: "2.8 Carat Ruby",
      amount: "₹67,000",
      dueDate: "Dec 18, 2024",
      daysLeft: 8,
    },
    {
      id: 10,
      party: "Hyderabad Diamonds",
      stock: "Diamond Ring Set",
      amount: "₹54,000",
      dueDate: "Dec 28, 2024",
      daysLeft: 18,
    },
  ];

  const upcomingReceivables = [
    {
      id: 11,
      party: "Delhi Diamond Co.",
      stock: "5.2 Carat Diamond",
      amount: "₹1,25,000",
      dueDate: "Dec 15, 2024",
      daysLeft: 5,
    },
    {
      id: 12,
      party: "Chennai Jewels",
      stock: "Gold Necklace",
      amount: "₹89,000",
      dueDate: "Dec 22, 2024",
      daysLeft: 12,
    },
  ];

  const overduePayables = [
    {
      id: 13,
      party: "Ahmedabad Gold",
      stock: "3.5 Carat Sapphire",
      amount: "₹43,000",
      overdueDays: 7,
      dueDate: "Dec 3, 2024",
    },
    {
      id: 14,
      party: "Pune Jewelers",
      stock: "Diamond Earrings",
      amount: "₹28,000",
      overdueDays: 12,
      dueDate: "Nov 28, 2024",
    },
  ];

  const overdueReceivables = [
    {
      id: 15,
      party: "Pune Jewelers",
      stock: "4.8 Carat Diamond",
      amount: "₹95,000",
      overdueDays: 5,
      dueDate: "Dec 5, 2024",
    },
    {
      id: 16,
      party: "Jaipur Gems",
      stock: "Emerald Collection",
      amount: "₹76,000",
      overdueDays: 9,
      dueDate: "Dec 1, 2024",
    },
  ];

  const severelyOverduePayables = [
    {
      id: 17,
      party: "Lucknow Jewels",
      stock: "6.2 Carat Ruby",
      amount: "₹87,000",
      overdueDays: 43,
      dueDate: "Oct 28, 2024",
    },
    {
      id: 18,
      party: "Bhopal Gems",
      stock: "Diamond Bracelet",
      amount: "₹65,000",
      overdueDays: 38,
      dueDate: "Nov 2, 2024",
    },
  ];

  const severelyOverdueReceivables = [
    {
      id: 19,
      party: "Bangalore Diamonds",
      stock: "8.5 Carat Diamond",
      amount: "₹1,45,000",
      overdueDays: 35,
      dueDate: "Nov 5, 2024",
    },
    {
      id: 20,
      party: "Indore Gold House",
      stock: "Premium Gold Set",
      amount: "₹2,15,000",
      overdueDays: 56,
      dueDate: "Oct 15, 2024",
    },
  ];

  return (
    <div className="w-full  mx-auto py-4">
      <Card className="shadow-lg border border-slate-200">
        <CardContent className="p-0">
          <Box className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <Typography
              variant="h5"
              className="font-bold text-slate-800 mb-2 flex items-center gap-2"
            >
              <FaIndianRupeeSign className="h-6 w-6 text-cyan-600" />
              Payment Management System
            </Typography>
            <Typography variant="body2" className="text-slate-600">
              Comprehensive payment tracking and management for your diamond
              business
            </Typography>
          </Box>

          <Box className="border-b border-slate-200">
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              className="bg-white"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  minHeight: "48px",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0891b2",
                  height: "3px",
                },
              }}
            >
              <Tab label="Today's Overview" />
              <Tab label="Upcoming Overview" />
              <Tab label="Overdue Overview" />
              <Tab label="30+ Days Overdue" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today Payable Card */}
              <Card className="border-2 border-red-200 bg-red-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FiAlertCircle className="h-5 w-5 text-red-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Today Payable
                    </Box>
                    <Chip
                      label={todayPayable.length}
                      size="small"
                      className="bg-red-100 text-red-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {todayPayable.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-red-100"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            {/* <Typography
                              variant="caption"
                              className="text-slate-500 block"
                            >
                              {item.description}
                            </Typography> */}
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-red-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-red-700"
                      >
                        Total Payable:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-red-700"
                      >
                        ₹57,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Today Receivable Card */}
              <Card className="border-2 border-blue-200 bg-blue-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Today Receivable
                    </Box>
                    <Chip
                      label={todayReceivable.length}
                      size="small"
                      className="bg-blue-100 text-blue-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {todayReceivable.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-blue-100"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            {/* <Typography
                              variant="caption"
                              className="text-slate-500 block"
                            >
                              {item.description}
                            </Typography> */}
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-blue-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-blue-700"
                      >
                        Total Receivable:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-blue-700"
                      >
                        ₹123,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Today Paid Card */}
              <Card className="border-2 border-orange-200 bg-orange-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Today Paid
                    </Box>
                    <Chip
                      label={todayPaid.length}
                      size="small"
                      className="bg-orange-100 text-orange-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {todayPaid.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-orange-100"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            {/* <Typography
                              variant="caption"
                              className="text-slate-500 block"
                            >
                              {item.description}
                            </Typography> */}
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-orange-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-orange-700"
                      >
                        Total Paid:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-orange-700"
                      >
                        ₹43,500
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Today Received Card */}
              <Card className="border-2 border-green-200 bg-green-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FaIndianRupeeSign className="h-5 w-5 text-green-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Today Received
                    </Box>
                    <Chip
                      label={todayReceived.length}
                      size="small"
                      className="bg-green-100 text-green-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {todayReceived.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-green-100"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            {/* <Typography
                              variant="caption"
                              className="text-slate-500 block"
                            >
                              {item.description}
                            </Typography> */}
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-green-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-green-700"
                      >
                        Total Received:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-green-700"
                      >
                        ₹130,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Payments Due */}
              <Card className="border-2 border-yellow-200 bg-yellow-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FaClock className="h-5 w-5 text-yellow-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Upcoming Payments Due
                    </Box>
                    <Chip
                      label={upcomingPaymentsDue.length}
                      size="small"
                      className="bg-yellow-100 text-yellow-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {upcomingPaymentsDue.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-yellow-100"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-yellow-600 block font-medium"
                            >
                              Due in {item.daysLeft} days
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-yellow-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-yellow-700"
                      >
                        Total Due:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-yellow-700"
                      >
                        ₹121,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Expected Receivables */}
              <Card className="border-2 border-cyan-200 bg-cyan-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-cyan-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Expected Receivables
                    </Box>
                    <Chip
                      label={upcomingReceivables.length}
                      size="small"
                      className="bg-cyan-100 text-cyan-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {upcomingReceivables.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-cyan-100"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-cyan-600 block font-medium"
                            >
                              Due in {item.daysLeft} days
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-cyan-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-cyan-700"
                      >
                        Total Expected:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-cyan-700"
                      >
                        ₹214,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overdue Payables */}
              <Card className="border-2 border-orange-300 bg-orange-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FiAlertTriangle className="h-5 w-5 text-orange-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Overdue Payables
                    </Box>
                    <Chip
                      label={overduePayables.length}
                      size="small"
                      className="bg-orange-100 text-orange-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {overduePayables.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-orange-200"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-red-600 block font-medium"
                            >
                              {item.overdueDays} days overdue
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-orange-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-orange-700"
                      >
                        Total Overdue:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-orange-700"
                      >
                        ₹71,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Overdue Receivables */}
              <Card className="border-2 border-red-300 bg-red-50/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FiAlertCircle className="h-5 w-5 text-red-600" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Overdue Receivables
                    </Box>
                    <Chip
                      label={overdueReceivables.length}
                      size="small"
                      className="bg-red-100 text-red-700"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {overdueReceivables.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border border-red-200"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-red-600 block font-medium"
                            >
                              {item.overdueDays} days overdue
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-red-600"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-red-700"
                      >
                        Total Overdue:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-red-700"
                      >
                        ₹171,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Severely Overdue Payables */}
              <Card className="border-2 border-red-400 bg-red-100/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FiAlertCircle className="h-5 w-5 text-red-700" />
                    <Box className="font-semibold text-red-700 text-lg">
                      Overdue Payables (30+ days)
                    </Box>
                    <Badge
                      badgeContent={severelyOverduePayables.length}
                      color="error"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {severelyOverduePayables.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border-2 border-red-300"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-red-700 block font-bold"
                            >
                              {item.overdueDays} days overdue
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-red-700"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-red-800"
                      >
                        Total Severely Overdue:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-red-800"
                      >
                        ₹152,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Severely Overdue Receivables */}
              <Card className="border-2 border-red-400 bg-red-100/50 h-full">
                <CardContent className="p-4">
                  <Box className="flex items-center gap-2 mb-4">
                    <FiAlertTriangle className="h-5 w-5 text-red-700" />
                   <Box className="font-semibold text-red-700 text-lg">
                      Overdue Receivables (30+ days)
                    </Box>
                    <Badge
                      badgeContent={severelyOverdueReceivables.length}
                      color="error"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {severelyOverdueReceivables.map((item) => (
                      <Paper
                        key={item.id}
                        className="p-3 bg-white/80 border-2 border-red-300"
                      >
                        <Box className="flex justify-between items-start">
                          <Box className="flex-1">
                            <Typography
                              variant="subtitle2"
                              className="font-medium text-slate-800"
                            >
                              {item.party}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-slate-600 block"
                            >
                              {item.stock}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-red-700 block font-bold"
                            >
                              {item.overdueDays} days overdue
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            className="font-bold text-red-700"
                          >
                            {item.amount}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                    <Divider className="my-3" />
                    <Box className="flex justify-between items-center">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-red-800"
                      >
                        Total Severely Overdue:
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-red-800"
                      >
                        ₹360,000
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </div>
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
}
