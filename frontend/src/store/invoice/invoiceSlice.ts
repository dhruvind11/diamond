import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import AxiosRequest from "../../AxiosRequest";
import { toast } from "react-toastify";
interface invoiceStateType {
  loading: boolean;
  invoiceData: any;
  singleInvoiceData: any;
  nextInvoiceNumber: number;
  error: string | null;
}

const initialState: invoiceStateType = {
  invoiceData: [],
  singleInvoiceData: {},
  nextInvoiceNumber: 0,
  loading: false,
  error: null,
};

export const createInvoice = createAsyncThunk(
  "invoice/createInvoice",
  async (formData: any, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.post(`/invoice`, formData);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const getInvoice = createAsyncThunk(
  "invoice/getInvoice",
  async ({ companyId }: { companyId: string }, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.get(`/invoice/${companyId}`);
      console.log("data", data);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const getNextInvoiceNumber = createAsyncThunk(
  "invoice/getNextInvoiceNumber",
  async ({ rejectWithValue }: any) => {
    try {
      const { data } = await AxiosRequest.get(`/invoice/next-number`);
      console.log("data", data);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const getInvoiceById = createAsyncThunk(
  "invoice/getInvoiceById",
  async ({ invoiceId }: { invoiceId: string }, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.get(`/invoice/details/${invoiceId}`);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  "invoice/deleteInvoice",
  async ({ invoiceId }: { invoiceId: string }, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.delete(`/invoice/${invoiceId}`);
      return data?.data?.deletedInvoiceId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const makePayment = createAsyncThunk(
  "invoice/makePayment",
  async (
    { invoiceId, paymentData }: { invoiceId: string; paymentData: any },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await AxiosRequest.post(
        `/invoice/payment/${invoiceId}`,
        paymentData
      );
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoice.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.invoiceData = action?.payload;
      })
      .addCase(getInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getNextInvoiceNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getNextInvoiceNumber.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.nextInvoiceNumber = action?.payload;
        }
      )
      .addCase(getNextInvoiceNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getInvoiceById.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.singleInvoiceData = action.payload;
        }
      )
      .addCase(getInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.invoiceData = [...state?.invoiceData, action.payload];
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload as string;
      })
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteInvoice.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.invoiceData = state.invoiceData.filter(
            (invoice: any) => invoice._id !== action.payload
          );
        }
      )
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(makePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(makePayment.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        console.log("action.payload", action.payload?.invoice);
        state.invoiceData = state.invoiceData.map((invoice: any) =>
          invoice._id === action.payload?.invoice._id
            ? action.payload?.invoice
            : invoice
        );
        toast.success("Payment Successfully");
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export const {} = invoiceSlice.actions;

// export const selectinvoice = (state: RootState) => state.invoice;

export default invoiceSlice.reducer;
