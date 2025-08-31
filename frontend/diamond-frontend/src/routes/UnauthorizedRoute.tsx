import { Navigate } from "react-router-dom";

const UnauthorizedRoute = ({ children }: any) => {
  const authToken = localStorage.getItem("authToken");
  return authToken ? <Navigate to="/dashboard" /> : children;
};

export default UnauthorizedRoute;
