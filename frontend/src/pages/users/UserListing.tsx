import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { FaRegEdit, FaSpinner, FaUserCircle } from "react-icons/fa";
import { MdDelete, MdEmail } from "react-icons/md";
import { FaUsers } from "react-icons/fa6";
import { useEffect, useState } from "react";
import {
  deleteCompanyUser,
  getAllCompanyUser,
  getSingleUser,
  resetMessage,
} from "../../store/user/userSlice";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { TbPencilX } from "react-icons/tb";
import DeletePopupMessage from "../../components/DeletePopupMessage";
import EditCompanyUserForm from "./companyUser/EditCompanyUserForm";
import AddCompanyUserForm from "./companyUser/AddCompanyUserForm";

const UserListing = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: any) => state.auth);
  const { companyUsers, loading, singleCompanyUser, message } = useAppSelector(
    (state: any) => state.user
  );
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>("");

  const [modalType, setModalType] = useState<"broker" | "party" | null>(null);
  console.log("singleCompanyUser", singleCompanyUser);
  console.log("companyUsers", companyUsers);
  useEffect(() => {
    if (user?.companyId) {
      dispatch(getAllCompanyUser({ companyId: user.companyId }));
    }
  }, [user]);
  const iconDetails = [
    { icon: <FaUserCircle size={20} className="ml-1.5 mr-2" />, label: "Name" },
    { icon: <MdEmail />, label: "Email" },
    { icon: <FaUsers />, label: "Role" },
    {
      icon: <TbPencilX fill="black" size={18} />,
      label: "Action",
    },
  ];

  const handleOpen = (type: "broker" | "party") => {
    setModalType(type);
    setOpenModal(true);
  };
  const handleDelete = async () => {
    if (selectedUserId) {
      await dispatch(deleteCompanyUser({ userId: selectedUserId }));
      setTimeout(() => {
        dispatch(resetMessage());
      }, 1500);
    }
    setConfirmation(false);
    setSelectedUserId("");
  };
  const handleDeleteClick = (id: string) => {
    setSelectedUserId(id);
    setConfirmation(true);
  };
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Box className="flex justify-between">
        <Box className="text-2xl font-semibold">User Lisitng</Box>
        <Box className="flex gap-x-2">
          <Box className="flex items-center">
            {loading && <FaSpinner className="animate-spin" />}
            <Box className="text-sm font-semibold">{message}</Box>
          </Box>
          <Button
            size="small"
            variant="contained"
            className="!bg-[#3a2ae2b3] !text-xs !rounded-md !py-1.5 !capitalize"
            onClick={() => handleOpen("party")}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden" }} className="mt-4">
        <TableContainer sx={{ maxHeight: 440 }}>
          {loading ? (
            <Box className="h-[550px] flex justify-center items-center">
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {iconDetails?.map(({ icon, label }, index) => (
                    <TableCell key={index}>
                      <Box className={`flex items-center gap-x-1.5`}>
                        {icon}
                        {label}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {companyUsers?.length > 0 ? (
                  companyUsers?.map((row: any, rowIndex: number) => (
                    <TableRow key={rowIndex} hover>
                      <TableCell className=" ">{row?.username}</TableCell>
                      <TableCell className="">
                        <Box className="flex items-center gap-x-1">
                          <MdEmail />
                          {row?.email}
                        </Box>
                      </TableCell>
                      <TableCell className="">
                        <Chip
                          className="me-1 !text-xs !h-5 !text-[#A54EB0] !bg-[#f3e9f3]"
                          key={rowIndex}
                          label={row?.role}
                          size="small"
                        ></Chip>
                      </TableCell>
                      <TableCell>
                        <Box className="flex items-center gap-x-2">
                          <Box className="cursor-pointer">
                            <FaRegEdit
                              fill="green"
                              size={18}
                              onClick={() => {
                                dispatch(getSingleUser(row));
                                setOpenEditModal(true);
                              }}
                            />
                          </Box>
                          <Box className="cursor-pointer">
                            <MdDelete
                              size={20}
                              fill="#d10000"
                              onClick={() => handleDeleteClick(row?._id)}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={iconDetails?.length}>
                      <Box className="flex items-center justify-center h-[30vh] text-gray-500 font-medium">
                        No Data Found
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {openModal && (
          <AddCompanyUserForm
            openModal={openModal}
            setOpenModal={setOpenModal}
            modalType={modalType}
          />
        )}

        {confirmation && (
          <DeletePopupMessage
            open={confirmation}
            setOpen={setConfirmation}
            paramId={selectedUserId}
            removeAction={handleDelete}
          />
        )}

        {openEditModal && (
          <EditCompanyUserForm
            openModal={openEditModal}
            setOpenModal={setOpenEditModal}
          />
        )}
      </Paper>
    </Box>
  );
};

export default UserListing;
