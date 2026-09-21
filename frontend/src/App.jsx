import { Box } from "@mui/material"

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Sidebar, {
  DRAWER_WIDTH,
} from "./components/layout/Sidebar"

import Topbar from "./components/layout/Topbar"

import Dashboard from "./pages/Dashboard"
import Inventory from "./pages/Inventory"
import StockoutRisks from "./pages/StockoutRisks"
import Transfers from "./pages/Transfers"
import CriticalActions from "./pages/CriticalActions"
import AIAssistant from "./pages/AIAssistant"

function App() {
  return (
    <BrowserRouter>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Sidebar />

        <Box
          sx={{
            ml: `${DRAWER_WIDTH}px`,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Topbar />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: "100%",
              p: {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
            }}
          >
            <Routes>
              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/inventory"
                element={<Inventory />}
              />

              <Route
                path="/stockout-risks"
                element={<StockoutRisks />}
              />

              <Route
                path="/transfers"
                element={<Transfers />}
              />

              <Route
                path="/critical-actions"
                element={<CriticalActions />}
              />

              <Route
                path="/ai-assistant"
                element={<AIAssistant />}
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
            </Routes>
          </Box>
        </Box>
      </Box>
    </BrowserRouter>
  )
}

export default App