import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#2563EB",
      dark: "#1D4ED8",
      light: "#DBEAFE",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#7C3AED",
      dark: "#6D28D9",
      light: "#EDE9FE",
    },

    success: {
      main: "#16A34A",
      light: "#DCFCE7",
    },

    warning: {
      main: "#D97706",
      light: "#FEF3C7",
    },

    error: {
      main: "#DC2626",
      light: "#FEE2E2",
    },

    info: {
      main: "#0284C7",
      light: "#E0F2FE",
    },

    background: {
      default: "#F5F7FB",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#111827",
      secondary: "#64748B",
    },

    divider: "#E5E7EB",
  },

  typography: {
    fontFamily: [
      "Inter",
      "Segoe UI",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),

    h1: {
      fontSize: "2rem",
      fontWeight: 700,
    },

    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
    },

    h3: {
      fontSize: "1.25rem",
      fontWeight: 700,
    },

    h4: {
      fontSize: "1.1rem",
      fontWeight: 700,
    },

    h5: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 700,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          minWidth: 320,
          minHeight: "100vh",
          backgroundColor: "#F5F7FB",
        },

        "*": {
          boxSizing: "border-box",
        },

        a: {
          color: "inherit",
          textDecoration: "none",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 40,
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#475569",
          backgroundColor: "#F8FAFC",
        },
      },
    },
  },
})

export default theme