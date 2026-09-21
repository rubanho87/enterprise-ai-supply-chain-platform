import { useCallback, useEffect, useMemo, useState } from "react"

import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material"

import {
  ArrowForwardOutlined,
  CheckCircleOutlineOutlined,
  FilterAltOutlined,
  HomeOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  RefreshOutlined,
  ReportProblemOutlined,
  RestartAltOutlined,
  ShieldOutlined,
  TaskAltOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material"

import {
  actionsApi,
  riskApi,
  stockoutApi,
  transferApi,
} from "../services/api"

/* =========================================================
   FORMATTERS
========================================================= */

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatNumber(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return "—"
  }

  return numberFormatter.format(numericValue)
}

function formatDecimal(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return "—"
  }

  return decimalFormatter.format(numericValue)
}

/* =========================================================
   API HELPERS
========================================================= */

function unwrapData(response) {
  const payload = response?.data

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data
  }

  return payload
}

function extractArray(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== "object") {
    return []
  }

  const candidateKeys = [
    "items",
    "results",
    "alerts",
    "recommendations",
    "actions",
    "data",
  ]

  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key]
    }
  }

  return []
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail

  if (typeof detail === "string") {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ")
  }

  if (error?.message) {
    return error.message
  }

  return "Unable to load dashboard data."
}

/* =========================================================
   BUSINESS HELPERS
========================================================= */

function getRiskColor(status) {
  const normalizedStatus = String(status || "").toUpperCase()

  if (
    normalizedStatus.includes("CRITICAL") ||
    normalizedStatus.includes("SEVERE")
  ) {
    return "error"
  }

  if (
    normalizedStatus.includes("ELEVATED") ||
    normalizedStatus.includes("HIGH") ||
    normalizedStatus.includes("MEDIUM") ||
    normalizedStatus.includes("MODERATE")
  ) {
    return "warning"
  }

  if (
    normalizedStatus.includes("HEALTHY") ||
    normalizedStatus.includes("LOW") ||
    normalizedStatus.includes("NORMAL")
  ) {
    return "success"
  }

  return "default"
}

function getPriorityColor(priority) {
  const normalizedPriority = String(priority || "").toUpperCase()

  if (
    normalizedPriority === "URGENT" ||
    normalizedPriority === "CRITICAL"
  ) {
    return "error"
  }

  if (
    normalizedPriority === "HIGH" ||
    normalizedPriority === "HAUTE"
  ) {
    return "warning"
  }

  if (
    normalizedPriority === "MEDIUM" ||
    normalizedPriority === "MOYENNE"
  ) {
    return "info"
  }

  if (
    normalizedPriority === "LOW" ||
    normalizedPriority === "FAIBLE"
  ) {
    return "success"
  }

  return "default"
}

function getPriorityLabel(item) {
  return (
    item?.stockout_priority ||
    item?.priority ||
    item?.priority_label ||
    item?.risk_level ||
    item?.risk_severity ||
    item?.severity ||
    "Priority"
  )
}

function getProductLabel(item) {
  return (
    item?.product_name ||
    item?.product_code ||
    item?.product ||
    item?.sku ||
    item?.article ||
    "Product"
  )
}

function getStoreLabel(item) {
  return (
    item?.store_name ||
    item?.store_code ||
    item?.store ||
    item?.receiver_store ||
    item?.location_name ||
    item?.location ||
    "Store"
  )
}

function getTransferDescription(item) {
  const product = getProductLabel(item)

  const donor =
    item?.donor_store ||
    item?.source_store ||
    item?.from_store ||
    item?.donor_store_name

  const receiver =
    item?.receiver_store ||
    item?.target_store ||
    item?.to_store ||
    item?.receiver_store_name

  const quantity =
    item?.proposed_transfer_qty ??
    item?.proposed_transfer_quantity ??
    item?.transfer_quantity ??
    item?.quantity

  if (donor && receiver && quantity !== undefined) {
    return `${formatDecimal(quantity)} units of ${product}: ${donor} → ${receiver}`
  }

  if (donor && receiver) {
    return `${product}: ${donor} → ${receiver}`
  }

  return product
}

