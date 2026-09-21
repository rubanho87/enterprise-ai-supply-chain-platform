# Enterprise AI Supply Chain Platform

An end-to-end **AI-powered Supply Chain Decision Intelligence Platform** combining Databricks, FastAPI, React, and an AI assistant to transform operational retail data into inventory intelligence, stockout alerts, transfer recommendations, critical actions, and management-ready insights.

The project demonstrates a production-oriented architecture from data engineering and analytics to API serving and an operational decision interface.

---

## Project Overview

Supply chain teams often have data but still struggle to answer operational questions such as:

- Which stores are at risk of stockout?
- Which products require immediate attention?
- Where is inventory excessive?
- Can excess stock from one store cover shortages in another?
- Which actions should management prioritize?
- Can business users query supply-chain information using natural language?

This platform addresses these problems through an integrated decision-intelligence architecture.

```text
Operational Data
       |
       v
Databricks Lakehouse
       |
       v
Data Engineering & Analytics
       |
       v
Supply Chain Risk Engine
       |
       +----------------------+
       |                      |
       v                      v
Inventory Intelligence   Stockout Intelligence
       |                      |
       +-----------+----------+
                   |
                   v
        Transfer Recommendations
                   |
                   v
           Critical Actions
                   |
                   v
        Databricks Serving Layer
                   |
                   v
              FastAPI API
                   |
          +--------+--------+
          |                 |
          v                 v
 React Command Center    AI Assistant
```

---

## Key Capabilities

### Executive Overview

A management-oriented command center providing a consolidated view of supply-chain performance and operational risks.

The dashboard surfaces key indicators and enables decision makers to quickly identify areas requiring attention.

### Inventory Intelligence

Provides store- and product-level inventory visibility, including:

- available stock
- inventory status
- product information
- store information
- stock movements
- inventory health indicators

### Stockout Risk Intelligence

Detects products and stores exposed to stock shortages using recent sales and inventory information.

The serving layer includes operational indicators such as:

- current stock
- 30-day sales
- average daily sales
- days of stock
- stockout priority
- priority ranking
- inventory status

### Intelligent Stock Transfers

Generates inventory rebalancing recommendations between stores.

For each recommendation, the system identifies:

- product
- donor store
- receiver store
- donor stock
- receiver stock
- uncovered demand
- transferable stock
- proposed transfer quantity
- replenishment priority

Instead of exposing internal surrogate keys to business users, the application resolves stores into readable business names and codes.

Example:

```text
DELVAUX 3 (38)  ->  POMPAGE SSC (AK)
```

### Critical Actions

Converts analytical risks into a prioritized operational action queue.

The interface highlights:

- severity
- primary risk
- risk score
- affected store
- affected product
- operational action required

This allows management to move from analytics to action.

### Supply Chain AI Assistant

The platform also includes an AI assistant designed for natural-language interaction with supply-chain information.

The assistant architecture includes:

- intent routing
- decision context
- grounding
- AI decision services
- LLM integration
- supply-chain context retrieval

The project supports local LLM experimentation through **Ollama**, allowing AI capabilities to be developed without requiring a paid external LLM API.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Data Platform | Databricks |
| Data Processing | SQL / Python |
| Analytical Architecture | Lakehouse |
| Serving Layer | Databricks SQL |
| Backend API | FastAPI |
| Backend Language | Python |
| Frontend | React |
| Build Tool | Vite |
| UI Framework | Material UI |
| API Communication | Axios |
| AI / LLM | Ollama |
| Architecture | REST API + Decision Intelligence |

---

## Databricks Architecture

The analytical platform is organized into multiple logical layers.

### Gold Layer

The Gold layer contains business-ready analytical datasets used by the risk and decision engines.

Examples include:

```text
daily_sales
dim_store
fact_inventory
fact_sales
fact_stock_movements
inventory_health
inventory_health_v2
replenishment_recommendations
shop_risk_score
stockout_alerts
supply_chain_risk_mart
```

### Mart Layer

Decision-oriented analytical marts provide consolidated risk information for operational applications.

Examples include:

```text
critical_risk_actions
risk_by_store
supply_chain_critical_actions
supply_chain_risk_by_store
supply_chain_risk_dashboard
```

### Serving Layer

The serving layer exposes curated datasets optimized for the operational application.

Current serving objects include:

```text
critical_risk_actions
executive_risk
product_risk_score
risk_by_product
risk_by_store
stock_transfer_recommendations
stockout_alerts
```

The FastAPI backend queries this layer instead of exposing raw analytical tables directly to the frontend.

---

## Backend API

The backend is implemented with **FastAPI** and acts as the application service layer between Databricks and the React frontend.

Example API areas include:

```text
/api/v1/stockouts/alerts
/api/v1/transfers/recommendations
```

Additional routes support inventory intelligence, executive risk information, critical actions, and AI-assisted decision workflows.

### Example Transfer Response

```json
{
  "article": "D16090",
  "donor_store_code": "38",
  "donor_store_name": "DELVAUX 3",
  "receiver_store_code": "AK",
  "receiver_store_name": "POMPAGE SSC",
  "donor_stock": 902,
  "receiver_stock": 15,
  "uncovered_qty": 208,
  "proposed_transfer_qty": 208,
  "replenishment_priority": "URGENT"
}
```

