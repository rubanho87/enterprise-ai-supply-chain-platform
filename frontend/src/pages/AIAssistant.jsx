import { useState } from "react"

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"

import {
  AutoAwesomeOutlined,
  PsychologyOutlined,
  SendOutlined,
} from "@mui/icons-material"

import { aiApi } from "../services/api"

const suggestions = [
  "What are the most critical stockout risks?",
  "Which products require immediate action?",
  "What stock transfers should we prioritize?",
  "Summarize the current supply chain risk.",
]

function extractAnswer(payload) {
  if (!payload) {
    return "No response was returned by the AI assistant."
  }

  if (typeof payload === "string") {
    return payload
  }

  const candidates = [
    payload.answer,
    payload.response,
    payload.message,
    payload.result,
    payload.output,
    payload.data?.answer,
    payload.data?.response,
    payload.data?.message,
    payload.data?.result,
    payload.data?.output,
  ]

  const answer = candidates.find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0
  )

  if (answer) {
    return answer
  }

  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return "The AI assistant returned an unsupported response."
  }
}

function AIAssistant() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const askQuestion = async (text = question) => {
    const cleanQuestion = String(text || "").trim()

    if (!cleanQuestion || loading) return

    setError("")
    setQuestion("")

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: cleanQuestion,
      },
    ])

    setLoading(true)

    try {
      const response = await aiApi.ask({
        question: cleanQuestion,
      })

      const answer = extractAnswer(response?.data)

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer,
        },
      ])
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to contact the Supply Chain AI Assistant."

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      askQuestion()
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <AutoAwesomeOutlined
            sx={{
              fontSize: 32,
              color: "primary.main",
            }}
          />

          <Box>
            <Typography variant="h4" fontWeight={800}>
              Supply Chain AI Assistant
            </Typography>

            <Typography color="text.secondary">
              Ask questions about inventory, stockout risks,
              transfers and supply chain operations.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          borderRadius: 3,
          minHeight: 500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            p: 3,
            minHeight: 400,
            maxHeight: "58vh",
            overflowY: "auto",
            bgcolor: "#F8FAFC",
          }}
        >
          {!messages.length && (
            <Box
              sx={{
                textAlign: "center",
                py: 5,
              }}
            >
              <PsychologyOutlined
                sx={{
                  fontSize: 58,
                  color: "primary.main",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                fontWeight={800}
              >
                Operational Intelligence Assistant
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  maxWidth: 600,
                  mx: "auto",
                  mt: 1,
                  mb: 3,
                }}
              >
                Query your supply-chain intelligence layer using
                natural language.
              </Typography>

              <Stack
                direction="row"
                useFlexGap
                flexWrap="wrap"
                justifyContent="center"
                gap={1}
              >
                {suggestions.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    variant="outlined"
                    clickable
                    onClick={() =>
                      askQuestion(suggestion)
                    }
                    sx={{
                      bgcolor: "#FFFFFF",
                      height: "auto",
                      py: 0.5,
                      "& .MuiChip-label": {
                        whiteSpace: "normal",
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Stack spacing={2}>
            {messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                sx={{
                  display: "flex",
                  justifyContent:
                    message.role === "user"
                      ? "flex-end"
                      : "flex-start",
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    maxWidth: "78%",
                    borderRadius: 3,
                    bgcolor:
                      message.role === "user"
                        ? "primary.main"
                        : "#FFFFFF",
                    color:
                      message.role === "user"
                        ? "primary.contrastText"
                        : "text.primary",
                  }}
                >
                  <Typography
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                      fontSize: 14,
                    }}
                  >
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {loading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <CircularProgress size={18} />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Analyzing supply chain data...
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: "#FFFFFF",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-end"
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask about inventory, risks, transfers or operational actions..."
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <Button
              variant="contained"
              endIcon={<SendOutlined />}
              onClick={() => askQuestion()}
              disabled={
                loading || !question.trim()
              }
              sx={{
                minWidth: 110,
                height: 56,
              }}
            >
              Ask AI
            </Button>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mt: 1,
            }}
          >
            Connected to the Enterprise AI Supply Chain
            intelligence layer.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default AIAssistant