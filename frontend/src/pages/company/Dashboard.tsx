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
import {
  Diamond,
  Event,
  Inventory2,
  People,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import DashboardCard from "./DashboardCard";

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

  const revenueStats = [
    {
      name: "Total Revenue",
      value: "₹12,45,000",
      change: "+12.5%",
      changeType: "increase",
      // icon: IndianRupee,
    },
    {
      name: "Total Diamonds",
      value: "2,847",
      change: "+156",
      changeType: "increase",
      // icon: Gem,
    },
    {
      name: "Total Stock Value",
      value: "₹45,67,000",
      change: "+8.3%",
      changeType: "increase",
      // icon: Package,
    },
    {
      name: "Active Parties",
      value: "48",
      change: "+3",
      changeType: "increase",
      // icon: Users,
    },
  ];

  const todayStats = [
    {
      name: "Payments Due Today",
      value: "₹1,25,000",
      parties: "5 parties",
      // icon: AlertCircle,
      color: "text-red-600",
    },
    {
      name: "Expected Receipts",
      value: "₹85,000",
      parties: "3 parties",
      // icon: TrendingUp,
      color: "text-green-600",
    },
    {
      name: "Stock Sold Today",
      value: "₹2,45,000",
      parties: "12 items",
      // icon: Package,
      color: "text-blue-600",
    },
    {
      name: "Stock Bought Today",
      value: "₹1,67,000",
      parties: "8 items",
      // icon: Gem,
      color: "text-purple-600",
    },
  ];

  const upcomingStats = [
    {
      name: "Payments Due (30 days)",
      value: "₹8,45,000",
      count: "23 payments",
      // icon: Calendar,
      urgency: "high",
    },
    {
      name: "Expected Receivables",
      value: "₹12,67,000",
      count: "18 receipts",
      // icon: TrendingUp,
      urgency: "medium",
    },
    {
      name: "Stocks to Sell",
      value: "₹15,23,000",
      count: "45 items",
      // icon: Package,
      urgency: "low",
    },
    {
      name: "Planned Purchases",
      value: "₹6,78,000",
      count: "12 orders",
      // icon: Gem,
      urgency: "medium",
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      party: "Rajesh Jewelers",
      type: "Payment Received",
      amount: "+₹45,000",
      date: "2 hours ago",
    },
    {
      id: 2,
      party: "Mumbai Diamonds",
      type: "Invoice Created",
      amount: "₹1,25,000",
      date: "4 hours ago",
    },
    {
      id: 3,
      party: "Surat Gold House",
      type: "Payment Sent",
      amount: "-₹32,000",
      date: "1 day ago",
    },
    {
      id: 4,
      party: "Delhi Diamond Co.",
      type: "Payment Received",
      amount: "+₹78,000",
      date: "2 days ago",
    },
  ];

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (accessToken) {
      console.log("inside use effect");
      dispatch(getCurrentUser());
    }
  }, [authToken, accessToken]);

  const revenueData = [
    {
      title: "Total Revenue",
      value: "₹12,45,000",
      subtitle: "+12.5% from last month",
      color: "text-green-600",
      icon: <Inventory2 className="text-gray-500" />,
      trend: 1,
    },
    {
      title: "Total Diamonds",
      value: "2,847",
      subtitle: "+156 from last month",
      color: "text-blue-600",
      icon: <Diamond className="text-gray-500" />,
      trend: 1,
    },
    {
      title: "Total Stock Value",
      value: "₹45,67,000",
      subtitle: "+8.3% from last month",
      color: "text-purple-600",
      icon: <Inventory2 className="text-gray-500" />,
      trend: 1,
    },
    {
      title: "Active Parties",
      value: "48",
      subtitle: "+3 from last month",
      color: "text-emerald-600",
      icon: <People className="text-gray-500" />,
      trend: 1,
    },
  ];

  const todayData = [
    {
      title: "Payments Due Today",
      value: "₹1,25,000",
      subtitle: "5 parties",
      color: "text-red-600",
      icon: <Warning className="text-red-400" />,
      trend: 0,
    },
    {
      title: "Expected Receipts",
      value: "₹85,000",
      subtitle: "3 parties",
      color: "text-green-600",
      icon: <TrendingUp className="text-green-500" />,
      trend: 1,
    },
    {
      title: "Stock Sold Today",
      value: "₹2,45,000",
      subtitle: "12 items",
      color: "text-blue-600",
      icon: <Inventory2 className="text-blue-500" />,
      trend: 0,
    },
    {
      title: "Stock Bought Today",
      value: "₹1,67,000",
      subtitle: "8 items",
      color: "text-purple-600",
      icon: <Diamond className="text-purple-500" />,
      trend: 0,
    },
  ];

  const upcomingData = [
    {
      title: "Payments Due (30 days)",
      value: "₹8,45,000",
      subtitle: "23 payments",
      color: "text-red-600",
      icon: <Event className="text-red-400" />,
      trend: 0,
    },
    {
      title: "Expected Receivables",
      value: "₹12,67,000",
      subtitle: "18 receipts",
      color: "text-yellow-600",
      icon: <TrendingUp className="text-yellow-500" />,
      trend: 1,
    },
    {
      title: "Stocks to Sell",
      value: "₹15,23,000",
      subtitle: "45 items",
      color: "text-green-600",
      icon: <Inventory2 className="text-green-500" />,
      trend: 0,
    },
    {
      title: "Planned Purchases",
      value: "₹6,78,000",
      subtitle: "12 orders",
      color: "text-amber-600",
      icon: <Diamond className="text-amber-500" />,
      trend: 0,
    },
  ];
  return (
    <Box className="p-6 space-y-10">
      {/* Revenue Overview */}
      <Box>
        <Typography variant="h6" className="mb-4 font-bold">
          Revenue Overview
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueData.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </Box>
      </Box>

      {/* Today's Overview */}
      <Box>
        <Typography variant="h6" className="mb-4 font-bold">
          Today's Overview
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayData.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" className="mb-4 font-bold">
          Upcoming (Next 30 Days)
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingData.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </Box>
      </Box>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        {/* Today's Due Payments */}
        <Card className="rounded-2xl shadow-sm border border-orange-200 bg-orange-50">
          <CardContent>
            <h3 className="text-sm font-medium text-orange-800">
              Today's Due Payments
            </h3>
            <p className="text-2xl font-bold text-orange-600 mt-2">₹232,000</p>
            <p className="text-sm text-orange-700">3 payments due</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-orange-700">
                <span>Rajesh Jewelers</span>
                <span>₹125,000</span>
              </div>
              <div className="flex justify-between text-orange-700">
                <span>Delhi Diamond Co.</span>
                <span>₹32,000</span>
              </div>
              <p className="text-orange-600 cursor-pointer">+1 more</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Received */}
        <Card className="rounded-2xl shadow-sm border border-green-200 bg-green-50">
          <CardContent>
            <h3 className="text-sm font-medium text-green-800">
              Today's Received
            </h3>
            <p className="text-2xl font-bold text-green-600 mt-2">₹130,000</p>
            <p className="text-sm text-green-700">2 payments received</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-green-700">
                <span>Mumbai Diamonds</span>
                <span>₹85,000</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Surat Gold House</span>
                <span>₹45,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Today */}
        <Card className="rounded-2xl shadow-sm border border-blue-200 bg-blue-50">
          <CardContent>
            <h3 className="text-sm font-medium text-blue-800">Net Today</h3>
            <p className="text-2xl font-bold text-red-600 mt-2">₹102,000</p>
            <p className="text-sm text-blue-700">Net due</p>
            <div className="mt-3 text-sm text-blue-700 space-y-1">
              <p>
                <span className="font-medium">Received:</span> ₹130,000
              </p>
              <p>
                <span className="font-medium">Due:</span> ₹232,000
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        {/* Monthly Summary */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-800">
              Monthly Summary
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Financial overview for current month
            </p>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Total Receivables:
              </span>
              <span className="font-semibold text-red-600">₹1,57,000</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Total Payables:</span>
              <span className="font-semibold text-green-600">₹1,30,000</span>
            </div>

            <Divider className="my-2" />

            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Net Position:</span>
              <span className="font-semibold text-red-600">₹27,000</span>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Summary */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-800">
              Yearly Summary (2024)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Annual financial overview and performance
            </p>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Total Revenue:</span>
              <span className="font-semibold text-blue-600">₹18,45,000</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Total Transactions:
              </span>
              <span className="font-semibold text-gray-800">1,247</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Broker Commissions:
              </span>
              <span className="font-semibold text-orange-600">₹92,250</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Outstanding Amount:
              </span>
              <span className="font-semibold text-red-600">₹3,27,000</span>
            </div>

            <Divider className="my-2" />

            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Net Profit:</span>
              <span className="font-semibold text-green-600">₹4,25,750</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
};

export default Dashboard;
