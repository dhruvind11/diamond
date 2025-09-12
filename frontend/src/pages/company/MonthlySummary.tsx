import { Scale, TrendingDown, TrendingUp } from "@mui/icons-material";
import { Card, CardHeader, CardContent, Box } from "@mui/material";
import { useAppSelector } from "../../store/store";

const MonthlySummary = ({ inr }: any) => {
  const { dashboardData } = useAppSelector((s) => s.dashboard);
  const receivable = dashboardData?.monthlySummary?.totalReceivable ?? 0;
  const payable = dashboardData?.monthlySummary?.totalPayable ?? 0;
  const net = dashboardData?.monthlySummary?.netPosition ?? 0;
  const receivableStock =
    dashboardData?.monthlySummary?.totalReceivableStock ?? 0;
  const payableStock = dashboardData?.monthlySummary?.totalPayableStock ?? 0;
  const isPositive = net >= 0;

  const badge = (
    <Box
      sx={{
        display: { xs: "none", sm: "inline-flex" },
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        bgcolor: isPositive ? "rgba(16,185,129,.12)" : "rgba(244,63,94,.12)",
        color: isPositive ? "rgb(5,122,85)" : "rgb(190,18,60)",
        border: `1px solid ${
          isPositive ? "rgba(16,185,129,.24)" : "rgba(244,63,94,.24)"
        }`,
      }}
    >
      {isPositive ? (
        <TrendingUp fontSize="small" />
      ) : (
        <TrendingDown fontSize="small" />
      )}
      {isPositive ? "Profit" : "Loss"}
    </Box>
  );

  return (
    <Card
      className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      sx={{ display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="Monthly Summary"
        subheader="Financial overview for current month"
        action={badge}
        sx={{
          pb: 1.5,
          background:
            "linear-gradient(90deg, rgb(248,250,252) 0%, rgb(255,255,255) 100%)",
          "& .MuiCardHeader-title": {
            fontWeight: 600,
            fontSize: "1rem",
            color: "rgb(30,41,59)",
          },
          "& .MuiCardHeader-subheader": {
            color: "rgb(100,116,139)",
            fontSize: "0.875rem",
            mt: 0.25,
          },
        }}
      />

      <CardContent className="!py-2" sx={{ flexGrow: 1 }}>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                Total Receivables
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
                {receivableStock} CT
              </span>
              <span className="text-sm font-semibold text-rose-600">
                {inr(receivable)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                Total Payables
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
                {payableStock} CT
              </span>
              <span className="text-sm font-semibold text-emerald-600">
                {inr(payable)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardContent
        sx={{
          borderTop: "1px solid rgb(226,232,240)",
          backgroundColor: "white",
          py: 2,
          mt: "auto",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">
            Net Position
          </span>
          <span
            className={`text-sm font-semibold px-2 py-1 rounded-md ${
              isPositive
                ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100"
                : "text-rose-700 bg-rose-50 ring-1 ring-rose-100"
            }`}
          >
            {inr(net)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlySummary;
