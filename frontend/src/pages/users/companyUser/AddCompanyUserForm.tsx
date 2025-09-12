import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputLabel,
  TextField,
} from "@mui/material";
import { userInputField } from "../../../utils/enum/user";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import {
  createBrokerUser,
  createPartyUser,
  resetMessage,
} from "../../../store/user/userSlice";
import { isValidEmail } from "../../../utils/validation";

const AddCompanyUserForm = ({ openModal, setOpenModal, modalType }: any) => {
  const [formField, setFormField] = useState<Record<string, any>>({});
  const { user } = useAppSelector((state: any) => state.auth);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();
  const handleClose = () => {
    setOpenModal(false);
    setFormField({});
    setErrors({});
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormField((prev) => ({ ...prev, [name]: value }));
    setErrors((prevError: any) => ({ ...prevError, [name]: "" }));
  };

  // Validation function
  const validateForm = () => {
    const errors: any = {};
    let isValid = true;
    if (!formField?.username) {
      errors.username = "Name is required";
      isValid = false;
    }
    if (!formField?.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (formField?.email) {
      if (!isValidEmail(formField?.email)) {
        errors.email = "Please Enter Valid Email";
        isValid = false;
      }
    }
    if (!formField?.password) {
      errors.password = "Password is required";
      isValid = false;
    }
    setErrors((prevError: any) => ({ ...prevError, ...errors }));
    return isValid;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (modalType === "broker") {
        await dispatch(
          createBrokerUser({ ...formField, companyId: user?.companyId })
        );
        setTimeout(() => {
          dispatch(resetMessage());
        }, 1500);
      } else if (modalType === "party") {
        await dispatch(
          createPartyUser({ ...formField, companyId: user?.companyId })
        );
        setTimeout(() => {
          dispatch(resetMessage());
        }, 1500);
      }
      handleClose();
    } catch (error: any) {
      console.error(
        "Error creating user:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <Dialog open={openModal} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle className="!font-semibold !text-lg">
        {modalType === "broker" ? "Add Broker" : "Add User"}
      </DialogTitle>
      <DialogContent dividers>
        {userInputField?.map((field: any, index: number) => {
          const { type, name, label } = field;

          return (
            <Box key={index} className="mb-3">
              <InputLabel
                htmlFor={name}
                className="!whitespace-pre-wrap !font-medium !text-sm !text-black !inline"
              >
                {label}
              </InputLabel>

              <TextField
                id={name}
                name={name}
                type={
                  type === "password"
                    ? "password"
                    : type === "number"
                    ? "number"
                    : "text"
                }
                variant="outlined"
                fullWidth
                size="small"
                placeholder={`Enter ${label}`}
                className="!mt-1"
                value={formField[name] || ""}
                onChange={handleChange}
              />
              {errors[name] && (
                <span className="text-xs text-[red]">{errors[name]}</span>
              )}
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          className="!bg-[#3a2ae2b3] !text-white"
          onClick={handleSubmit}
          //   disabled={loading}
        >
          save
          {/* {loading ? "Saving..." : "Save"} */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCompanyUserForm;
