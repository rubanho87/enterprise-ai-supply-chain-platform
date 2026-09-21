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
  Inventory2Outlined,
  RefreshOutlined,
  SearchOutlined,
} from "@mui/icons-material"

import { stockoutApi } from "../services/api"

const formatNumber = (value) =>
  Number(value || 0).toLocaleString()

const statusColor = (status) => {
  const value = String(status || "").toUpperCase()

  if (value.includes("RUPTURE")) return "error"
  if (value.includes("CRIT")) return "error"
  if (value.includes("FAIBLE")) return "warning"

  return "default"
}

function Inventory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [store, setStore] = useState("")
  const [status, setStatus] = useState("")

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
          "Unable to load inventory data."
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

  const statuses = useMemo(
    () =>
      [...new Set(rows.map((row) => row.inventory_status).filter(Boolean))]
        .sort(),
    [rows]
  )

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        String(row.product_name || "")
          .toLowerCase()
          .includes(term) ||
        String(row.product_code || "")
          .toLowerCase()
          .includes(term) ||
        String(row.store_name || "")
          .toLowerCase()
          .includes(term)

      const matchesStore =
        !store || row.store_name === store

      const matchesStatus =
        !status || row.inventory_status === status

      return matchesSearch && matchesStore && matchesStatus
    })
  }, [rows, search, store, status])

  const totalStock = filteredRows.reduce(
    (sum, row) => sum + Number(row.stock_disponible || 0),
    0
  )

  const ruptureCount = filteredRows.filter(
    (row) =>
      String(row.inventory_status || "").toUpperCase() ===
      "RUPTURE"
  ).length

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
            Inventory
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Operational inventory positions and stock availability.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={loadData}
          disabled={loading}
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
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary" fontSize={13}>
            Inventory Records
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(filteredRows.length)}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary" fontSize={13}>
            Available Stock
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(totalStock)}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary" fontSize={13}>
            Stockouts
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(ruptureCount)}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
        >
          <TextField
            fullWidth
            size="small"
            label="Search product or store"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <SearchOutlined
                  sx={{
                    mr: 1,
                    fontSize: 19,
                    color: "text.secondary",
                  }}
                />
              ),
            }}
          />

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
            label="Inventory Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>

            {statuses.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 1000 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.8fr 1fr 1fr .8fr .8fr .8fr 1fr",
                  px: 2,
                  py: 1.5,
                  bgcolor: "#F8FAFC",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                {[
                  "Product",
                  "Store",
                  "Code",
                  "Opening",
                  "In",
                  "Out",
                  "Status",
                ].map((item) => (
                  <Typography
                    key={item}
                    fontSize={12}
                    fontWeight={700}
                    color="text.secondary"
                  >
                    {item}
                  </Typography>
                ))}
              </Box>

              {filteredRows.map((row, index) => (
                <Box
                  key={`${row.inventory_key}-${index}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.8fr 1fr 1fr .8fr .8fr .8fr 1fr",
                    px: 2,
                    py: 1.5,
                    alignItems: "center",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Inventory2Outlined
                      sx={{
                        fontSize: 18,
                        color: "primary.main",
                      }}
                    />

                    <Typography fontSize={13} fontWeight={700}>
                      {row.product_name || "—"}
                    </Typography>
                  </Stack>

                  <Typography fontSize={13}>
                    {row.store_name || "—"}
                  </Typography>

                  <Typography fontSize={13}>
                    {row.product_code || "—"}
                  </Typography>

                  <Typography fontSize={13}>
                    {formatNumber(row.stock_depart)}
                  </Typography>

                  <Typography fontSize={13}>
                    {formatNumber(row.stock_entree)}
                  </Typography>

                  <Typography fontSize={13}>
                    {formatNumber(row.stock_sortie)}
                  </Typography>

                  <Box>
                    <Chip
                      size="small"
                      label={row.inventory_status || "UNKNOWN"}
                      color={statusColor(row.inventory_status)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}

              {!filteredRows.length && (
                <Box sx={{ p: 5, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No inventory records match the filters.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default Inventory