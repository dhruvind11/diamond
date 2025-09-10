import axios from "axios";
import { toast } from "react-toastify";

const AxiosRequest = axios.create({
  baseURL: `${import.meta.env.VITE_REACT_APP_API_END_POINT}`,
});

AxiosRequest.interceptors.request.use((config: any) => {
  const accessToken = localStorage.getItem("authToken");
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// const axiosInstance = axios.create();

AxiosRequest.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // get url
    const url = window.location.pathname;
    const parts = url.split("/");
    const id = parts[parts.length - 1];
    console.log("error ---------------------", error);
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    toast.error(error?.response?.data?.message);

    if (
      error.response.data.statusCode === 401 ||
      error.response.data.statusCode === 503
    ) {
      console.log("************************", error);
      try {
        // const { data } = await axios({
        //   method: "PUT",
        //   url: `${
        //     import.meta.env.VITE_REACT_APP_API_END_POINT
        //   }/api/auth/refresh-token`,
        //   headers: {
        //     Authorization: `Bearer ${localStorage.getItem("refreshToken")}`,
        //   },
        // });
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        // localStorage.setItem("authToken", data.access_token);
        // localStorage.setItem("refreshToken", data.refresh_token);
        // const { data: configData, ...configWithoutData } = error.config;
        // const isFormData = configData instanceof FormData;
        // return await axiosInstance({
        //   ...configWithoutData,
        //   ...(configData && {
        //     data: isFormData ? configData : JSON.parse(configData) || null,
        //   }),
        //   headers: {
        //     Authorization: `Bearer ${data.access_token}`,
        //   },
        // });
      } catch (error: any) {}
    }
    return Promise.reject(error);
  }
);
export default AxiosRequest;
