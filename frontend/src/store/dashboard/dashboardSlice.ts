import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
  } from "@reduxjs/toolkit";
  import AxiosRequest from "../../AxiosRequest";
  import { toast } from "react-toastify";
  
  interface dashboardStateType {
    dashboardData: any;
    loading: boolean;
    error: string | null;
  }
  
  const initialState: dashboardStateType = {
    dashboardData: null,
    loading: false,
    error: null,
  };
  
  export const fetchDashboardData = createAsyncThunk(
    "dashboard/fetchDashboardData",
    async ({ companyId }: { companyId: string }, { rejectWithValue }) => {
      try {
        const { data } = await AxiosRequest.get(
          `ledger/dashboard-summary/${companyId}`
        );
        return data?.data;
      } catch (error: any) {
        toast.error("Failed to fetch dashboard data");
        return rejectWithValue(error.response?.data?.message || "Unknown error");
      }
    }
  );
  
  export const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchDashboardData.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(
          fetchDashboardData.fulfilled,
          (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.dashboardData = action.payload;
          }
        )
        .addCase(fetchDashboardData.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
    },
  });
  
  export const {} = dashboardSlice.actions;
  
  // export const selectdashboard = (state: RootState) => state.dashboard;
  
  export default dashboardSlice.reducer;
  