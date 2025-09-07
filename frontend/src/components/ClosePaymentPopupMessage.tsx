import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
  } from "@mui/material";
  
  const ClosePaymentPopupMessage = ({ open, setOpen, invoice }: any) => {
    return (
      <Box>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>
            <Box className='!font-semibold'>Close Payment</Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Due Amount: <b>₹{invoice.dueAmount}</b>
            </Typography>
            <Typography sx={{ mt: 2 }}>
              This due amount will be considered as <b>Discount</b>.
              <br />
              Do you want to close this invoice?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button
              // onClick={handleConfirmClose}
              color="success"
              variant="contained"
            >
              Confirm Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };
  
  export default ClosePaymentPopupMessage;
  