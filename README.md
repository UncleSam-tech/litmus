# Litmus (FDA Risk Intelligence MCP Server)

Litmus is a Model Context Protocol (MCP) server that gives AI agents structured, deterministic access to FDA regulatory risk data. It ingests and normalizes openFDA/FAERS adverse-event reports, FDA Data Dashboard inspection and enforcement records, and SEC EDGAR filings into a PostgreSQL warehouse, then serves scored intelligence briefs through five agent-facing tools.

## Tools

| Tool | Purpose |
|------|---------|
| `getCompanyFdaBrief` | Unified regulatory risk brief for a company across all ingested sources |
| `getAdverseEventSignal` | Adverse-event (FAERS) signal detection for a drug or company |
| `getFacilityInspectionHistory` | FDA facility inspection history and classifications |
| `searchEnforcementActions` | Search recalls and enforcement actions |
| `compareCompaniesFdaRisk` | Side-by-side FDA risk comparison across companies |

## Architecture

- **Runtime:** Node.js 18+, TypeScript (ESM), Express
- - **MCP:** `@modelcontextprotocol/sdk` + `@ctxprotocol/sdk` middleware
  - - **Data sources:** openFDA (FAERS), FDA Data Dashboard API, SEC EDGAR
    - - **Storage:** PostgreSQL (normalized warehouse) + Redis cache
      - - **Ingestion:** BullMQ background workers with dedicated pipelines per source (`ingest:faers`, `ingest:dashboard`, `ingest:edgar`)
        - - **Hardening:** helmet, express-rate-limit, zod input validation, winston structured logging
         
          - Source layout: `src/app` (server), `src/tools` (MCP tools), `src/services` (briefs, scoring, sources, entities, cache, queues), `src/db`, `src/config`, `src/utils`.
         
          - ## Quick start
         
          - ```bash
            # 1. Install
            npm install

            # 2. Configure
            cp .env.example .env   # set DATABASE_URL, REDIS_URL, openFDA + FDA Dashboard keys

            # 3. Infrastructure (Postgres 15 + Redis 7)
            docker-compose up -d

            # 4. Migrate & seed
            npm run migrate
            npm run seed

            # 5. Ingest data
            npm run ingest          # or ingest:faers / ingest:dashboard / ingest:edgar

            # 6. Run
            npm run dev             # tsx watch
            # production: npm run build && npm start
            ```

            ## Environment variables

            | Variable | Required | Description |
            |----------|----------|-------------|
            | `DATABASE_URL` | Yes | PostgreSQL connection string |
            | `REDIS_URL` | Yes | Redis connection string |
            | `OPENFDA_API_KEY` | Recommended | Raises openFDA rate limits |
            | `FDA_DASHBOARD_AUTH_USER` / `FDA_DASHBOARD_AUTH_KEY` | Yes | FDA Data Dashboard API credentials |
            | `SEC_EDGAR_USER_AGENT` | Yes | EDGAR fair-use contact string |
            | `PORT` | No | Default 8080 |
            
