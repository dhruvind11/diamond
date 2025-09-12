import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import AxiosRequest from "../../AxiosRequest";
import { toast } from "react-toastify";

export type ReportType = "payable" | "receivable" | "paid" | "received";

type ReportItem = {
  partyId?: string;
  partyName?: string;
  amount?: number;
  stock?: number;
  dueInDays?: number; // for payable/receivable (if backend sends)
  dueDate?: string; // "YYYY-MM-DD" (if backend sends)
  createdDate?: string; // for paid/received (if backend sends)
  dueText?: string; // optional label "in 5 days" / "7 days overdue"
  type?: string; // e.g., "broker"
};

type ReportData = {
  totalAmount?: number;
  count?: number;
  items?: ReportItem[];
};

export interface ReportState {
  loading: boolean;
  error: string | null;
  data: ReportData | null;
  filters: {
    type: ReportType;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
}

const initialState: ReportState = {
  loading: false,
  error: null,
  data: null,
  filters: {
    type: "payable",
    startDate: "", // set in component
    endDate: "", // set in component
  },
};

export const fetchReport = createAsyncThunk(
  "report/fetch",
  async (args: any, { rejectWithValue }) => {
    try {
      const { companyId, type } = args;

      // Build body correctly for each mode
      let body: any = { type };
      if (type === "payable" || type === "receivable") {
        body.date = args.date;
      } else {
        const { startDate, endDate } = args;
        body.startDate = startDate;
        body.endDate = endDate;
      }

      const res = await AxiosRequest.post(`/report/${companyId}`, body);
      return res.data?.data; // normalize to your API shape
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to fetch report"
      );
    }
  }
);

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    setReportFilters(
      state,
      action: PayloadAction<Partial<ReportState["filters"]>>
    ) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearReport(state) {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload ?? { totalAmount: 0, count: 0, items: [] };
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
        toast.error(state.error);
      });
  },
});

export const { setReportFilters, clearReport } = reportSlice.actions;
export default reportSlice.reducer;
