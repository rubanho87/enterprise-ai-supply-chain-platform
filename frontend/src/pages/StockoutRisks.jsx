import { useEffect, useMemo, useState } from "react"

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"

import {
  RefreshOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material"

import { stockoutApi } from "../services/api"

const formatNumber = (value) =>
  Number(value || 0).toLocaleString()

function StockoutRisks() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [store, setStore] = useState("")
  const [priority, setPriority] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await stockoutApi.alerts({
        limit: 100,
      })

      setRows(response?.data?.data || [])
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load stockout risks."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stores = useMemo(
    () =>
      [...new Set(rows.map((row) => row.store_name).filter(Boolean))]
        .sort(),
    [rows]
  )

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const storeMatch =
          !store || row.store_name === store

        const priorityMatch =
          !priority ||
          String(row.priority_rank) === priority

        return storeMatch && priorityMatch
      }),
    [rows, store, priority]
  )

  const urgent = filteredRows.filter(
    (row) => Number(row.priority_rank) === 1
  ).length

  const revenueAtRisk = filteredRows.reduce(
    (sum, row) => sum + Number(row.revenue_30d || 0),
    0
  )

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Stockout Risks
          </Typography>

          <Typography color="text.secondary">
            Priority shortages requiring replenishment attention.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3,1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary">
            Active Alerts
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(filteredRows.length)}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary">
            Urgent
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(urgent)}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary">
            30-Day Revenue Exposure
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(Math.round(revenueAtRisk))}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
        >
          <TextField
            select
            fullWidth
            size="small"
            label="Store"
            value={store}
            onChange={(event) => setStore(event.target.value)}
          >
            <MenuItem value="">All Stores</MenuItem>

            {stores.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="1">Urgent</MenuItem>
            <MenuItem value="2">High</MenuItem>
            <MenuItem value="3">Medium</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          filteredRows.map((row, index) => (
            <Box
              key={`${row.inventory_key}-${index}`}
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1.5}>
                <WarningAmberOutlined color="warning" />

                <Box>
                  <Typography fontWeight={700}>
                    {row.product_name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {row.store_name} · Stock{" "}
                    {formatNumber(row.stock_disponible)} · Sales 30d{" "}
                    {formatNumber(row.qty_sales_30d)} · Cover{" "}
                    {Number(row.days_of_stock || 0).toFixed(1)} days
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={row.stockout_priority || "RISK"}
                color={
                  Number(row.priority_rank) === 1
                    ? "error"
                    : "warning"
                }
                size="small"
              />
            </Box>
          ))
        )}

        {!loading && !filteredRows.length && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography color="text.secondary">
              No stockout risks match the selected filters.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default StockoutRisks