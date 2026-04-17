# Database Migrations

As migrations do projeto sao versionadas com `node-pg-migrate`.

## Comandos
- `npm run db:migrate`
- `npm run db:migrate:down`
- `npm run db:migrate:create`
- `npm run db:migrate:redo`

## Observacoes
- `back-end/schema.sql` continua como referencia estrutural do banco.
- As migrations cobrem as alteracoes incrementais a partir da adocao do `node-pg-migrate`.
- No deploy de producao, o script [deploy-vps.sh](C:\Users\pedro\Documents\Projetos\Nova-Log-main\scripts\deploy-vps.sh) executa `npm run db:migrate` antes do build e do restart da API.
- A pasta `back-end/migrations` deve conter apenas arquivos de migration reconhecidos pelo runner, como `.sql`, `.js` ou `.ts`.
