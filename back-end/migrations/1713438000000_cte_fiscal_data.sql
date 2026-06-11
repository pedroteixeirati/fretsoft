-- Up Migration

-- Emitente: CRT (Codigo de Regime Tributario) para o CT-e. 1=Simples, 2=Simples excesso, 3=Normal.
alter table if exists tenants add column if not exists crt text;

-- Partes do CT-e: endereco completo + codigo IBGE do municipio + telefone.
alter table if exists fiscal_document_parties add column if not exists phone text;
alter table if exists fiscal_document_parties add column if not exists street text;
alter table if exists fiscal_document_parties add column if not exists number text;
alter table if exists fiscal_document_parties add column if not exists district text;
alter table if exists fiscal_document_parties add column if not exists zip_code text;
alter table if exists fiscal_document_parties add column if not exists city_ibge_code text;

-- Dados fiscais estruturados do CT-e (tributacao, carga, NF-e vinculada, IBGE de inicio/fim).
-- jsonb versionavel: estavel para CT-e atual e pronto para novos grupos da Reforma (IBS/CBS).
alter table if exists fiscal_documents add column if not exists cte_data jsonb not null default '{}'::jsonb;

-- Down Migration

alter table if exists fiscal_documents drop column if exists cte_data;

alter table if exists fiscal_document_parties drop column if exists city_ibge_code;
alter table if exists fiscal_document_parties drop column if exists zip_code;
alter table if exists fiscal_document_parties drop column if exists district;
alter table if exists fiscal_document_parties drop column if exists number;
alter table if exists fiscal_document_parties drop column if exists street;
alter table if exists fiscal_document_parties drop column if exists phone;

alter table if exists tenants drop column if exists crt;
