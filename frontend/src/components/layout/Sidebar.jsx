import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material"

import {
  AutoAwesomeOutlined,
  DashboardOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  ReportProblemOutlined,
  SwapHorizOutlined,
  TaskAltOutlined,
} from "@mui/icons-material"

import { NavLink, useLocation } from "react-router-dom"

export const DRAWER_WIDTH = 270

const menuItems = [
  {
    label: "Executive Overview",
    path: "/",
    icon: DashboardOutlined,
  },
  {
    label: "Inventory",
    path: "/inventory",
    icon: Inventory2Outlined,
  },
  {
    label: "Stockout Risks",
    path: "/stockout-risks",
    icon: ReportProblemOutlined,
  },
  {
    label: "Stock Transfers",
    path: "/transfers",
    icon: SwapHorizOutlined,
  },
  {
    label: "Critical Actions",
    path: "/critical-actions",
    icon: TaskAltOutlined,
  },
  {
    label: "Supply Chain AI Assistant",
    path: "/ai-assistant",
    icon: AutoAwesomeOutlined,
  },
]

function Sidebar() {
  const location = useLocation()

  return (
    <Box
      component="aside"
      sx={{
        width: DRAWER_WIDTH,
        minWidth: DRAWER_WIDTH,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1200,
        bgcolor: "#0F172A",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            mb: 2,
          }}
        >
          <LocalShippingOutlined />
        </Box>

        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Enterprise AI
        </Typography>

        <Typography
          sx={{
            mt: 0.4,
            fontSize: 13,
            color: "#94A3B8",
          }}
        >
          Supply Chain Platform
        </Typography>
      </Box>

      <Divider
        sx={{
          borderColor: "rgba(255,255,255,0.08)",
        }}
      />

      <Box
        sx={{
          px: 1.5,
          py: 2,
          flexGrow: 1,
        }}
      >
        <Typography
          sx={{
            px: 1.5,
            mb: 1,
            fontSize: 11,
            fontWeight: 700,
            color: "#64748B",
            letterSpacing: "0.12em",
          }}
        >
          OPERATIONS
        </Typography>

        <List disablePadding>
          {menuItems.map((item) => {
            const Icon = item.icon

            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path)

            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                sx={{
                  position: "relative",
                  minHeight: 46,
                  mb: 0.6,
                  px: 1.5,
                  borderRadius: 2,
                  color: active ? "#FFFFFF" : "#CBD5E1",
                  bgcolor: active
                    ? "rgba(37,99,235,0.20)"
                    : "transparent",

                  "&:hover": {
                    bgcolor: active
                      ? "rgba(37,99,235,0.25)"
                      : "rgba(255,255,255,0.06)",
                  },

                  "&::before": active
                    ? {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        width: 3,
                        height: 24,
                        borderRadius: 4,
                        bgcolor: "#3B82F6",
                      }
                    : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? "#60A5FA" : "#94A3B8",
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                      },
                    },
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.8,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#22C55E",
              }}
            />

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              System Operational
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 11.5,
              color: "#94A3B8",
              lineHeight: 1.5,
            }}
          >
            Decision intelligence online
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default Sidebar