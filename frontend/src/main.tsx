import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";
import { Slide, ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Provider store={store}>
    <ToastContainer
      limit={3}
      position="top-right"
      style={{
        width: "400px",
      }}
      autoClose={5000}
      hideProgressBar={true}
      newestOnTop={true}
      closeOnClick
      pauseOnFocusLoss
      pauseOnHover
      draggable
      transition={Slide}
    />
    <App />
  </Provider>
  // </StrictMode>
);
