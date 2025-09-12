import React, { useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  type SelectChangeEvent,
  TextField,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  fetchReport,
  setReportFilters,
  type ReportType,
} from "../../store/report/reportSlice";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const inr = (n: number = 0) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const fmtYMD = (d: Dayjs | Date | string) => dayjs(d).format("YYYY-MM-DD");
const startOfMonth = fmtYMD(dayjs().startOf("month"));
const endOfMonth = fmtYMD(dayjs().endOf("month"));
const todayYMD = fmtYMD(dayjs());

const isSingleDay = (t: ReportType) => t === "payable" || t === "receivable";

const Report: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { data, loading, filters } = useAppSelector((s) => s.report);
  console.log("data", data);
  // initialize default filters on first render
  useEffect(() => {
    dispatch(
      setReportFilters({
        type: filters.type || "payable",
        startDate: filters.startDate || todayYMD,
        endDate: filters.endDate || todayYMD,
      })
    );
  }, []);

  // fetch on filter/company change with the correct payload
  useEffect(() => {
    if (!user?.companyId || !filters.type) return;

    if (isSingleDay(filters.type)) {
      if (!filters.startDate) return;
      dispatch(
        fetchReport({
          companyId: user.companyId,
          type: filters.type,
          date: filters.startDate,
        } as any)
      );
    } else {
      if (!filters.startDate || !filters.endDate) return;
      dispatch(
        fetchReport({
          companyId: user.companyId,
          type: filters.type,
          startDate: filters.startDate,
          endDate: filters.endDate,
        } as any)
      );
    }
  }, [
    dispatch,
    user?.companyId,
    filters.type,
    filters.startDate,
    filters.endDate,
  ]);

  const onTypeChange = (e: SelectChangeEvent) => {
    const nextType = e.target.value as ReportType;

    if (isSingleDay(nextType)) {
      dispatch(
        setReportFilters({
          type: nextType,
          startDate: todayYMD,
          endDate: todayYMD,
        })
      );
    } else {
      // range defaults to current month
      dispatch(
        setReportFilters({
          type: nextType,
          startDate: startOfMonth,
          endDate: endOfMonth,
        })
      );
    }
  };

  const onSingleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    // keep both start & end in sync for single-day mode
    dispatch(setReportFilters({ startDate: d, endDate: d }));
  };

  const onDateRangeChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    const [start, end] = newValue;
    dispatch(
      setReportFilters({
        startDate: start ? fmtYMD(start) : "",
        endDate: end ? fmtYMD(end) : "",
      })
    );
  };

  const items = useMemo(() => data?.items ?? [], [data]);
  console.log("items", items);
  // friendly “Day” text (used for single-day views)
  const computeDayText = (row: any) => {
    if (!isSingleDay(filters.type)) return "—";

    if (row?.dueText) return row.dueText;
    if (row?.dueInDays !== undefined) {
      const n = Number(row.dueInDays);
      if (Number.isFinite(n)) {
        return n === 0
          ? "Due today"
          : n > 0
          ? `Due in ${n} days`
          : `${Math.abs(n)} days overdue`;
      }
    }
    if (row?.dueDate) {
      const diff = dayjs(row.dueDate).diff(dayjs(), "day");
      return diff === 0
        ? "Due today"
        : diff > 0
        ? `Due in ${diff} days`
        : `${Math.abs(diff)} days overdue`;
    }
    if (row?.createdDate) return dayjs(row.createdDate).format("YYYY-MM-DD");
    return "—";
  };

  return (
    <Box className="p-6 space-y-6">
      <Typography variant="h5" fontWeight="bold">
        Reports
      </Typography>

      {/* Filters */}
      <Card className="rounded-2xl shadow-sm border border-gray-200">
        <CardContent>
          <Box className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <FormControl size="small">
              <InputLabel id="report-type-label">Type</InputLabel>
              <Select
                labelId="report-type-label"
                label="Type"
                value={filters.type}
                onChange={onTypeChange}
              >
                <MenuItem value="payable">Payable</MenuItem>
                <MenuItem value="receivable">Receivable</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="received">Received</MenuItem>
              </Select>
            </FormControl>

            {isSingleDay(filters.type) ? (
              <TextField
                size="small"
                type="date"
                label="Date"
                value={filters.startDate || ""}
                onChange={onSingleDateChange}
                InputLabelProps={{ shrink: true }}
              />
            ) : (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateRangePicker
                  value={[
                    filters.startDate ? dayjs(filters.startDate) : null,
                    filters.endDate ? dayjs(filters.endDate) : null,
                  ]}
                  onChange={onDateRangeChange}
                />
              </LocalizationProvider>
            )}

            {/* Summary pills */}
            <Box className="flex items-center gap-6 md:col-span-2">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {inr(data?.totalAmount ?? 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Parties
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {data?.count ?? 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="rounded-2xl shadow-sm border border-gray-200">
        <CardContent>
          {loading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress size={28} />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: "12px" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: "#f9fafb" }}>
                    <TableCell>
                      <b>Party</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Amount</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Stock</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>{isSingleDay(filters.type) ? "Day" : "—"}</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell>{row.partyName ?? "—"}</TableCell>
                      <TableCell align="right">
                        {inr(Number(row.amount || 0))}
                      </TableCell>
                      <TableCell align="right">{row.stock ?? 0}</TableCell>
                      <TableCell align="right">{computeDayText(row)}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        style={{ padding: 24 }}
                      >
                        No data for selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Report;
