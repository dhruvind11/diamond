import { TrendingDown, TrendingUp } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";

const DashboardCard = ({ title, value, subtitle, color, icon, trend }: any) => {
  return (
    <div>
      <Paper className="flex flex-col justify-between p-4 shadow-md rounded-xl border border-gray-100 hover:shadow-lg transition-all">
        {/* Header */}
        <Box className="flex justify-between items-center">
          <Typography variant="subtitle2" className="text-gray-500 font-medium">
            {title}
          </Typography>
          {icon}
        </Box>

        {/* Value */}
        <Typography variant="h5" className={`font-bold mt-2 ${color}`}>
          {value}
        </Typography>

        {/* Footer */}
        <Typography
          variant="body2"
          className="text-gray-400 flex items-center gap-1 mt-1"
        >
          {trend > 0 ? (
            <TrendingUp fontSize="small" className="text-green-500" />
          ) : (
            <TrendingDown fontSize="small" className="text-red-500" />
          )}
          {subtitle}
        </Typography>
      </Paper>
    </div>
  );
};

export default DashboardCard;