---

## Frontend Command Center

The React application provides the operational interface for the platform.

Main application pages include:

```text
Executive Overview
Inventory
Stockout Risks
Stock Transfers
Critical Actions
Supply Chain AI Assistant
```

The interface was designed as a supply-chain command center rather than a traditional reporting dashboard.

Its purpose is to help users answer:

> What is happening?

> Where is the risk?

> What should we do?

---

## Project Structure

```text
enterprise-ai-supply-chain-platform/
|
|-- app/
|   |-- api/
|   |   `-- routes/
|   |
|   |-- db/
|   |
|   `-- services/
|       |-- ai_assistant.py
|       |-- ai_decision.py
|       |-- context_router.py
|       |-- decision_context.py
|       |-- grounding.py
|       |-- intent_router.py
|       `-- ollama.py
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   `-- layout/
|   |   |       |-- Sidebar.jsx
|   |   |       `-- Topbar.jsx
|   |   |
|   |   |-- pages/
|   |   |   |-- Dashboard.jsx
|   |   |   |-- Inventory.jsx
|   |   |   |-- StockoutRisks.jsx
|   |   |   |-- Transfers.jsx
|   |   |   |-- CriticalActions.jsx
|   |   |   `-- AIAssistant.jsx
|   |   |
|   |   |-- services/
|   |   |   `-- api.js
|   |   |
|   |   `-- styles/
|   |       `-- theme.js
|   |
|   `-- package.json
|
|-- scripts/
|   `-- validate_ai_assistant.py
|
|-- .env.example
|-- .gitignore
|-- requirements.txt
`-- README.md
```

---

## Screenshots

The application includes six major operational views:

### Executive Overview

Management-level visibility into supply-chain risks and operational performance.

### Inventory Intelligence

Inventory visibility across products and stores.

### Stockout Risks

Prioritized stockout alerts based on inventory and recent demand.

### Stock Transfers

AI-ready inventory rebalancing recommendations between donor and receiver stores.

### Critical Actions

Prioritized management actions generated from operational risk signals.

### Supply Chain AI Assistant

Natural-language interface for supply-chain decision support.

> Screenshots can be added to a `docs/screenshots/` directory and referenced from this section.

---

## Running the Backend

Create and activate the Python environment, install dependencies, and configure the environment variables.

```bash
pip install -r requirements.txt
```

Create the local environment configuration from:

```text
.env.example
```

Then start the FastAPI application according to the project configuration.

Example:

```bash
uvicorn app.main:app --reload
```

---

## Running the Frontend

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

---

## Environment Variables

Sensitive credentials are intentionally excluded from the repository.

Use the provided:

```text
.env.example
```

to configure the required environment variables locally.

Do **not** commit:

```text
.env
Databricks access tokens
database credentials
API secrets
private infrastructure credentials
```

---

## Validation

The frontend has been validated using the production build:

```bash
npm run build
```

The project also contains an AI assistant validation script:

```bash
python scripts/validate_ai_assistant.py
```

---

## Business Value

This project demonstrates how a modern data platform can evolve beyond dashboards.

Traditional BI typically answers:

```text
What happened?
```

This platform extends that approach toward:

```text
What is happening?
        |
        v
What is at risk?
        |
        v
What should be prioritized?
        |
        v
What action should be taken?
```

The result is a practical **Supply Chain Decision Intelligence Platform** connecting data engineering, analytics, AI, APIs, and an operational user interface.

---

## Use Cases

The architecture can support retail and distribution environments requiring:

- multi-store inventory monitoring
- stockout prevention
- inventory rebalancing
- demand-aware replenishment
- supply-chain risk prioritization
- management decision support
- AI-assisted operational analytics

---

## Engineering Focus

This portfolio project demonstrates practical experience across:

**Data Engineering**

Databricks, analytical data modeling, transformations, marts, serving datasets.

**Data Analytics**

Inventory analysis, demand indicators, stockout detection, store/product risk analysis.

**Backend Engineering**

FastAPI, REST APIs, Databricks query integration, application services.

**Frontend Engineering**

React, Material UI, responsive operational dashboards.

**Artificial Intelligence**

Natural-language interaction, intent routing, grounding, decision context, local LLM integration.

**Decision Intelligence**

Transforming analytical signals into prioritized operational recommendations and actions.

---

## Security

The public repository should contain only code and non-sensitive examples.

Production credentials, access tokens, private business datasets, and infrastructure secrets must remain outside version control.

---

## Project Status

**Functional end-to-end prototype**

Implemented components:

- Databricks analytical layer
- Supply-chain risk intelligence
- Stockout alerts
- Stock-transfer recommendations
- Critical-action prioritization
- FastAPI serving backend
- React operational command center
- AI assistant architecture
- Local LLM integration
- Production frontend build validation

---

## Author

**Ruben KANKU**

Data & AI | Business Intelligence | Digital Transformation

Democratic Republic of the Congo

---

## Disclaimer

This repository is a portfolio and demonstration project.

Any operational data used during development should be treated according to the applicable confidentiality and data-governance requirements. Sensitive source datasets and credentials are not intended for public distribution.
