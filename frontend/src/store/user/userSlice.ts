import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";
import AxiosRequest from "../../AxiosRequest";
import { toast } from "react-toastify";

interface UserStateType {
  companyUsers: any;
  singleCompanyUser: any;
  message: string;
  createUserLoader: boolean;
  updateUserLoader: boolean;
  deleteUserLoader: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserStateType = {
  companyUsers: [],
  singleCompanyUser: {},
  message: "",
  createUserLoader: false,
  updateUserLoader: false,
  deleteUserLoader: false,
  loading: false,
  error: null,
};

export const getAllCompanyUser = createAsyncThunk(
  "user/companyUser",
  async ({ companyId }: { companyId: string }, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.get(`/users/${companyId}`);
      console.log("data123", data);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const createBrokerUser = createAsyncThunk(
  "user/brokerUser",
  async (formData: any, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.post(
        `/users/create-broker-user`,
        formData
      );
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const createPartyUser = createAsyncThunk(
  "user/partyUser",
  async (formData: any, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.post(
        `/users/create-party-user`,
        formData
      );
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const deleteCompanyUser = createAsyncThunk(
  "user/deleteCompanyUser",
  async ({ userId }: any, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.delete(`/users/${userId}`);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const updateCompanyUser = createAsyncThunk(
  "user/updateCompanyUser",
  async ({ userId, updatedData }: any, { rejectWithValue }) => {
    try {
      const { data } = await AxiosRequest.patch(
        `/users/${userId}`,
        updatedData
      );
      console.log("data", data);
      return data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    getSingleUser: (state, action: PayloadAction<string>) => {
      state.singleCompanyUser = action.payload;
    },
    resetMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCompanyUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllCompanyUser.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.companyUsers = action?.payload;
        }
      )
      .addCase(getAllCompanyUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBrokerUser.pending, (state) => {
        state.loading = true;
        state.message = "Saving...";
        state.error = null;
      })
      .addCase(
        createBrokerUser.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.message = "Saved";
          state.companyUsers = [...state.companyUsers, action.payload];
        }
      )
      .addCase(createBrokerUser.rejected, (state, action) => {
        state.loading = false;
        state.message = "";
        state.error = action.payload as string;
      })
      .addCase(createPartyUser.pending, (state) => {
        state.loading = true;
        state.message = "Saving...";
        state.error = null;
      })
      .addCase(
        createPartyUser.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.message = "Saved";
          state.companyUsers = [...state.companyUsers, action.payload];
          toast.success("Party user has been created successfully.");
        }
      )
      .addCase(createPartyUser.rejected, (state, action) => {
        state.loading = false;
        state.message = "";
        state.error = action.payload as string;
      })
      .addCase(updateCompanyUser.pending, (state) => {
        state.loading = true;
        state.message = "Saving...";
        state.error = null;
      })
      .addCase(
        updateCompanyUser.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.message = "Saved";
          state.companyUsers = state.companyUsers.map((user: any) =>
            user?._id === action.payload._id ? action.payload : user
          );
        }
      )
      .addCase(updateCompanyUser.rejected, (state, action) => {
        state.loading = false;
        state.message = "";
        state.error = action.payload as string;
      })
      .addCase(deleteCompanyUser.pending, (state) => {
        state.loading = true;
        state.message = "Saving...";
        state.error = null;
      })
      .addCase(
        deleteCompanyUser.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.message = "Saved";
          state.companyUsers = state.companyUsers.filter(
            (user: any) => user?._id !== action.payload._id
          );
        }
      )
      .addCase(deleteCompanyUser.rejected, (state, action) => {
        state.loading = false;
        state.message = "";
        state.error = action.payload as string;
      });
  },
});

export const { getSingleUser, resetMessage } = userSlice.actions;

export const selectUser = (state: RootState) => state.user;

export default userSlice.reducer;
