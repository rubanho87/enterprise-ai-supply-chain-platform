# Enterprise AI Supply Chain Platform

End-to-end Supply Chain Data & AI platform built with Databricks Lakehouse, SQL, Machine Learning, and interactive Risk Intelligence dashboards.

## Project Overview

This project demonstrates the development of an end-to-end data and AI solution for retail and supply chain analytics.

The platform transforms raw operational data into analytics-ready datasets, machine learning features, risk indicators, and interactive decision-support dashboards.

The solution follows a Lakehouse architecture:

Raw Data → Bronze → Silver → Gold → Analytics → Machine Learning → Risk Intelligence → Dashboard

## Business Objectives

The platform is designed to help organizations:

- Monitor sales and supply chain operations
- Analyze inventory and product performance
- Identify products and stores exposed to operational risk
- Detect abnormal patterns
- Prioritize critical supply chain situations
- Support data-driven operational decisions

## Architecture

The project implements a multi-layer Databricks Lakehouse architecture:

### Bronze Layer
Raw data ingestion and preservation.

### Silver Layer
Data cleaning, standardization, validation, and preparation of analytical dimensions.

### Gold Layer
Business-ready analytical datasets and KPIs.

### Machine Learning Layer
Baseline forecasting and machine learning experiments for predictive analytics.

### Risk Intelligence Layer
Product-store risk scoring and severity classification.

### BI & Decision Intelligence Layer
Interactive Databricks dashboards for operational and executive analysis.

## Supply Chain Risk Intelligence Dashboard

An interactive Databricks dashboard was developed on top of the analytical and risk layers.

### Executive KPIs

| KPI | Value |
|---|---:|
| Total Store-Products | 3,071 |
| Products at Risk | 2,126 |
| Critical Risks | 398 |
| Risk Rate | 69.23% |

### Dashboard Capabilities

- Executive supply chain risk monitoring
- Store-level risk analysis
- Product-level risk analysis
- Risk severity distribution
- Critical, high, and medium occurrence analysis
- Average risk scoring
- Top stores by products at risk
- Top stores by risk rate
- Top products at risk
- Interactive Store and Risk Level filters
- Detailed product risk investigation

## Machine Learning

The project includes demand forecasting experiments using:

- Naive-1 baseline
- Naive-7 baseline
- Rolling mean baseline
- Gradient Boosted Tree Regressor

The machine learning workflow is designed to support model comparison and progressive integration with MLflow.

## Technology Stack

- Databricks
- Apache Spark
- Spark SQL
- Python
- SQL
- Delta Lake
- Databricks Lakehouse
- Machine Learning
- Databricks AI/BI Dashboards
- Git & GitHub

## Data Privacy

The original operational datasets used during development are not included in this public repository.

The repository contains only code, architecture, documentation, analytical logic, and non-sensitive portfolio artifacts.

## Project Status

**Active Development**

Completed:

- Data ingestion
- Bronze layer
- Silver layer
- Gold analytical marts
- Anomaly detection
- Forecasting baselines
- Gradient Boosted Tree forecasting model
- Supply chain risk analytics
- Supply Chain Risk Intelligence Dashboard

Next:

- MLflow experiment tracking
- Model management
- API integration
- Monitoring
- Production-oriented deployment architecture

## Author

**Ruben KANKU**

Data Analytics • Data Science • AI • Digital Transformation
