import { Box, Modal } from "@mui/material";
import { IoClose } from "react-icons/io5";

const DeletePopupMessage = ({ open, setOpen, removeAction, paramId }: any) => {
  const deleteAction = () => {
    removeAction(paramId);
    setOpen(false);
  };
  return (
    <Modal
      className="!border-none !z-[6000]"
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={() => setOpen(false)}
    >
      <Box className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[91%] sm:w-[400px] bg-white p-4">
        <Box className="mb-5 flex items-center justify-between">
          <Box className="text-lg font-bold">Are you sure?</Box>
          <IoClose
            className="w-6 h-6 cursor-pointer"
            onClick={() => setOpen(false)}
          />
        </Box>
        <Box>
          <Box className="text-sm sm:text-base mb-9">You want to delete ?</Box>
          <Box className="flex gap-3 justify-end">
            <button
              className="py-2 px-4 border flex items-center rounded-md text-sm bg-[#A54EB0] cursor-pointer text-white"
              onClick={deleteAction}
            >
              Yes, I'm sure!
            </button>
            <button
              className="py-2 px-5 border rounded-md text-sm bg-[#f16fa8] text-white cursor-pointer"
              onClick={() => setOpen(false)}
            >
              No
            </button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default DeletePopupMessage;
