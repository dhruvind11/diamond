import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";
import AxiosRequest from "../../AxiosRequest";
import { toast } from "react-toastify";

interface AuthStateType {
  authToken: string;
  refreshToken: string;
  user: any;
  company: any;
  loading: boolean;
  error: string | null;
}

const initialState: AuthStateType = {
  user: {},
  company: {},
  authToken: "",
  refreshToken: "",
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    loginUserData: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await AxiosRequest.post("/auth/login", loginUserData);
      return res.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const getCurrentUser = createAsyncThunk("auth/currentUser", async () => {
  try {
    const { data } = await AxiosRequest.get("/auth/profile");
    console.log("data123", data);
    return data.data;
  } catch (error: any) {
    // return rejectWithValue(error.response?.data || "Something went wrong");
  }
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = {};
      state.authToken = "";
      state.refreshToken = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action?.payload?.userData;
        state.company = action?.payload?.company;
        state.authToken = action?.payload?.tokenData?.token || "";
        state.refreshToken = action?.payload?.refreshTokenData?.token || "";
        if (state.authToken) {
          localStorage.setItem("authToken", state.authToken);
        }
        if (state.refreshToken) {
          localStorage.setItem("refreshToken", state.refreshToken);
        }
        toast.success("Login Successfully!");
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getCurrentUser.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.user = action?.payload?.user;
          state.company = action?.payload?.company;
        }
      )
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
