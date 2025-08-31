import { Paper, TextField, Button, InputAdornment, Box } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { useState } from "react";
import { useAppDispatch } from "../../store/store";
import { loginUser } from "../../store/auth/authSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [errors, setErrors] = useState<any>({});
  const [loginUserData, setLoginUserData] = useState({
    email: "",
    password: "",
  });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const validate = () => {
    const errors: any = {};
    let isValid = true;

    if (!loginUserData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginUserData.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }
    if (!loginUserData.password) {
      errors.password = "Password is required";
      isValid = false;
    }
    setErrors((prevError: any) => ({ ...prevError, ...errors }));
    return isValid;
  };

  const onChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLoginUserData({ ...loginUserData, [name]: value });
    setErrors((prevError: any) => ({ ...prevError, [name]: "" }));
  };

  console.log("loginUserData", loginUserData);
  const handleLogin = async (e: any) => {
    console.log("loginnnn");
    e.preventDefault();
    if (!validate()) return;
    await dispatch(loginUser(loginUserData));
    navigate("/dashboard");
  };

  console.log("error", errors);
  return (
    <div className="flex items-center justify-center w-full h-screen bg-blue-50">
      <Paper
        elevation={3}
        className="p-8 w-full max-w-md border border-none rounded-xl"
      >
        <Box className="font-semibold text-gray-800 text-center text-3xl">
          Welcome Back
        </Box>
        <Box className="text-gray-500 mb-8 mt-2 text-center">
          Enter your credentials to access your account.
        </Box>
        <form className="space-y-4" onSubmit={handleLogin}>
          <Box className="!mb-4">
            <TextField
              placeholder="Enter your email"
              type="email"
              name="email"
              fullWidth
              variant="outlined"
              size="small"
              onChange={onChangeHandler}
              slotProps={{
                input: {
                  className: "!py-1",
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon className="text-gray-400" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {errors?.email && (
              <span className="text-xs text-[red]">{errors?.email}</span>
            )}
          </Box>
          <Box className="!mb-4">
            <TextField
              placeholder="Enter your password"
              type="password"
              fullWidth
              name="password"
              variant="outlined"
              size="small"
              onChange={onChangeHandler}
              slotProps={{
                input: {
                  className: "!py-1",
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon className="text-gray-400" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {errors?.password && (
              <span className="text-xs text-[red]">{errors?.password}</span>
            )}
          </Box>

          <Button
            type="submit"
            className=" !px-3 mt-4 mb-4 !block !m-auto !bg-gradient-to-l !from-[#003A74] !to-[#006AD5] !shadow-[1px_5px_9px_rgba(211,211,211,0.9)] !text-white"
          >
            Log In
          </Button>
        </form>
      </Paper>
    </div>
  );
};

export default Login;