function getActionTitle(item) {
  return (
    item?.action ||
    item?.recommended_action ||
    item?.action_title ||
    item?.title ||
    item?.recommendation ||
    "Critical action"
  )
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone = "primary",
  progress,
}) {
  const toneMap = {
    primary: {
      background: "#EEF4FF",
      color: "#2563EB",
    },
    error: {
      background: "#FEF2F2",
      color: "#DC2626",
    },
    warning: {
      background: "#FFF7ED",
      color: "#EA580C",
    },
    success: {
      background: "#F0FDF4",
      color: "#16A34A",
    },
  }

  const currentTone = toneMap[tone] || toneMap.primary

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "#FFFFFF",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                fontSize: {
                  xs: 27,
                  lg: 30,
                },
                lineHeight: 1.15,
                fontWeight: 800,
                color: "text.primary",
                letterSpacing: "-0.03em",
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: currentTone.background,
              color: currentTone.color,
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          sx={{
            mt: 1.4,
            minHeight: 20,
            color: "text.secondary",
            fontSize: 12.5,
          }}
        >
          {subtitle}
        </Typography>

        {typeof progress === "number" && (
          <LinearProgress
            variant="determinate"
            value={Math.min(Math.max(progress, 0), 100)}
            color={tone === "primary" ? "primary" : tone}
            sx={{
              mt: 1.7,
              height: 5,
              borderRadius: 10,
              bgcolor: "#EEF2F7",
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  subtitle,
  action,
  children,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "#FFFFFF",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "text.primary",
            }}
          >
            {title}
          </Typography>

          {subtitle ? (
            <Typography
              sx={{
                mt: 0.3,
                fontSize: 12.5,
                color: "text.secondary",
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {action ? (
          <Box sx={{ flexShrink: 0 }}>
            {action}
          </Box>
        ) : null}
      </Box>

      <Divider />

      <Box sx={{ p: 2.5 }}>
        {children}
      </Box>
    </Paper>
  )
}

/* =========================================================
   RISK DISTRIBUTION ITEM
========================================================= */

function RiskDistributionItem({
  label,
  value,
  rate,
  color,
}) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.4,
          fontSize: 22,
          fontWeight: 700,
          color: "text.primary",
        }}
      >
        {formatNumber(value)}
      </Typography>

      <Typography
        sx={{
          fontSize: 12,
          color,
          fontWeight: 600,
        }}
      >
        {formatDecimal(rate)}%
      </Typography>
    </Box>
  )
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const [risk, setRisk] = useState(null)
  const [stockoutAlerts, setStockoutAlerts] = useState([])
  const [transfers, setTransfers] = useState([])
  const [criticalActions, setCriticalActions] = useState([])
  const [storeRisks, setStoreRisks] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [businessUnit, setBusinessUnit] = useState("")
  const [storeKey, setStoreKey] = useState("")
  const [productKey, setProductKey] = useState("")
  const [minRiskRate, setMinRiskRate] = useState("")

  const [appliedFilters, setAppliedFilters] = useState({
    businessUnit: "",
    storeKey: "",
    productKey: "",
    minRiskRate: "",
  })

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError("")

    try {
      const [
        riskResponse,
        stockoutResponse,
        transferResponse,
        actionsResponse,
        storesResponse,
      ] = await Promise.all([
        riskApi.executive(),

        stockoutApi.alerts({
          limit: 100,
        }),

        transferApi.recommendations({
          limit: 100,
        }),

        actionsApi.critical({
          limit: 100,
        }),

        riskApi.stores({
          limit: 100,
        }),
      ])

      const riskPayload = unwrapData(riskResponse)
      const stockoutPayload = unwrapData(stockoutResponse)
      const transferPayload = unwrapData(transferResponse)
      const actionsPayload = unwrapData(actionsResponse)
      const storesPayload = unwrapData(storesResponse)

      setRisk(
        riskPayload &&
          typeof riskPayload === "object" &&
          !Array.isArray(riskPayload)
          ? riskPayload
          : {}
      )

      setStockoutAlerts(extractArray(stockoutPayload))
      setTransfers(extractArray(transferPayload))
      setCriticalActions(extractArray(actionsPayload))
      setStoreRisks(extractArray(storesPayload))
    } catch (requestError) {
      console.error("Dashboard loading failed:", requestError)
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const businessUnits = useMemo(() => {
    return [
      ...new Set(
        stockoutAlerts
          .map((item) => item?.store_business_unit)
          .filter(Boolean)
      ),
    ].sort()
  }, [stockoutAlerts])

  const stores = useMemo(() => {
    const map = new Map()

    stockoutAlerts.forEach((item) => {
      if (!item?.store_key) {
        return
      }

      if (
        businessUnit &&
        item?.store_business_unit !== businessUnit
      ) {
        return
      }

      const key = String(item.store_key)

      if (!map.has(key)) {
        map.set(key, {
          store_key: key,
          store_name:
            item?.store_name ||
            item?.store_code ||
            key,
          store_code: item?.store_code,
          business_unit: item?.store_business_unit,
        })
      }
    })

    return [...map.values()].sort((a, b) =>
      String(a.store_name).localeCompare(
        String(b.store_name)
      )
    )
  }, [stockoutAlerts, businessUnit])

  const products = useMemo(() => {
    const map = new Map()

    stockoutAlerts.forEach((item) => {
      if (!item?.product_key) {
        return
      }

      if (
        businessUnit &&
        item?.store_business_unit !== businessUnit
      ) {
        return
      }

      if (
        storeKey &&
        String(item?.store_key) !== String(storeKey)
      ) {
        return
      }

      const key = String(item.product_key)

      if (!map.has(key)) {
        map.set(key, {
          product_key: key,
          product_name:
            item?.product_name ||
            item?.product_code ||
            key,
          product_code: item?.product_code,
        })
      }
    })

    return [...map.values()].sort((a, b) =>
      String(a.product_name).localeCompare(
        String(b.product_name)
      )
    )
  }, [
    stockoutAlerts,
    businessUnit,
    storeKey,
  ])

  /* =======================================================
     APPLY / RESET
  ======================================================= */

  const handleApplyFilters = () => {
    setAppliedFilters({
      businessUnit,
      storeKey,
      productKey,
      minRiskRate,
    })
  }

  const handleResetFilters = () => {
    setBusinessUnit("")
    setStoreKey("")
    setProductKey("")
    setMinRiskRate("")

    setAppliedFilters({
      businessUnit: "",
      storeKey: "",
      productKey: "",
      minRiskRate: "",
    })
  }

  /* =======================================================
     FILTERED STOCKOUTS
  ======================================================= */

  const filteredStockoutAlerts = useMemo(() => {
    return stockoutAlerts.filter((item) => {
      if (
        appliedFilters.businessUnit &&
        item?.store_business_unit !==
          appliedFilters.businessUnit
      ) {
        return false
      }

      if (
        appliedFilters.storeKey &&
        String(item?.store_key) !==
          String(appliedFilters.storeKey)
      ) {
        return false
      }

      if (
        appliedFilters.productKey &&
        String(item?.product_key) !==
          String(appliedFilters.productKey)
      ) {
        return false
      }

      return true
    })
  }, [
    stockoutAlerts,
    appliedFilters,
  ])

  /* =======================================================
     FILTERED STORE RISKS
  ======================================================= */

  const filteredStoreRisks = useMemo(() => {
    return storeRisks.filter((item) => {
      if (
        appliedFilters.storeKey &&
        String(item?.store_key) !==
          String(appliedFilters.storeKey)
      ) {
        return false
      }

      if (
        appliedFilters.minRiskRate !== "" &&
        Number(item?.risk_rate_pct || 0) <
          Number(appliedFilters.minRiskRate)
      ) {
        return false
      }

      return true
    })
  }, [
    storeRisks,
    appliedFilters,
  ])

  /* =======================================================
     FILTERED TRANSFERS
  ======================================================= */

  const filteredTransfers = useMemo(() => {
    return transfers.filter((item) => {
      if (!appliedFilters.storeKey) {
        return true
      }

      const selectedStore = stores.find(
        (store) =>
          String(store.store_key) ===
          String(appliedFilters.storeKey)
      )

      if (!selectedStore) {
        return true
      }

      const storeName = String(
        selectedStore.store_name
      ).toUpperCase()

      const donor = String(
        item?.donor_store || ""
      ).toUpperCase()

      const receiver = String(
        item?.receiver_store || ""
      ).toUpperCase()

      return (
        donor === storeName ||
        receiver === storeName
      )
    })
  }, [
    transfers,
    appliedFilters,
    stores,
  ])

  /* =======================================================
     FILTERED ACTIONS
  ======================================================= */

  const filteredCriticalActions = useMemo(() => {
    return criticalActions.filter((item) => {
      if (
        appliedFilters.storeKey &&
        String(item?.store_key) !==
          String(appliedFilters.storeKey)
      ) {
        return false
      }

      if (
        appliedFilters.productKey &&
        String(item?.product_key) !==
          String(appliedFilters.productKey)
      ) {
        return false
      }

      if (
        appliedFilters.minRiskRate !== "" &&
        Number(item?.risk_score || 0) <
          Number(appliedFilters.minRiskRate)
      ) {
        return false
      }

      return true
    })
  }, [
    criticalActions,
    appliedFilters,
  ])

  /* =======================================================
     DISPLAY DATA
  ======================================================= */

  const riskRate = Number(
    risk?.risk_rate_pct ?? 0
  )

  const criticalRate = Number(
    risk?.critical_rate_pct ?? 0
  )

  const healthyRate = Number(
    risk?.healthy_rate_pct ?? 0
  )

  const riskStatus =
    risk?.risk_status || "UNKNOWN"

  const topStockoutAlerts =
    filteredStockoutAlerts.slice(0, 5)

  const topTransfers =
    filteredTransfers.slice(0, 5)

  const topCriticalActions =
    filteredCriticalActions.slice(0, 6)

  const activeFilterCount = Object.values(
    appliedFilters
  ).filter(
    (value) =>
      value !== "" &&
      value !== null &&
      value !== undefined
  ).length

  return (
    <Box>
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <Breadcrumbs
        sx={{
          mb: 2,
          color: "text.secondary",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.7,
          }}
        >
          <HomeOutlined sx={{ fontSize: 16 }} />

          <Typography
            sx={{
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            Operations
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: 13,
            color: "text.primary",
            fontWeight: 600,
          }}
        >
          Executive Overview
        </Typography>
      </Breadcrumbs>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: {
                xs: 26,
                md: 30,
              },
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "text.primary",
            }}
          >
            Executive Overview
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              fontSize: 14,
              color: "text.secondary",
            }}
          >
            Real-time supply chain performance, risks and decision
            intelligence.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            icon={
              loading ? (
                <CircularProgress
                  size={14}
                  color="inherit"
                />
              ) : error ? (
                <ReportProblemOutlined
                  sx={{
                    fontSize: "16px !important",
                  }}
                />
              ) : (
                <CheckCircleOutlineOutlined
                  sx={{
                    fontSize: "16px !important",
                  }}
                />
              )
            }
            label={
              loading
                ? "Loading data"
                : error
                  ? "Data unavailable"
                  : "Data ready"
            }
            variant="outlined"
            color={
              loading
                ? "default"
                : error
                  ? "error"
                  : "success"
            }
            sx={{
              bgcolor: "#FFFFFF",
              fontWeight: 600,
            }}
          />

          <Button
            variant="outlined"
            size="small"
            disabled={loading || refreshing}
            onClick={() =>
              loadDashboard({
                silent: true,
              })
            }
            startIcon={
              refreshing ? (
                <CircularProgress
                  size={15}
                  color="inherit"
                />
              ) : (
                <RefreshOutlined />
              )
            }
            sx={{
              minHeight: 32,
              bgcolor: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FilterAltOutlined
              sx={{
                color: "primary.main",
                fontSize: 21,
              }}
            />

            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Dashboard Filters
            </Typography>
          </Box>

          {activeFilterCount > 0 ? (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`${activeFilterCount} active`}
            />
          ) : (
            <Chip
              size="small"
              variant="outlined"
              label="Global view"
            />
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel>
              Business Unit
            </InputLabel>

            <Select
              value={businessUnit}
              label="Business Unit"
              onChange={(event) => {
                setBusinessUnit(
                  event.target.value
                )
                setStoreKey("")
                setProductKey("")
              }}
            >
              <MenuItem value="">
                All Business Units
              </MenuItem>

              {businessUnits.map((unit) => (
                <MenuItem
                  key={unit}
                  value={unit}
                >
                  {unit}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel>
              Store
            </InputLabel>

            <Select
              value={storeKey}
              label="Store"
              onChange={(event) => {
                setStoreKey(
                  event.target.value
                )
                setProductKey("")
              }}
            >
              <MenuItem value="">
                All Stores
              </MenuItem>

              {stores.map((store) => (
                <MenuItem
                  key={store.store_key}
                  value={store.store_key}
                >
                  {store.store_name}
                  {store.store_code
                    ? ` (${store.store_code})`
                    : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel>
              Product
            </InputLabel>

            <Select
              value={productKey}
              label="Product"
              onChange={(event) =>
                setProductKey(
                  event.target.value
                )
              }
            >
              <MenuItem value="">
                All Products
              </MenuItem>

              {products.map((product) => (
                <MenuItem
                  key={product.product_key}
                  value={product.product_key}
                >
                  {product.product_name}
                  {product.product_code
                    ? ` (${product.product_code})`
                    : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel>
              Minimum Risk
            </InputLabel>

            <Select
              value={minRiskRate}
              label="Minimum Risk"
              onChange={(event) =>
                setMinRiskRate(
                  event.target.value
                )
              }
            >
              <MenuItem value="">
                All Risk Levels
              </MenuItem>

              <MenuItem value={25}>
                25%+
              </MenuItem>

              <MenuItem value={50}>
                50%+
              </MenuItem>

              <MenuItem value={75}>
                75%+
              </MenuItem>

              <MenuItem value={90}>
                90%+
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            startIcon={
              <RestartAltOutlined />
            }
            onClick={handleResetFilters}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            startIcon={
              <FilterAltOutlined />
            }
            onClick={handleApplyFilters}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Paper>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error ? (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2.5,
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                loadDashboard()
              }
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <Paper
          elevation={0}
          sx={{
            minHeight: 420,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={32} />

            <Typography
              sx={{
                color: "text.secondary",
                fontSize: 14,
              }}
            >
              Loading supply chain intelligence...
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* =================================================
              GLOBAL RISK STATUS
          ================================================= */}

          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "#FFFFFF",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: "row",
                },
                alignItems: {
                  xs: "flex-start",
                  md: "center",
                },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#FFF7ED",
                    color: "#EA580C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShieldOutlined />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    SUPPLY CHAIN RISK STATUS
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "text.primary",
                    }}
                  >
                    Current operational risk is{" "}
                    {String(
                      riskStatus
                    ).toLowerCase()}.
                  </Typography>
                </Box>
              </Box>

              <Chip
                label={riskStatus}
                color={
                  getRiskColor(
                    riskStatus
                  )
                }
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>
          </Paper>

          {/* =================================================
              KPI CARDS
          ================================================= */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <MetricCard
              title="Store Products"
              value={formatNumber(
                risk?.total_store_products
              )}
              subtitle="Total store-product combinations monitored"
              tone="primary"
              icon={
                <Inventory2Outlined />
              }
            />

            <MetricCard
              title="Products at Risk"
              value={formatNumber(
                risk?.store_products_at_risk
              )}
              subtitle={`${formatDecimal(
                riskRate
              )}% of monitored inventory`}
              tone="warning"
              progress={riskRate}
              icon={
                <WarningAmberOutlined />
              }
            />

            <MetricCard
              title="Critical Risks"
              value={formatNumber(
                risk?.critical_risks
              )}
              subtitle={`${formatDecimal(
                criticalRate
              )}% critical exposure`}
              tone="error"
              progress={criticalRate}
              icon={
                <ReportProblemOutlined />
              }
            />

            <MetricCard
              title="Healthy Inventory"
              value={formatNumber(
                risk?.no_risk
              )}
              subtitle={`${formatDecimal(
                healthyRate
              )}% currently without risk`}
              tone="success"
              progress={healthyRate}
              icon={<TaskAltOutlined />}
            />
          </Box>

          {/* =================================================
              RISK DISTRIBUTION
          ================================================= */}

          <SectionCard
            title="Risk Distribution"
            subtitle={
              activeFilterCount > 0
                ? "Executive inventory profile — filters active"
                : "Executive inventory risk profile"
            }
            action={
              <Chip
                size="small"
                label={`Average score ${formatDecimal(
                  risk?.avg_risk_score
                )}`}
                variant="outlined"
              />
            }
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 3,
              }}
            >
              <RiskDistributionItem
                label="Critical"
                value={
                  risk?.critical_risks
                }
                rate={
                  risk?.critical_rate_pct
                }
                color="error.main"
              />

              <RiskDistributionItem
                label="High"
                value={risk?.high_risks}
                rate={
                  risk?.high_rate_pct
                }
                color="warning.main"
              />

              <RiskDistributionItem
                label="Medium"
                value={
                  risk?.medium_risks
                }
                rate={
                  risk?.medium_rate_pct
                }
                color="info.main"
              />

              <RiskDistributionItem
                label="No Risk"
                value={risk?.no_risk}
                rate={
                  risk?.healthy_rate_pct
                }
                color="success.main"
              />
            </Box>
          </SectionCard>

          {/* =================================================
              STORE RISK VIEW
          ================================================= */}

          <SectionCard
            title="Store Risk Overview"
            subtitle="Highest-risk stores in the current selection"
            action={
              <Chip
                size="small"
                label={`${filteredStoreRisks.length} stores`}
                variant="outlined"
              />
            }
          >
            {filteredStoreRisks.length === 0 ? (
              <Typography
                sx={{
                  fontSize: 13,
                  color: "text.secondary",
                }}
              >
                No stores match the selected filters.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {filteredStoreRisks
                  .slice(0, 6)
                  .map((item) => {
                    const storeInfo =
                      stores.find(
                        (store) =>
                          String(
                            store.store_key
                          ) ===
                          String(
                            item.store_key
                          )
                      )

                    return (
                      <Paper
                        key={
                          item.store_key
                        }
                        elevation={0}
                        sx={{
                          p: 2,
                          border:
                            "1px solid",
                          borderColor:
                            "divider",
                          borderRadius: 2.5,
                          bgcolor:
                            "#FAFBFD",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {storeInfo?.store_name ||
                            `Store ${item.store_key}`}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.5,
                            fontSize: 12,
                            color:
                              "text.secondary",
                          }}
                        >
                          {
                            item.products_at_risk
                          }{" "}
                          of{" "}
                          {
                            item.total_products
                          }{" "}
                          products at risk
                        </Typography>

                        <Box
                          sx={{
                            mt: 1.5,
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 20,
                              fontWeight: 800,
                            }}
                          >
                            {formatDecimal(
                              item.risk_rate_pct
                            )}
                            %
                          </Typography>

                          <Chip
                            size="small"
                            label={`${formatNumber(
                              item.critical_risks
                            )} critical`}
                            color={
                              Number(
                                item.critical_risks
                              ) > 0
                                ? "error"
                                : "success"
                            }
                            variant="outlined"
                          />
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            Number(
                              item.risk_rate_pct ||
                                0
                            ),
                            100
                          )}
                          color="warning"
                          sx={{
                            mt: 1.5,
                            height: 5,
                            borderRadius: 10,
                            bgcolor:
                              "#EEF2F7",
                          }}
                        />
                      </Paper>
                    )
                  })}
              </Box>
            )}
          </SectionCard>

          {/* =================================================
              STOCKOUT + TRANSFERS
          ================================================= */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, minmax(0, 1fr))",
              },
              gap: 3,
            }}
          >
            <SectionCard
              title="Priority Stockout Risks"
              subtitle="Highest-priority inventory shortages"
              action={
                <Chip
                  size="small"
                  label={`${filteredStockoutAlerts.length} matching`}
                  variant="outlined"
                />
              }
            >
              {topStockoutAlerts.length === 0 ? (
                <Typography
                  sx={{
                    color:
                      "text.secondary",
                    fontSize: 13,
                  }}
                >
                  No stockout alerts match the selected filters.
                </Typography>
              ) : (
                <Box>
                  {topStockoutAlerts.map(
                    (item, index) => {
                      const priority =
                        getPriorityLabel(
                          item
                        )

                      return (
                        <Box
                          key={
                            item?.inventory_key ??
                            `${getProductLabel(
                              item
                            )}-${getStoreLabel(
                              item
                            )}-${index}`
                          }
                        >
                          <Box
                            sx={{
                              py: 1.7,
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "flex-start",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color:
                                    "text.primary",
                                }}
                              >
                                {getProductLabel(
                                  item
                                )}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.3,
                                  fontSize: 12.5,
                                  color:
                                    "text.secondary",
                                }}
                              >
                                {getStoreLabel(
                                  item
                                )}
                                {" • "}
                                Stock:{" "}
                                {formatDecimal(
                                  item?.stock_disponible ??
                                    item?.stock_on_hand ??
                                    item?.available_stock ??
                                    item?.stock_qty ??
                                    item?.stock
                                )}
                                {" • "}
                                Coverage:{" "}
                                {formatDecimal(
                                  item?.days_of_stock
                                )}{" "}
                                days
                              </Typography>
                            </Box>

                            <Chip
                              size="small"
                              label={
                                priority
                              }
                              color={getPriorityColor(
                                priority
                              )}
                              sx={{
                                flexShrink: 0,
                                fontWeight: 600,
                              }}
                            />
                          </Box>

                          {index <
                          topStockoutAlerts.length -
                            1 ? (
                            <Divider />
                          ) : null}
                        </Box>
                      )
                    }
                  )}
                </Box>
              )}
            </SectionCard>

            <SectionCard
              title="Recommended Stock Transfers"
              subtitle="Priority rebalancing opportunities"
              action={
                <LocalShippingOutlined
                  sx={{
                    color:
                      "text.secondary",
                    fontSize: 21,
                  }}
                />
              }
            >
              {topTransfers.length === 0 ? (
                <Typography
                  sx={{
                    color:
                      "text.secondary",
                    fontSize: 13,
                  }}
                >
                  No transfer recommendations match the selected filters.
                </Typography>
              ) : (
                <Box>
                  {topTransfers.map(
                    (item, index) => (
                      <Box
                        key={
                          item?.transfer_key ??
                          item?.id ??
                          `${getProductLabel(
                            item
                          )}-${index}`
                        }
                      >
                        <Box
                          sx={{
                            py: 1.7,
                            display:
                              "flex",
                            alignItems:
                              "flex-start",
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              mt: 0.2,
                              width: 30,
                              height: 30,
                              borderRadius: 2,
                              bgcolor:
                                "#EEF4FF",
                              color:
                                "primary.main",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                            }}
                          >
                            <ArrowForwardOutlined
                              sx={{
                                fontSize: 17,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              minWidth: 0,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color:
                                  "text.primary",
                              }}
                            >
                              {getTransferDescription(
                                item
                              )}
                            </Typography>

                            {item?.uncovered_qty !==
                            undefined ? (
                              <Typography
                                sx={{
                                  mt: 0.3,
                                  fontSize: 12,
                                  color:
                                    "text.secondary",
                                }}
                              >
                                Uncovered
                                quantity:{" "}
                                {formatDecimal(
                                  item.uncovered_qty
                                )}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>

                        {index <
                        topTransfers.length -
                          1 ? (
                          <Divider />
                        ) : null}
                      </Box>
                    )
                  )}
                </Box>
              )}
            </SectionCard>
          </Box>

          {/* =================================================
              CRITICAL ACTIONS
          ================================================= */}

          <SectionCard
            title="Critical Actions"
            subtitle="Operational priorities requiring management attention"
            action={
              <Chip
                icon={
                  <TrendingUpOutlined
                    sx={{
                      fontSize:
                        "16px !important",
                    }}
                  />
                }
                size="small"
                label={`${filteredCriticalActions.length} matching`}
                variant="outlined"
              />
            }
          >
            {topCriticalActions.length === 0 ? (
              <Typography
                sx={{
                  color:
                    "text.secondary",
                  fontSize: 13,
                }}
              >
                No critical actions match the selected filters.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {topCriticalActions.map(
                  (item, index) => {
                    const priority =
                      getPriorityLabel(
                        item
                      )

                    return (
                      <Box
                        key={
                          item?.action_key ??
                          item?.id ??
                          `${getActionTitle(
                            item
                          )}-${index}`
                        }
                        sx={{
                          p: 2,
                          border:
                            "1px solid",
                          borderColor:
                            "divider",
                          borderRadius: 2.5,
                          bgcolor:
                            "#FAFBFD",
                        }}
                      >
                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "flex-start",
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 2,
                              bgcolor:
                                "#FEF2F2",
                              color:
                                "error.main",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                            }}
                          >
                            <ReportProblemOutlined
                              sx={{
                                fontSize: 19,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <Box
                              sx={{
                                display:
                                  "flex",
                                alignItems:
                                  "flex-start",
                                justifyContent:
                                  "space-between",
                                gap: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color:
                                    "text.primary",
                                }}
                              >
                                {getActionTitle(
                                  item
                                )}
                              </Typography>

                              {priority !==
                              "Priority" ? (
                                <Chip
                                  size="small"
                                  label={
                                    priority
                                  }
                                  color={getPriorityColor(
                                    priority
                                  )}
                                  sx={{
                                    flexShrink: 0,
                                  }}
                                />
                              ) : null}
                            </Box>

                            <Typography
                              sx={{
                                mt: 0.7,
                                fontSize: 12,
                                color:
                                  "text.secondary",
                              }}
                            >
                              Risk score:{" "}
                              {formatDecimal(
                                item?.risk_score
                              )}
                              {item?.primary_risk
                                ? ` • ${item.primary_risk}`
                                : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )
                  }
                )}
              </Box>
            )}
          </SectionCard>
        </Box>
      )}
    </Box>
  )
}

export default Dashboard