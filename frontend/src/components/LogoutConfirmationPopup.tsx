import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useAppDispatch } from "../store/store";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/auth/authSlice";

const LogoutConfirmationPopup = ({
  openLogout,
  setOpenLogout,
  company,
}: any) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogoutConfirm = () => {
    setOpenLogout(false);
    dispatch(logout());
    navigate("/");
  };
  return (
    <div>
      <Dialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out from {company?.companyName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogout(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LogoutConfirmationPopup;
