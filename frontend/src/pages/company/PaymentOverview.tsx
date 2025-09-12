import type React from "react";
import { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Tabs, Tab } from "@mui/material";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FiAlertCircle, FiAlertTriangle } from "react-icons/fi";
import { TrendingDown, TrendingUp } from "@mui/icons-material";
import { FaClock } from "react-icons/fa";
import CardComponent from "../../components/CardComponent";
import { useAppSelector } from "../../store/store";

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

const asArray = (x: unknown) => (Array.isArray(x) ? x : []);

export function PaymentOverview() {
  const [tabValue, setTabValue] = useState(0);
  const { paymentSummary } = useAppSelector((state) => state.dashboard);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const {
    todayPayableItems,
    todayReceivableItems,
    todayPaidItems,
    todayReceivedItems,
    upcomingDueItems,
    upcomingRecvItems,
    overduePayableItems,
    overdueReceivableItems,
    overdue30PayableItems,
    overdue30ReceivableItems,
  } = useMemo(() => {
    const ps = paymentSummary ?? {};

    // TODAY (due today lists)
    const todayPayableItems = asArray(
      ps?.todayPayment?.todayPayableList?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.type ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
    }));

    const todayReceivableItems = asArray(
      ps?.todayPayment?.todayReceivableList?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.type ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
    }));

    // TODAY (cash movements from ledger)
    const todayPaidItems = asArray(
      ps?.todayPayment?.todaysPaidAmount?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
    }));

    const todayReceivedItems = asArray(
      ps?.todayPayment?.todaysReceivedAmount?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.type ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
    }));

    // UPCOMING (next 30 days)
    const upcomingDueItems = asArray(
      ps?.upcomingPayments?.paymentsDue?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
      dueText: r?.dueInDays != null ? `Due in ${r.dueInDays} days` : undefined,
    }));

    const upcomingRecvItems = asArray(
      ps?.upcomingPayments?.expectedReceivables?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
      dueText: r?.dueInDays != null ? `Due in ${r.dueInDays} days` : undefined,
    }));

    // OVERDUE (1–30)
    const overduePayableItems = asArray(
      ps?.overduePayments?.overduePayments?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
      dueText:
        r?.overdueDays != null ? `${r.overdueDays} days overdue` : undefined,
    }));

    const overdueReceivableItems = asArray(
      ps?.overduePayments?.overdueReceivables?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
      dueText:
        r?.overdueDays != null ? `${r.overdueDays} days overdue` : undefined,
    }));

    // OVERDUE (30+)
    const overdue30PayableItems = asArray(
      ps?.overdue30Plus?.overduePayments?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
      dueText:
        r?.overdueDays != null ? `${r.overdueDays} days overdue` : undefined,
    }));

    const overdue30ReceivableItems = asArray(
      ps?.overdue30Plus?.overdueReceivables?.items
    ).map((r: any, i: number) => ({
      id: r.invoiceId ?? i,
      party: r.partyName ?? "—",
      type: r.partyType ?? "—",
      stock: r.stock,
      amount: Number(r.amount) || 0,
      dueText:
        r?.overdueDays != null ? `${r.overdueDays} days overdue` : undefined,
    }));

    return {
      todayPayableItems,
      todayReceivableItems,
      todayPaidItems,
      todayReceivedItems,
      upcomingDueItems,
      upcomingRecvItems,
      overduePayableItems,
      overdueReceivableItems,
      overdue30PayableItems,
      overdue30ReceivableItems,
    };
  }, [paymentSummary]);

  console.log("todayPayableItems", todayPayableItems);
  console.log("todayPaidItems", todayPaidItems);
  console.log("overduePayableItems", overduePayableItems);
  return (
    <div className="w-full mx-auto py-4">
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

          {/* TODAY */}
          <TabPanel value={tabValue} index={0}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardComponent
                title="Today Payable"
                icon={<FiAlertCircle className="h-5 w-5 text-red-600" />}
                color="red"
                items={todayPayableItems}
                totalLabel="Total Payable"
              />
              <CardComponent
                title="Today Receivable"
                icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
                color="blue"
                items={todayReceivableItems}
                totalLabel="Total Receivable"
              />
              <CardComponent
                title="Today Paid"
                icon={<TrendingDown className="h-5 w-5 text-orange-600" />}
                color="orange"
                items={todayPaidItems}
                totalLabel="Total Paid"
              />
              <CardComponent
                title="Today Received"
                icon={<FaIndianRupeeSign className="h-5 w-5 text-green-600" />}
                color="green"
                items={todayReceivedItems}
                totalLabel="Total Received"
              />
            </div>
          </TabPanel>

          {/* UPCOMING (next 30 days) */}
          <TabPanel value={tabValue} index={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardComponent
                title="Upcoming Payments Due"
                icon={<FaClock className="h-5 w-5 text-yellow-600" />}
                color="yellow"
                items={upcomingDueItems}
                totalLabel="Total Due"
              />
              <CardComponent
                title="Expected Receivables"
                icon={<TrendingUp className="h-5 w-5 text-cyan-600" />}
                color="cyan"
                items={upcomingRecvItems}
                totalLabel="Total Expected"
              />
            </div>
          </TabPanel>

          {/* OVERDUE (1–30) */}
          <TabPanel value={tabValue} index={2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardComponent
                title="Overdue Payables"
                icon={<FiAlertTriangle className="h-5 w-5 text-orange-600" />}
                color="orange"
                items={overduePayableItems}
                totalLabel="Total Overdue"
              />
              <CardComponent
                title="Overdue Receivables"
                icon={<FiAlertCircle className="h-5 w-5 text-red-600" />}
                color="red"
                items={overdueReceivableItems}
                totalLabel="Total Overdue"
              />
            </div>
          </TabPanel>

          {/* OVERDUE (30+) */}
          <TabPanel value={tabValue} index={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardComponent
                title="Overdue Payables (30+ days)"
                icon={<FiAlertCircle className="h-5 w-5 text-red-700" />}
                color="red"
                items={overdue30PayableItems}
                totalLabel="Total Severely Overdue"
              />
              <CardComponent
                title="Overdue Receivables (30+ days)"
                icon={<FiAlertTriangle className="h-5 w-5 text-red-700" />}
                color="red"
                items={overdue30ReceivableItems}
                totalLabel="Total Severely Overdue"
              />
            </div>
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
}
