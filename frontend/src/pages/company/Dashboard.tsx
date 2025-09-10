import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
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
import { fetchDashboardData } from "../../store/dashboard/dashboardSlice";
import { PaymentOverview } from "./PaymentOverview";

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
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchDashboardData({ companyId: user.companyId }));
    }
  }, [user?.companyId, dispatch]);

  const accessToken = localStorage.getItem("authToken");
  useEffect(() => {
    if (accessToken) {
      dispatch(getCurrentUser());
    }
  }, [authToken, accessToken, dispatch]);

  const d = dashboardData ?? {};
  console.log("d.monthlySummary", d.monthlySummary);
  // const monthly = Array.isArray(d.monthlySummary) ? d.monthlySummary[0] : null;

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

  const paidBlock = d.todaysPaidAmount?.[0] ?? {
    totalAmount: 0,
    count: 0,
    items: [] as any[],
  };
  const receivedBlock = d.todaysReceivedAmount?.[0] ?? {
    totalAmount: 0,
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
      title: "Total Diamonds",
      value: String(revenueSummary.totalStocks),
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

  // ---- Helper to render the mini-list inside the 4 detailed cards ----
  const renderMiniList = (items: any[] = [], id: string) => {
    const isOpen = !!expandedLists[id];
    const topCount = 2;
    const shown = isOpen ? items : items.slice(0, topCount);
    const remaining = Math.max((items?.length ?? 0) - topCount, 0);

    return (
      <div className="mt-3 space-y-1 text-sm">
        {shown.map((r, i) => (
          <div key={`${id}-${i}`} className="flex gap-x-3">
            <span>{r.partyName ?? "—"}</span>
            {r.type === "broker" ? (
              <Chip label="broker" size="small" />
            ) : (
              <span>{r.stock}</span>
            )}

            <span>{inr(r.amount)}</span>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() =>
              setExpandedLists((prev) => ({ ...prev, [id]: !isOpen }))
            }
            className="mt-1 underline cursor-pointer"
          >
            {isOpen ? "Show less" : `+${remaining} more`}
          </button>
        )}
      </div>
    );
  };

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

      {/* Four detailed cards fed by lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
        {/* Today's Payable Payments */}
        <Card className="rounded-2xl shadow-sm border border-orange-200 bg-orange-50">
          <CardContent>
            <h3 className="text-sm font-medium text-orange-800">
              Today&apos;s Payable Payments
            </h3>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {inr(payableList.totalPayable)}
            </p>
            <p className="text-sm text-orange-700">
              {payableList.count}{" "}
              {payableList.count === 1 ? "payment due" : "payments due"}
            </p>
            <div className="text-orange-700">
              {renderMiniList(payableList.items, "todayPayable")}
            </div>
          </CardContent>
        </Card>

        {/* Today's Receivable */}
        <Card className="rounded-2xl shadow-sm border border-green-200 bg-green-50">
          <CardContent>
            <h3 className="text-sm font-medium text-green-800">
              Today&apos;s Receivable
            </h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {inr(receivableList.totalReceivable)}
            </p>
            <p className="text-sm text-green-700">
              {receivableList.count}{" "}
              {receivableList.count === 1 ? "payment due" : "payments due"}
            </p>
            <div className="text-green-700">
              {renderMiniList(receivableList.items, "todayReceivable")}
            </div>
          </CardContent>
        </Card>

        {/* Today's Paid Amount (cash out today) */}
        <Card className="rounded-2xl shadow-sm border border-sky-200 bg-sky-50">
          <CardContent>
            <h3 className="text-sm font-medium text-sky-800">
              Today&apos;s Paid Amount
            </h3>
            <p className="text-2xl font-bold text-sky-600 mt-2">
              {inr(paidBlock.totalAmount)}
            </p>
            <p className="text-sm text-sky-700">
              {paidBlock.count}{" "}
              {paidBlock.count === 1 ? "payment made" : "payments made"}
            </p>
            <div className="text-sky-700">
              {renderMiniList(paidBlock.items, "todaysPaidAmount")}
            </div>
          </CardContent>
        </Card>

        {/* Today’s Received Amount (cash in today) */}
        <Card className="rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50">
          <CardContent>
            <h3 className="text-sm font-medium text-emerald-800">
              Today&apos;s Received Amount
            </h3>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {inr(receivedBlock.totalAmount)}
            </p>
            <p className="text-sm text-emerald-700">
              {receivedBlock.count}{" "}
              {receivedBlock.count === 1
                ? "payment received"
                : "payments received"}
            </p>
            <div className="text-emerald-700">
              {renderMiniList(receivedBlock.items, "todaysReceivedAmount")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly & Yearly Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
              <span className="font-semibold text-red-600">
                {inr(dashboardData?.monthlySummary?.totalReceivable ?? 0)}
              </span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Total Payables:</span>
              <span className="font-semibold text-green-600">
                {inr(dashboardData?.monthlySummary?.totalPayable ?? 0)}
              </span>
            </div>

            <Divider className="my-2" />

            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Net Position:</span>
              <span
              // className={`font-semibold ${
              //   (dashboardData?.monthly?.totalSellPending ?? 0) -
              //     (monthly?.totalBuyPending ?? 0) >=
              //   0
              //     ? "text-green-600"
              //     : "text-red-600"
              // }`}
              >
                {/* {inr(
                  (monthly?.totalSellPending ?? 0) -
                    (monthly?.totalBuyPending ?? 0)
                )} */}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-800">
              Yearly Summary ({new Date().getFullYear()})
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Annual financial overview and performance
            </p>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Total Revenue:</span>
              <span className="font-semibold text-blue-600">
                {inr(d.yearlySummarys?.totalRevenue ?? 0)}
              </span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Total Transactions:
              </span>
              <span className="font-semibold text-gray-800">
                {d.yearlySummarys?.totalTransactions ?? 0}
              </span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Broker Commissions:
              </span>
              <span className="font-semibold text-orange-600">
                {inr(d.yearlySummarys?.brokerCommissions ?? 0)}
              </span>
            </div>

            <Divider className="my-2" />

            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Net Profit:</span>
              <span
                className={`font-semibold ${
                  (d.yearlySummarys?.netProfit ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {inr(d.yearlySummarys?.netProfit ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
}
