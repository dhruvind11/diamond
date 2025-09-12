// components/YearlySummary.tsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { fetchYearlySummary } from "../../store/dashboard/dashboardSlice";

import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Chip,
  Skeleton,
} from "@mui/material";

import {
  MonetizationOnRounded,
  ReceiptLongRounded,
  HandshakeRounded,
  TrendingUpRounded,
  TrendingDownRounded,
} from "@mui/icons-material";

import SelectComponent from "../../components/SelectComponent";

const inr = (n: number = 0) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

type Option = {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
};

const Row: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  pill?: string;
}> = ({ icon, label, value, pill }) => (
  <Box
    className="flex items-center justify-between"
    sx={{
      px: 1.5,
      py: 1,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "rgba(226,232,240,.7)",
      bgcolor: "white",
    }}
  >
    <Box className="flex items-center gap-2">
      <Box sx={{ color: "rgb(100,116,139)" }}>{icon}</Box>
      <Box className="text-sm font-medium text-slate-700">{label}</Box>
      {pill ? (
        <Chip
          label={pill}
          size="small"
          sx={{
            ml: 1,
            bgcolor: "rgb(241,245,249)",
            color: "rgb(71,85,105)",
            borderRadius: 999,
            height: 22,
          }}
        />
      ) : null}
    </Box>
    <Box className="text-sm font-semibold">{value}</Box>
  </Box>
);

const YearlySummary: React.FC = () => {
  const dispatch = useAppDispatch();
  const { diwaliCycles, cyclesLoading, yearlySummary, yearlySummaryLoading } =
    useAppSelector((s) => s.dashboard);
  const { user } = useAppSelector((s) => s.auth);

  const options: Option[] = useMemo(
    () =>
      (diwaliCycles || []).map((c) => {
        const startY = new Date(c.startDate).getFullYear();
        const endY = new Date(c.endDate).getFullYear();
        return {
          label: `${startY} - ${endY}`,
          value: c._id,
          startDate: c.startDate,
          endDate: c.endDate,
        };
      }),
    [diwaliCycles]
  );

  const [selected, setSelected] = useState<Option | null>(null);

  useEffect(() => {
    if (!options.length) return;
    const today = dayjs().startOf("day");
    const current =
      options.find(
        (o) =>
          today.isSame(dayjs(o.startDate).startOf("day")) ||
          (today.isAfter(dayjs(o.startDate).startOf("day")) &&
            today.isBefore(dayjs(o.endDate).endOf("day"))) ||
          today.isSame(dayjs(o.endDate).endOf("day"))
      ) || options[0];
    setSelected(current);
  }, [options]);

  useEffect(() => {
    if (!selected || !user?.companyId) return;
    dispatch(
      fetchYearlySummary({
        companyId: user.companyId,
        startDate: dayjs(selected.startDate).format("YYYY-MM-DD"),
        endDate: dayjs(selected.endDate).format("YYYY-MM-DD"),
      })
    );
  }, [dispatch, selected, user?.companyId]);

  // derived
  const yearLabel = selected
    ? `${dayjs(selected.startDate).year()} - ${dayjs(selected.endDate).year()}`
    : `${new Date().getFullYear()}`;

  const net = yearlySummary?.netProfit ?? 0;
  const isPositive = net >= 0;

  const badge = (
    <Box
      sx={{
        display: { xs: "none", sm: "inline-flex" },
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        bgcolor: isPositive ? "rgba(16,185,129,.12)" : "rgba(244,63,94,.12)",
        color: isPositive ? "rgb(5,122,85)" : "rgb(190,18,60)",
        border: `1px solid ${
          isPositive ? "rgba(16,185,129,.24)" : "rgba(244,63,94,.24)"
        }`,
      }}
      aria-label={isPositive ? "Net Profit" : "Net Loss"}
    >
      {isPositive ? (
        <TrendingUpRounded fontSize="small" />
      ) : (
        <TrendingDownRounded fontSize="small" />
      )}
      {isPositive ? "Profit" : "Loss"}
    </Box>
  );

  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <CardHeader
        title={`Yearly Summary (${yearLabel})`}
        subheader="Annual financial overview and performance"
        action={
          <Box sx={{ minWidth: 220 }}>
            <SelectComponent
              options={options}
              name="yearCycle"
              id="yearCycle"
              value={selected}
              onChange={(opt: Option) => setSelected(opt)}
              isLoading={cyclesLoading}
            />
          </Box>
        }
        sx={{
          pb: 1.5,
          background:
            "linear-gradient(90deg, rgb(248,250,252) 0%, rgb(255,255,255) 100%)",
          "& .MuiCardHeader-title": {
            fontWeight: 700,
            fontSize: "1rem",
            color: "rgb(30,41,59)",
          },
          "& .MuiCardHeader-subheader": {
            color: "rgb(100,116,139)",
            fontSize: "0.875rem",
            mt: 0.25,
          },
        }}
      />
      <CardContent className="!pt-0 !py-2">
        {yearlySummaryLoading ? (
          <Box className="flex flex-col gap-3">
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={44} />
          </Box>
        ) : yearlySummary ? (
          <Box className="grid gap-2">
            <Row
              icon={<MonetizationOnRounded fontSize="small" />}
              label="Total Revenue"
              value={
                <Box sx={{ color: "rgb(37,99,235)" }}>
                  {inr(yearlySummary.totalRevenue)}
                </Box>
              }
              pill={yearLabel}
            />
            <Row
              icon={<ReceiptLongRounded fontSize="small" />}
              label="Total Transactions"
              value={
                <Box sx={{ color: "rgb(15,23,42)" }}>
                  {yearlySummary.totalTransactions}
                </Box>
              }
            />
            <Row
              icon={<HandshakeRounded fontSize="small" />}
              label="Broker Commissions"
              value={
                <Box sx={{ color: "rgb(234,88,12)" }}>
                  {inr(yearlySummary.brokerCommissions)}
                </Box>
              }
            />
            <Box
              className="flex items-center justify-between"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "rgba(226,232,240,.7)",
                bgcolor: "white",
              }}
            >
              <Box className="text-sm font-semibold text-slate-800">
                Net Profit
              </Box>
              <Chip
                label={inr(net)}
                sx={{
                  fontWeight: 700,
                  bgcolor: isPositive
                    ? "rgba(16,185,129,.12)"
                    : "rgba(244,63,94,.12)",
                  color: isPositive ? "rgb(5,122,85)" : "rgb(190,18,60)",
                  border: `1px solid ${
                    isPositive ? "rgba(16,185,129,.24)" : "rgba(244,63,94,.24)"
                  }`,
                }}
                icon={
                  isPositive ? (
                    <TrendingUpRounded sx={{ color: "inherit" }} />
                  ) : (
                    <TrendingDownRounded sx={{ color: "inherit" }} />
                  )
                }
                variant="filled"
              />
            </Box>
            {/* Optional top-right profit/loss badge */}
            <Box className="mt-1">{badge}</Box>
          </Box>
        ) : (
          <Box className="text-sm text-gray-500">
            No data for selected cycle.
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default YearlySummary;
