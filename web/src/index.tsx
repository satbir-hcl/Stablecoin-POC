import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { store } from "./app/store";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import Landing from "./components/LandingPages/Landing";
import LandingDemo from "./components/LandingPages/LandingDemo";
import LandingBanks from "./components/LandingPages/LandingBanks";
import LandingCustomer from "./components/LandingPages/LandingCustomers";
import CustomLandingBanks from "./components/CustomUI/CustomLandingBanks";
import CustomLandingCustomers from "./components/CustomUI/CustomLandingCustomers";
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Landing />} />
      <Route path="demo" element={<LandingDemo />} />
      <Route path="banks" element={<LandingBanks />} />
      <Route path="customers" element={<LandingCustomer />} />
      <Route path="customBanks" element={<CustomLandingBanks />}/>
      <Route path="customCustomers" element={<CustomLandingCustomers />}/>
    </>
  )
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider>
        <RouterProvider router={router} />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
