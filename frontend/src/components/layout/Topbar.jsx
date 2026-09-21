import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material"

import {
  NotificationsNoneOutlined,
  RefreshOutlined,
} from "@mui/icons-material"

function Topbar() {
  return (
    <Box
      component="header"
      sx={{
        height: 72,
        px: { xs: 2, md: 3 },
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1100,
      }}
    >
      {/* LEFT */}
      <Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "text.secondary",
            mb: 0.25,
          }}
        >
          SUPPLY CHAIN COMMAND CENTER
        </Typography>

        <Typography
          sx={{
            fontSize: 17,
            fontWeight: 700,
            color: "text.primary",
          }}
        >
          Operational Intelligence
        </Typography>
      </Box>

      {/* RIGHT */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: {
              xs: "none",
              md: "flex",
            },
            alignItems: "center",
            gap: 1,
            mr: 1.5,
            px: 1.5,
            py: 0.75,
            bgcolor: "#F8FAFC",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: "success.main",
              borderRadius: "50%",
            }}
          />

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            Databricks Serving Layer
          </Typography>
        </Box>

        <Tooltip title="Refresh data">
          <IconButton
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Badge
              color="error"
              variant="dot"
            >
              <NotificationsNoneOutlined fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Avatar
          sx={{
            width: 38,
            height: 38,
            ml: 0.5,
            bgcolor: "primary.main",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          AI
        </Avatar>
      </Box>
    </Box>
  )
}

export default Topbar