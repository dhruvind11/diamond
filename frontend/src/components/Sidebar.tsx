import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { FaRainbow } from "react-icons/fa6";
import { LuUsers } from "react-icons/lu";
import { useAppSelector } from "../store/store";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import logoImage from "../../public/eco-5465482_1280.webp";
import { FiLogOut } from "react-icons/fi";
import LogoutConfirmationPopup from "./LogoutConfirmationPopup";

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const [openLogout, setOpenLogout] = useState(false);

  const { company } = useAppSelector((state) => state.auth);
  const sidebarMenu = [
    { name: "Dashboard", icon: FaRainbow, param: "/dashboard" },
    { name: "User", icon: LuUsers, param: "/user" },
    {
      name: "Invoice",
      icon: LiaFileInvoiceSolid,
      param: "/invoice",
    },
    {
      name: "Ledger",
      icon: LiaFileInvoiceSolid,
      param: "/ledger",
    },
  ];
  return (
    <Box className="w-[15%] h-screen bg-white flex flex-col shadow fixed left-0 top-0 z-20">
      <Box className="flex items-center justify-between p-2 border-b-1 border-[#eee]">
        <Box className="flex items-center">
          <Box className="flex items-center justify-center">
            <img
              src={logoImage}
              alt=""
              className="w-14 h-14 md:w-16 md:h-16"
              loading="lazy"
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {company?.companyName}
          </Typography>
        </Box>
      </Box>

      <List>
        {sidebarMenu?.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.param;

          return (
            <Link
              key={item.name}
              to={item.param}
              className={`flex items-center gap-3 px-3 py-1.5 m-1.5 rounded-md mb-1 transition-colors 
                ${
                  isActive
                    ? "bg-[#3a2ae2b3] text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-white" : "text-gray-500"}
              />
              <span className="text-lg font-medium">{item.name}</span>
            </Link>
          );
        })}
        <Box
          onClick={() => setOpenLogout(true)}
          className="flex items-center gap-3 px-3 py-1.5 m-1.5 rounded-md mb-1 transition-colors text-gray-700 hover:bg-red-100 cursor-pointer"
        >
          <FiLogOut size={18} className="text-red-500" />
          <span className="text-lg font-medium text-red-500">Logout</span>
        </Box>
      </List>

      {openLogout && (
        <LogoutConfirmationPopup
          openLogout={openLogout}
          setOpenLogout={setOpenLogout}
          company={company}
        />
      )}
    </Box>
  );
};

export default Sidebar;
