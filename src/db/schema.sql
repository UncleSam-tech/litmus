-- db/schema.sql

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  ticker TEXT,
  cik TEXT,
  aliases TEXT[] DEFAULT '{}',
  sic_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE facilities (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  fei_number TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  country_code TEXT,
  country_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_ticker ON companies(ticker);
CREATE INDEX idx_companies_canonical ON companies(canonical_name);
CREATE INDEX idx_facilities_fei ON facilities(fei_number);
CREATE INDEX idx_facilities_company ON facilities(company_id);

CREATE TABLE inspections (
  id SERIAL PRIMARY KEY,
  fei_number TEXT REFERENCES facilities(fei_number),
  inspection_id TEXT UNIQUE NOT NULL,
  classification TEXT,
  classification_code TEXT,
  inspection_end_date DATE,
  product_type TEXT,
  project_area TEXT,
  fmd_145_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspections_fei ON inspections(fei_number);
CREATE INDEX idx_inspections_date ON inspections(inspection_end_date);

CREATE TABLE citations (
  id SERIAL PRIMARY KEY,
  inspection_id TEXT REFERENCES inspections(inspection_id),
  citation_id TEXT NOT NULL,
  cfr_reference TEXT,
  short_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_inspection ON citations(inspection_id);

CREATE TABLE warning_letters (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  letter_id TEXT UNIQUE NOT NULL,
  issue_date DATE,
  issuing_office TEXT,
  subject TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  closeout_date DATE,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warning_letters_company ON warning_letters(company_id);

CREATE TABLE compliance_actions (
  id SERIAL PRIMARY KEY,
  fei_number TEXT REFERENCES facilities(fei_number),
  action_type TEXT NOT NULL,
  action_taken_date DATE,
  product_type TEXT,
  case_injunction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_actions_fei ON compliance_actions(fei_number);

CREATE TABLE recalls (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  recall_number TEXT UNIQUE NOT NULL,
  product_type TEXT,
  product_description TEXT,
  recall_class TEXT,
  initiation_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recalls_company ON recalls(company_id);

CREATE TABLE faers_aggregates (
  id SERIAL PRIMARY KEY,
  drug_name TEXT NOT NULL,
  reaction_counts JSONB DEFAULT '{}',
  serious_counts INTEGER DEFAULT 0,
  death_counts INTEGER DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faers_drug ON faers_aggregates(drug_name);

CREATE TABLE import_refusals (
  id SERIAL PRIMARY KEY,
  fei_number TEXT REFERENCES facilities(fei_number),
  refusal_date DATE,
  charges TEXT[],
  product_code TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_refusals_fei ON import_refusals(fei_number);

CREATE TABLE score_snapshots (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) UNIQUE,
  score INTEGER,
  risk_level TEXT,
  drivers JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_snapshots_company ON score_snapshots(company_id);
