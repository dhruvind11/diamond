import Box from "@mui/material/Box";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import UnauthorizedRoute from "./UnauthorizedRoute";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/company/Dashboard";
import UserListing from "../pages/users/userListing";
import VerticalNavbar from "../components/VerticalNavbar";
import AddInvoice from "../pages/invoice/AddInvoice";
import InvoiceListing from "../pages/invoice/InvoiceListing";
import LedgerListing from "../pages/ledger/LedgerListing";
import InvoicePreview from "../pages/invoice/InvoicePreview";
import PartyLedgerDetail from "../pages/ledger/PartyLedgerDetail";

const AppRoutes = () => {
  return (
    <Box>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <UnauthorizedRoute>
                <Login />
              </UnauthorizedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <Dashboard />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <UserListing />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoice"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <InvoiceListing />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-invoice"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <AddInvoice />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />

          <Route
            path="/preview-invoice/:id"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <InvoicePreview />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledger"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <LedgerListing />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ledger/:id"
            element={
              <ProtectedRoute>
                <VerticalNavbar>
                  <PartyLedgerDetail />
                </VerticalNavbar>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </Box>
  );
};

export default AppRoutes;
