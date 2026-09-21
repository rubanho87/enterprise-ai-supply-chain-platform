import { useCallback, useEffect, useMemo, useState } from "react"

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
  ReportProblemOutlined,
} from "@mui/icons-material"

import { actionsApi } from "../services/api"

function CriticalActions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [severity, setSeverity] = useState("")
  const [riskType, setRiskType] = useState("")
  const [minRiskScore, setMinRiskScore] = useState("")

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await actionsApi.critical({
        limit: 100,
      })

      const data = response?.data?.data
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Unable to load critical actions:", err)

      setRows([])

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load critical actions."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ============================================================
  // FILTER OPTIONS
  // ============================================================

  const severities = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) => row?.risk_severity)
          .filter(Boolean)
      ),
    ].sort()
  }, [rows])

  const riskTypes = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) => row?.primary_risk)
          .filter(Boolean)
      ),
    ].sort()
  }, [rows])

  // ============================================================
  // FILTERED DATA
  // ============================================================

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const severityMatch =
        !severity ||
        String(row?.risk_severity || "").toUpperCase() ===
          String(severity).toUpperCase()

      const riskTypeMatch =
        !riskType ||
        String(row?.primary_risk || "").toUpperCase() ===
          String(riskType).toUpperCase()

      const score = Number(row?.risk_score || 0)

      const scoreMatch =
        minRiskScore === "" ||
        score >= Number(minRiskScore)

      return severityMatch && riskTypeMatch && scoreMatch
    })
  }, [rows, severity, riskType, minRiskScore])

  // ============================================================
  // KPI
  // ============================================================

  const criticalCount = useMemo(() => {
    return filteredRows.filter(
      (row) =>
        String(row?.risk_severity || "").toUpperCase() ===
        "CRITICAL"
    ).length
  }, [filteredRows])

  const averageRiskScore = useMemo(() => {
    if (!filteredRows.length) {
      return 0
    }

    const total = filteredRows.reduce(
      (sum, row) => sum + Number(row?.risk_score || 0),
      0
    )

    return total / filteredRows.length
  }, [filteredRows])

  const affectedStores = useMemo(() => {
    return new Set(
      filteredRows
        .map((row) => String(row?.store_key ?? ""))
        .filter(Boolean)
    ).size
  }, [filteredRows])

  // ============================================================
  // HELPERS
  // ============================================================

  const resetFilters = () => {
    setSeverity("")
    setRiskType("")
    setMinRiskScore("")
  }

  const getSeverityColor = (value) => {
    const normalized = String(value || "").toUpperCase()

    if (normalized === "CRITICAL") return "error"
    if (normalized === "HIGH") return "warning"
    if (normalized === "MEDIUM") return "info"
    if (normalized === "LOW") return "success"

    return "default"
  }

  const formatNumber = (value) => {
    const number = Number(value)

    if (!Number.isFinite(number)) {
      return "—"
    }

    return number.toLocaleString()
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <Box>
      {/* HEADER */}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Critical Actions
          </Typography>

          <Typography color="text.secondary">
            Prioritized operational decisions requiring management attention.
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
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={loadData}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* KPI */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Required Actions
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mt: 0.5 }}
          >
            {filteredRows.length}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Current filtered selection
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Critical Severity
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
            color="error.main"
            sx={{ mt: 0.5 }}
          >
            {criticalCount}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Immediate attention required
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Average Risk Score
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mt: 0.5 }}
          >
            {averageRiskScore.toFixed(1)}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Across selected actions
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Affected Stores
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mt: 0.5 }}
          >
            {affectedStores}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Unique store locations
          </Typography>
        </Paper>
      </Box>

      {/* FILTERS */}

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            lg: "row",
          }}
          spacing={2}
          sx={{
            alignItems: {
              xs: "stretch",
              lg: "center",
            },
          }}
        >
          <TextField
            select
            fullWidth
            size="small"
            label="Severity"
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
          >
            <MenuItem value="">
              All Severities
            </MenuItem>

            {severities.map((item) => (
              <MenuItem
                key={item}
                value={item}
              >
                {item}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label="Primary Risk"
            value={riskType}
            onChange={(event) =>
              setRiskType(event.target.value)
            }
          >
            <MenuItem value="">
              All Risks
            </MenuItem>

            {riskTypes.map((item) => (
              <MenuItem
                key={item}
                value={item}
              >
                {item}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label="Minimum Risk Score"
            value={minRiskScore}
            onChange={(event) =>
              setMinRiskScore(event.target.value)
            }
          >
            <MenuItem value="">
              All Scores
            </MenuItem>

            <MenuItem value="25">25+</MenuItem>
            <MenuItem value="50">50+</MenuItem>
            <MenuItem value="75">75+</MenuItem>
            <MenuItem value="90">90+</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            onClick={resetFilters}
            sx={{
              minWidth: 110,
              height: 40,
            }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      {/* ACTION LIST */}

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography fontWeight={800}>
                Operational Action Queue
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Prioritized supply-chain interventions
              </Typography>
            </Box>

            <Chip
              label={`${filteredRows.length} actions`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>

        {loading ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <CircularProgress size={34} />

            <Typography
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              Loading critical actions...
            </Typography>
          </Box>
        ) : (
          filteredRows.map((row, index) => (
            <Box
              key={`${String(
                row?.store_key ?? "store"
              )}-${String(
                row?.product_key ?? "product"
              )}-${index}`}
              sx={{
                p: 2.5,
                borderBottom:
                  index < filteredRows.length - 1
                    ? "1px solid"
                    : "none",
                borderColor: "divider",

                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={2}
                sx={{
                  justifyContent: "space-between",
                  alignItems: {
                    xs: "flex-start",
                    md: "center",
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "error.50",
                      flexShrink: 0,
                    }}
                  >
                    <ReportProblemOutlined
                      color="error"
                      fontSize="small"
                    />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      fontWeight={700}
                      sx={{
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row?.recommended_action ||
                        "Operational intervention required"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.75 }}
                    >
                      Risk: {row?.primary_risk || "UNKNOWN"}
                      {" · "}
                      Store: {row?.store_key ?? "—"}
                      {" · "}
                      Product: {row?.product_key ?? "—"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      Stock:{" "}
                      {formatNumber(row?.stock_disponible)}
                      {" · "}
                      30d demand:{" "}
                      {formatNumber(row?.qty_30d)}
                      {" · "}
                      Coverage:{" "}
                      {row?.stock_coverage_days != null
                        ? `${Number(
                            row.stock_coverage_days
                          ).toFixed(1)} days`
                        : "—"}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={row?.risk_severity || "RISK"}
                    color={getSeverityColor(
                      row?.risk_severity
                    )}
                    size="small"
                  />

                  <Chip
                    label={`Score ${row?.risk_score ?? 0}`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Stack>
            </Box>
          ))
        )}

        {!loading &&
          !error &&
          filteredRows.length === 0 && (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  mx: "auto",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "success.light",
                  color: "success.contrastText",
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                ✓
              </Box>

              <Typography
                fontWeight={700}
                sx={{ mb: 0.5 }}
              >
                No matching critical actions
              </Typography>

              <Typography color="text.secondary">
                No operational actions match the selected filters.
              </Typography>
            </Box>
          )}
      </Paper>
    </Box>
  )
}

export default CriticalActions