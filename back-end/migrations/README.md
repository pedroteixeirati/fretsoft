As migrations do projeto passam a ser versionadas com `node-pg-migrate`.

Comandos principais:
- `npm run db:migrate`
- `npm run db:migrate:down`
- `npm run db:migrate:create`

Observacao:
- `back-end/schema.sql` continua como referencia estrutural do banco.
- As migrations cobrem as alteracoes incrementais a partir desta adocao.
- No deploy de producao, o script `scripts/deploy-vps.sh` agora roda `npm run db:migrate` antes do build e do restart da API.
