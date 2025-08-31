import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import { useAppDispatch, useAppSelector } from "../store/store";
import { useEffect } from "react";
import { getCurrentUser } from "../store/auth/authSlice";

const VerticalNavbar = ({ children }: any) => {
  const { authToken } = useAppSelector((state) => state.auth);
  const accessToken = localStorage.getItem("authToken");
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (accessToken) {
      console.log("inside use effect");
      dispatch(getCurrentUser());
    }
  }, [authToken, accessToken]);
  return (
    <Box className="flex">
      <Sidebar />
      <Box className="ml-[15%] w-[85%]">{children}</Box>
    </Box>
  );
};

export default VerticalNavbar;
