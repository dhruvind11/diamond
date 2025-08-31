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
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { useEffect, useState } from "react";
import { resetMessage, updateCompanyUser } from "../../../store/user/userSlice";

const EditCompanyUserForm = ({ openModal, setOpenModal }: any) => {
  const dispatch = useAppDispatch();

  const { singleCompanyUser } = useAppSelector((state) => state.user);
  const [formField, setFormField] = useState<any>({
    username: "",
    email: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (singleCompanyUser) {
      setFormField({
        username: singleCompanyUser?.username || "",
        email: singleCompanyUser?.email || "",
        address: singleCompanyUser?.address || "",
        bankName: singleCompanyUser?.bankName || "",
        accountNo: singleCompanyUser?.accountNo || "",
        ifscCode: singleCompanyUser?.ifscCode || "",
      });
    }
  }, [singleCompanyUser]);

  const handleClose = () => {
    setOpenModal(false);
    setFormField({});
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormField({
      ...formField,
      [name]: value,
    });
    setErrors((prevError: any) => ({ ...prevError, [name]: "" }));
  };

  const validate = () => {
    let tempErrors: any = {};
    if (!formField.username.trim()) {
      tempErrors.username = "Name is required";
    }
    if (!formField.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formField.email)) {
      tempErrors.email = "Invalid email format";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await dispatch(
      updateCompanyUser({
        userId: singleCompanyUser?._id,
        updatedData: formField,
      })
    );
    setTimeout(() => {
      dispatch(resetMessage());
    }, 1500);
    handleClose();
  };
  return (
    <Dialog open={openModal} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle className="!font-semibold !text-lg">Edit User</DialogTitle>
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
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCompanyUserForm;
