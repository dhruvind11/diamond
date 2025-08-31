import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: any) => {
  const authToken = localStorage.getItem("authToken");
  return authToken ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
