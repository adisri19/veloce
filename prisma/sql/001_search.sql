CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS candidate_fts_idx ON "Candidate"
  USING GIN (to_tsvector('english',
    coalesce("fullName",'') || ' ' || coalesce("email",'') || ' ' ||
    coalesce("currentTitle",'') || ' ' || coalesce("currentCompany",'') || ' ' ||
    coalesce("parsedResumeText",'')));
CREATE INDEX IF NOT EXISTS candidate_name_trgm_idx ON "Candidate" USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS note_fts_idx ON "CandidateNote"
  USING GIN (to_tsvector('english', "content"));
-- Immutability guard for the audit trail
CREATE OR REPLACE FUNCTION forbid_audit_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'AuditLog is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_no_update ON "AuditLog";
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION forbid_audit_mutation();
