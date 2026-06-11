-- Up Migration

-- Dados estruturados do MDF-e (manifesto da viagem): veiculo de tracao, condutor,
-- percurso, CT-es agregados e totais. jsonb versionavel, no mesmo padrao de cte_data.
alter table if exists fiscal_documents add column if not exists mdfe_data jsonb not null default '{}'::jsonb;

-- Down Migration

alter table if exists fiscal_documents drop column if exists mdfe_data;
