import { useEffect } from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import { getCurrentUser } from "../../store/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  Event,
  Inventory2,
  Diamond,
  People,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import DashboardCard from "./DashboardCard";
import {
  fetchDashboardData,
  fetchDiwaliCycles,
  fetchPaymentSummary,
} from "../../store/dashboard/dashboardSlice";
import { PaymentOverview } from "./PaymentOverview";
import YearlySummary from "./YearlySummary";
import MonthlySummary from "./MonthlySummary";

const inr = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(n)
    : "₹0";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { authToken, user } = useAppSelector((s) => s.auth);
  const dashboardData = useAppSelector((s) => s.dashboard.dashboardData);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchDashboardData({ companyId: user.companyId }));
      dispatch(fetchPaymentSummary({ companyId: user.companyId }));
    }
    dispatch(fetchDiwaliCycles());
  }, [user?.companyId]);

  const accessToken = localStorage.getItem("authToken");
  useEffect(() => {
    if (accessToken) {
      dispatch(getCurrentUser());
    }
  }, [authToken, accessToken, dispatch]);

  const d = dashboardData ?? {};

  const revenueSummary = d.revenueSummary ?? {
    totalRevenue: 0,
    totalStocks: 0,
    activeParties: 0,
  };
  const todayOverview = d.todayOverview ?? {
    todayPayable: 0,
    todayReceivable: 0,
    stockSoldToday: { amount: 0, quantity: 0 },
    stockBoughtToday: { amount: 0, quantity: 0 },
  };
  const upComingOverview = d.upComingOverview ?? {
    paymentsDue30: 0,
    expectedReceivables30: 0,
  };

  const payableList = d.payableList ?? {
    totalPayable: 0,
    count: 0,
    items: [] as any[],
  };
  const receivableList = d.receivableList ?? {
    totalReceivable: 0,
    count: 0,
    items: [] as any[],
  };

  const revenueData = [
    {
      title: "Total Revenue",
      value: inr(revenueSummary.totalRevenue),
      color: "text-green-600",
      icon: <Inventory2 className="text-gray-500" />,
      trend: 1,
    },
    {
      title: "Total Stock",
      value: `${revenueSummary.totalStocks} CT`,
      color: "text-blue-600",
      icon: <Diamond className="text-gray-500" />,
      trend: 1,
    },
    {
      title: "Active Parties",
      value: String(revenueSummary.activeParties),
      color: "text-emerald-600",
      icon: <People className="text-gray-500" />,
      trend: 1,
    },
  ];

  const todayData = [
    {
      title: "Today Payable",
      value: inr(payableList.totalPayable ?? todayOverview.todayPayable),
      subtitle: `${payableList.count} ${
        payableList.count === 1 ? "party" : "parties"
      }`,
      color: "text-red-600",
      icon: <Warning className="text-red-400" />,
      trend: 0,
    },
    {
      title: "Today Receivable",
      value: inr(
        receivableList.totalReceivable ?? todayOverview.todayReceivable
      ),
      subtitle: `${receivableList.count} ${
        receivableList.count === 1 ? "party" : "parties"
      }`,
      color: "text-green-600",
      icon: <TrendingUp className="text-green-500" />,
      trend: 1,
    },
    {
      title: "Stock Sold Today",
      value: inr(todayOverview.stockSoldToday?.amount),
      subtitle: `${todayOverview.stockSoldToday?.quantity ?? 0} items`,
      color: "text-blue-600",
      icon: <Inventory2 className="text-blue-500" />,
      trend: 1,
    },
    {
      title: "Stock Bought Today",
      value: inr(todayOverview.stockBoughtToday?.amount),
      subtitle: `${todayOverview.stockBoughtToday?.quantity ?? 0} items`,
      color: "text-purple-600",
      icon: <Diamond className="text-purple-500" />,
      trend: 0,
    },
  ];

  const upcomingData = [
    {
      title: "Payments Due (30 days)",
      value: inr(upComingOverview.paymentsDue30),
      subtitle: "", // if you also return count, put it here
      color: "text-red-600",
      icon: <Event className="text-red-400" />,
      trend: 0,
    },
    {
      title: "Expected Receivables",
      value: inr(upComingOverview.expectedReceivables30),
      subtitle: "",
      color: "text-yellow-600",
      icon: <TrendingUp className="text-yellow-500" />,
      trend: 1,
    },
  ];

  return (
    <Box className="p-6 space-y-10">
      {/* Revenue Overview */}
      <Box>
        <Typography variant="h6" className="mb-4 font-bold">
          Revenue Overview
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {revenueData.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </Box>
      </Box>

      <PaymentOverview />
      {/* Today's Overview */}
      <Box>
        <Typography variant="h6" className="mb-4 font-bold">
          Today&apos;s Overview
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayData.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </Box>
      </Box>

      {/* Upcoming */}
      <Box>
        <Typography variant="h6" className="mb-4 font-bold">
          Upcoming (Next 30 Days)
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingData.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </Box>
      </Box>

      {/* Monthly & Yearly Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <MonthlySummary inr={inr} />
        <YearlySummary />
      </div>
    </Box>
  );
}
