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
  ArrowForwardOutlined,
  RefreshOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material"

import { transferApi } from "../services/api"


const formatNumber = (value) =>
  Number(value || 0).toLocaleString()


const getStoreLabel = (name, code) => {
  const cleanName = String(name || "").trim()
  const cleanCode = String(code || "").trim()

  if (cleanName && cleanCode && cleanName !== cleanCode) {
    return `${cleanName} (${cleanCode})`
  }

  return cleanName || cleanCode || "Unknown Store"
}


function Transfers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [donor, setDonor] = useState("")
  const [receiver, setReceiver] = useState("")


  const loadData = async () => {
    setLoading(true)
    setError("")

    try {
      const response =
        await transferApi.recommendations({
          limit: 100,
        })

      setRows(response?.data?.data || [])
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load transfer recommendations."
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadData()
  }, [])


  const donorStores = useMemo(() => {
    const stores = new Map()

    rows.forEach((row) => {
      if (!row.donor_store) return

      stores.set(row.donor_store, {
        code: row.donor_store,
        name: row.donor_store_name,
      })
    })

    return [...stores.values()].sort((a, b) =>
      getStoreLabel(a.name, a.code).localeCompare(
        getStoreLabel(b.name, b.code)
      )
    )
  }, [rows])


  const receiverStores = useMemo(() => {
    const stores = new Map()

    rows.forEach((row) => {
      if (!row.receiver_store) return

      stores.set(row.receiver_store, {
        code: row.receiver_store,
        name: row.receiver_store_name,
      })
    })

    return [...stores.values()].sort((a, b) =>
      getStoreLabel(a.name, a.code).localeCompare(
        getStoreLabel(b.name, b.code)
      )
    )
  }, [rows])


  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!donor || row.donor_store === donor) &&
          (!receiver || row.receiver_store === receiver)
      ),
    [rows, donor, receiver]
  )


  const totalQty = useMemo(
    () =>
      filteredRows.reduce(
        (sum, row) =>
          sum + Number(row.proposed_transfer_qty || 0),
        0
      ),
    [filteredRows]
  )


  const resetFilters = () => {
    setDonor("")
    setReceiver("")
  }


  return (
    <Box>
      {/* PAGE HEADER */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Stock Transfers
          </Typography>

          <Typography color="text.secondary">
            AI-ready inventory rebalancing recommendations.
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


      {/* ERROR */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}


      {/* KPI CARDS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary">
            Recommendations
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(filteredRows.length)}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary">
            Proposed Units
          </Typography>

          <Typography variant="h4" fontWeight={800}>
            {formatNumber(totalQty)}
          </Typography>
        </Paper>
      </Box>


      {/* FILTERS */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          mb: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
        >
          <TextField
            select
            fullWidth
            size="small"
            label="Donor Store"
            value={donor}
            onChange={(event) =>
              setDonor(event.target.value)
            }
          >
            <MenuItem value="">
              All Donor Stores
            </MenuItem>

            {donorStores.map((store) => (
              <MenuItem
                key={store.code}
                value={store.code}
              >
                {getStoreLabel(
                  store.name,
                  store.code
                )}
              </MenuItem>
            ))}
          </TextField>


          <TextField
            select
            fullWidth
            size="small"
            label="Receiver Store"
            value={receiver}
            onChange={(event) =>
              setReceiver(event.target.value)
            }
          >
            <MenuItem value="">
              All Receiver Stores
            </MenuItem>

            {receiverStores.map((store) => (
              <MenuItem
                key={store.code}
                value={store.code}
              >
                {getStoreLabel(
                  store.name,
                  store.code
                )}
              </MenuItem>
            ))}
          </TextField>


          <Button
            variant="outlined"
            onClick={resetFilters}
            disabled={!donor && !receiver}
            sx={{
              minWidth: {
                xs: "100%",
                md: 100,
              },
            }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>


      {/* TRANSFER RECOMMENDATIONS */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <CircularProgress />

            <Typography
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              Loading transfer recommendations...
            </Typography>
          </Box>
        ) : (
          filteredRows.map((row, index) => {
            const donorLabel = getStoreLabel(
              row.donor_store_name,
              row.donor_store
            )

            const receiverLabel = getStoreLabel(
              row.receiver_store_name,
              row.receiver_store
            )

            return (
              <Box
                key={`${row.product_key}-${row.donor_store_key}-${row.receiver_store_key}-${index}`}
                sx={{
                  p: 2,
                  borderBottom:
                    index < filteredRows.length - 1
                      ? "1px solid"
                      : "none",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    md: "row",
                  }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    <SwapHorizOutlined
                      color="primary"
                      sx={{ mt: 0.3 }}
                    />

                    <Box>
                      <Typography
                        fontWeight={700}
                        sx={{ mb: 0.6 }}
                      >
                        {row.article ||
                          row.product_key}
                      </Typography>


                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        spacing={1}
                        alignItems={{
                          xs: "flex-start",
                          sm: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                        >
                          {donorLabel}
                        </Typography>

                        <ArrowForwardOutlined
                          color="action"
                          sx={{
                            fontSize: 17,
                            transform: {
                              xs: "rotate(90deg)",
                              sm: "none",
                            },
                          }}
                        />

                        <Typography
                          variant="body2"
                          fontWeight={600}
                        >
                          {receiverLabel}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>


                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      label={`${formatNumber(
                        row.proposed_transfer_qty
                      )} units`}
                      color="primary"
                      variant="outlined"
                    />

                    <Chip
                      label={
                        row.replenishment_priority ||
                        `Priority ${row.priority_rank}`
                      }
                      size="small"
                    />
                  </Stack>
                </Stack>


                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.2 }}
                >
                  Donor stock:{" "}
                  {formatNumber(row.donor_stock)}
                  {" · "}
                  Receiver stock:{" "}
                  {formatNumber(row.receiver_stock)}
                  {" · "}
                  Uncovered quantity:{" "}
                  {formatNumber(row.uncovered_qty)}
                </Typography>
              </Box>
            )
          })
        )}


        {!loading && !filteredRows.length && (
          <Box
            sx={{
              p: 5,
              textAlign: "center",
            }}
          >
            <Typography
              fontWeight={700}
              sx={{ mb: 0.5 }}
            >
              No matching transfer recommendations
            </Typography>

            <Typography color="text.secondary">
              No stock-transfer recommendations match
              the selected filters.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}


export default Transfers