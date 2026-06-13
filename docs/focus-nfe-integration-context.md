# Contexto da integracao Focus NFe

Este documento registra o contexto tecnico e de produto da integracao fiscal com a Focus NFe no Fretsoft/NovaLog. Ele foi criado para permitir continuidade em outra branch ou ferramenta sem precisar recuperar todo o historico da conversa.

Nao incluir tokens, webhook secrets, certificados, senhas ou credenciais neste arquivo. As credenciais devem permanecer somente em variaveis de ambiente da VPS/local.

## Objetivo do fluxo fiscal

O objetivo da integracao e permitir que a NovaLog opere o processo fiscal completo do transporte dentro do Fretsoft:

1. Receber a NF-e do cliente/remetente.
2. Cadastrar ou importar os dados da NF-e no sistema.
3. Criar um CT-e a partir da NF-e e dos dados operacionais do frete.
4. Autorizar o CT-e na Focus NFe/SEFAZ.
5. Criar um MDF-e com os CT-es autorizados.
6. Autorizar o MDF-e.
7. Encerrar o MDF-e ao final da viagem.
8. Guardar chave, protocolo, XML, PDF/DACTE/DAMDFE, logs e eventos.
9. Amarrar isso ao financeiro, TAC, CIOT, motorista, veiculo e seguro de carga.

## Ambiente e configuracao

O provider fiscal usado e a Focus NFe:

- `FISCAL_PROVIDER=focus_nfe`
- `FOCUS_NFE_ENV=homologacao` durante os testes.
- Token Focus configurado por ambiente, sem commit no repositorio.
- Certificado digital cadastrado no painel da Focus NFe.
- CT-e habilitado no painel da Focus.
- MDF-e habilitado no painel da Focus.
- Webhooks apontando para o backend publico da VPS.

Configuracoes publicas importantes:

- Tenant/slug: `novalog`
- CNPJ NovaLog: `41944655000103`
- `FOCUS_WEBHOOK_CNPJ=41944655000103`
- `FRETSOFT_PUBLIC_API_BASE_URL=https://fretsoft.cloud`

Dados fiscais da NovaLog usados em producao/homologacao:

- Razao social: NovaLog
- CNPJ: `41944655000103`
- Inscricao estadual: `0040470190019`
- Municipio: Belo Horizonte/MG
- Codigo IBGE: `3106200`
- CEP: `30110-915`
- Endereco: Avenida do Contorno, 2905
- Complemento: 407
- Bairro: Santa Efigenia
- Telefone: `31991457788`

Features do tenant que precisam estar ativas:

- `fiscal`
- `fiscal.cte`
- `fiscal.mdfe`
- `fiscal.third_party`

## Arquitetura fiscal no backend

O modulo fiscal foi estruturado para suportar provider real e mock:

- Provider real: `focus_nfe`
- Provider mock: `mock_fiscal`

Principais responsabilidades:

- Criar documentos fiscais internos.
- Emitir documentos pela Focus NFe.
- Sincronizar status com a Focus.
- Cancelar documentos.
- Emitir carta de correcao.
- Encerrar MDF-e.
- Incluir condutor em MDF-e.
- Receber webhooks.
- Registrar eventos e logs de comunicacao.
- Guardar payloads normalizados e respostas do provider.

Arquivos principais:

- `back-end/modules/fiscal/controllers/fiscal.controller.ts`
- `back-end/modules/fiscal/services/fiscal-documents.service.ts`
- `back-end/modules/fiscal/services/fiscal-provider.service.ts`
- `back-end/modules/fiscal/repositories/fiscal-documents.repository.ts`
- `back-end/modules/fiscal/providers/focus-nfe.provider.ts`
- `back-end/modules/fiscal/providers/mock-fiscal.provider.ts`
- `back-end/modules/fiscal/schemas/fiscal.schema.ts`

## Endpoints internos do Fretsoft

Endpoints principais do modulo fiscal:

- `GET /api/fiscal/documents`
- `POST /api/fiscal/documents`
- `GET /api/fiscal/documents/:id`
- `PATCH /api/fiscal/documents/:id`
- `POST /api/fiscal/documents/:id/emit`
- `POST /api/fiscal/documents/:id/sync`
- `POST /api/fiscal/documents/:id/close`
- `POST /api/fiscal/documents/:id/cancel`
- `POST /api/fiscal/documents/:id/correction-letter`
- `POST /api/fiscal/documents/:id/mdfe-driver`
- `POST /api/fiscal/documents/:id/email`
- `GET /api/fiscal/documents/:id/events`
- `GET /api/fiscal/documents/:id/communication-logs`
- `POST /api/fiscal/webhooks/focus/:event?`

Endpoints de NF-e recebida:

- `GET /api/fiscal/nfe-receipts`
- `POST /api/fiscal/nfe-receipts/import`
- `PATCH /api/fiscal/nfe-receipts/:id/status`

Endpoints/recursos de seguro de carga:

- Modulo/tabela `cargo_insurance_policies`.
- Usado para montar o bloco `seguros_carga` do MDF-e.

## Endpoints Focus NFe usados ou planejados

CT-e:

- `POST /cte?ref={referencia}`
- `GET /cte/{referencia}?completa=1`
- `DELETE /cte/{referencia}`
- `POST /cte/{referencia}/carta_correcao`

MDF-e:

- `POST /mdfe?ref={referencia}`
- `GET /mdfe/{referencia}?completa=1`
- `POST /mdfe/{referencia}/encerrar`
- `DELETE /mdfe/{referencia}`
- `POST /mdfe/{referencia}/inclusao_condutor`

Webhooks:

- `POST /hooks`

Observacao: a referencia (`ref`) deve ser unica por documento e e usada para consultar, sincronizar e operar o documento depois da emissao.

## Tabelas e entidades fiscais

Tabelas fiscais principais:

- `fiscal_documents`
- `fiscal_document_parties`
- `fiscal_document_payments`
- `fiscal_document_freights`
- `fiscal_events`
- `fiscal_communication_logs`
- `cargo_insurance_policies`
- `fiscal_nfe_receipts`

### fiscal_documents

Representa CT-e, MDF-e e outros documentos fiscais controlados pelo sistema.

Guarda, entre outros pontos:

- Tipo do documento.
- Status interno.
- Ambiente fiscal.
- Referencia externa.
- Chave fiscal.
- Protocolo.
- Payload normalizado.
- Resposta do provider.
- Dados do CT-e/MDF-e.
- Datas de autorizacao, rejeicao, cancelamento ou encerramento.

### fiscal_nfe_receipts

Tabela criada para a caixa de NF-es recebidas. Ela permite guardar XMLs de NF-e recebidos antes da criacao do CT-e.

Campos conceituais:

- Tenant.
- Chave da NF-e.
- Numero, serie e data de emissao.
- Emitente/remetente.
- Destinatario.
- Valor total da NF-e.
- Peso/volumes quando existentes no XML.
- XML original.
- Dados parseados.
- Status: disponivel, usado, ignorado etc.
- Vinculo com documento fiscal gerado quando aplicavel.

## Importacao de NF-e recebida

Foi implementada uma primeira versao da "caixa de entrada" de NF-es:

- Upload/importacao de XML de NF-e no backend.
- Parser backend para extrair os dados principais.
- Persistencia multi-tenant na tabela `fiscal_nfe_receipts`.
- API para listar NF-es recebidas.
- API para alterar status da NF-e recebida.
- UI no modulo fiscal para visualizar NF-es recebidas.
- Acao "Gerar CT-e" a partir de uma NF-e recebida.
- Ao salvar o CT-e gerado, a NF-e pode ser marcada como `used`.

Commit local que adicionou essa funcionalidade:

- `334b233 Add fiscal NFe receipt inbox`

Arquivos relevantes desse commit:

- `back-end/migrations/1713474900000_fiscal_nfe_receipts.sql`
- `back-end/modules/fiscal/dtos/fiscal-nfe-receipt.types.ts`
- `back-end/modules/fiscal/repositories/fiscal-nfe-receipts.repository.ts`
- `back-end/modules/fiscal/serializers/fiscal-nfe-receipts.serializer.ts`
- `back-end/modules/fiscal/services/fiscal-nfe-receipts.service.ts`
- `back-end/modules/fiscal/utils/nfe-xml-parser.ts`
- `back-end/modules/fiscal/controllers/fiscal.controller.ts`
- `back-end/modules/fiscal/schemas/fiscal.schema.ts`
- `front-end/app/fiscal/page.tsx`
- `front-end/lib/api/fiscal.ts`
- `front-end/types/fiscal.ts`

Validacoes desse commit:

- `npm run test -- fiscal`
- `npm run build:api`
- `npm run build:web`

O build web passou com warning conhecido de chunk maior que 500 KB.

## Mapeamento do CT-e

O CT-e precisa ser criado com dados do tenant, da NF-e e da operacao.

Blocos importantes:

- Emitente: dados fiscais da NovaLog.
- Remetente: empresa que emitiu a NF-e ou origem da mercadoria.
- Destinatario: recebedor da mercadoria.
- Tomador: quem paga o frete.
- Produto predominante.
- Valor da carga.
- Municipios de inicio e fim.
- UF de inicio e fim.
- NF-e referenciada.
- Modal rodoviario.
- RNTRC.
- CIOT quando aplicavel.
- Informacoes de pagamento/frete.
- CFOP.
- CST/ICMS.

Ponto importante encontrado nos testes:

- CT-e foi rejeitado quando faltava o bloco do modal rodoviario.
- O smoke test foi ajustado para enviar os dados rodoviarios necessarios.

## Mapeamento do MDF-e

O MDF-e e criado depois que existe pelo menos um CT-e autorizado.

Blocos importantes:

- Emitente: NovaLog.
- CT-es autorizados referenciados pelas chaves.
- Veiculo/tracao.
- Placa.
- RENAVAM.
- UF do veiculo.
- Tara/capacidade quando aplicavel.
- Condutor/motorista.
- RNTRC.
- Municipios de carregamento e descarregamento.
- UF de percurso quando aplicavel.
- Peso total.
- Valor total da carga.
- Produto predominante.
- NCM quando aplicavel.
- Contratante.
- CIOT/infPag quando aplicavel.
- Seguro de carga.

Ponto importante encontrado nos testes:

- MDF-e foi rejeitado quando faltou seguro de carga.
- Como o dono da NovaLog confirmou que a transportadora arcara com o seguro, foi criado suporte para apolice/seguradora da transportadora.

## Seguro de carga

Foi identificado que, para o caso da NovaLog, o seguro da carga sera responsabilidade da transportadora.

Sugestao de modelo adotada:

- Criar uma tabela de seguradoras/apolices (`cargo_insurance_policies`).
- Vincular a apolice ao tenant.
- Permitir que o MDF-e use uma apolice padrao ativa.
- Enviar o bloco `seguros_carga` para a Focus NFe ao gerar MDF-e.

O que ja existe:

- Tabela/modulo de apolices de seguro de carga.
- Mapeamento para o payload do MDF-e.
- Smoke test ajustado para incluir seguro.

O que ainda precisa fechar:

- Cadastrar a apolice real da NovaLog em producao.
- Definir se havera uma apolice padrao por tenant ou selecao por viagem.
- Validar se a seguradora exige dados adicionais para todos os cenarios reais.

## Webhooks

A integracao possui endpoint para receber eventos da Focus.

Comportamento esperado:

- Receber evento da Focus.
- Validar autorizacao/segredo do webhook.
- Localizar o documento pela referencia ou chave.
- Atualizar status do documento interno.
- Registrar evento fiscal.
- Registrar log de comunicacao.

Ponto de seguranca:

- Um webhook secret apareceu em saida durante testes e foi redigido/rotacionado.
- Nunca commitar ou documentar o valor real.

## Smoke tests da Focus

Existe script de smoke test para exercitar a integracao de ponta a ponta:

- `scripts/focus-integration-smoke.ts`
- Comando: `npm run smoke:focus`

Fluxo coberto pelo smoke:

1. Criar CT-e.
2. Emitir CT-e.
3. Sincronizar CT-e ate autorizacao/rejeicao.
4. Criar MDF-e usando o CT-e autorizado.
5. Emitir MDF-e.
6. Sincronizar MDF-e.
7. Encerrar MDF-e.
8. Sincronizar novamente.

Tambem existe script para webhooks:

- `scripts/focus-register-webhooks.ts`
- Comando: `npm run focus:webhooks:register`

## Resultado do teste completo na VPS

O fluxo real em homologacao na VPS foi executado com sucesso.

CT-e autorizado:

- ID interno: `a08908da-64ec-494d-a4b0-3301a6a4d0ce`
- Chave: `CTe31260641944655000103570010000000041116512349`
- Ref: `cte-1-576940972`
- Protocolo: `131260004919948`
- Autorizado em: `2026-06-12T23:29:15.000Z`

MDF-e autorizado e encerrado:

- ID interno: `51368626-5512-4467-90d7-13ea7a07128d`
- Chave: `MDFe31260641944655000103580010000000021373300463`
- Ref: `mdfe-1-586957671`
- Protocolo: `931260000015131`
- Autorizado em: `2026-06-12T23:29:38.000Z`
- `mdfeData.encerrado=true`
- Encerrado em: `2026-06-12T23:31:52.825Z`

Observacao:

- A primeira tentativa de encerramento do MDF-e retornou erro temporario Focus/SEFAZ com codigo `-1`.
- A segunda tentativa passou.
- Isso indica que o fluxo precisa tolerar erro temporario e permitir retry operacional.

## Problemas encontrados e resolvidos

Durante a integracao, foram encontrados e resolvidos os seguintes pontos:

1. Token Focus invalido ou desatualizado.
2. Certificado digital ausente na Focus.
3. CT-e desligado no painel Focus.
4. Feature fiscal desabilitada no tenant.
5. CT-e rejeitado por falta de dados do modal rodoviario.
6. MDF-e rejeitado por falta de seguro de carga.
7. MDF-e bloqueado por manifesto antigo aberto para a mesma placa.
8. Necessidade de encerramento de MDF-e antes de novo manifesto para mesma placa/UF/cenario.
9. Webhook secret exposto em saida de teste, depois redigido e rotacionado.

## Status funcional atual

Ja funciona ou ja foi validado:

- Provider Focus NFe.
- Criacao interna de CT-e.
- Emissao de CT-e na Focus.
- Sincronizacao de CT-e.
- Criacao interna de MDF-e.
- Emissao de MDF-e na Focus.
- Sincronizacao de MDF-e.
- Encerramento de MDF-e.
- Carta de correcao.
- Cancelamento.
- Inclusao de condutor.
- Logs de comunicacao.
- Eventos fiscais.
- Webhook Focus.
- Seguro de carga para MDF-e.
- Upload/importacao de XML de NF-e.
- Caixa de NF-es recebidas no front.
- Geracao inicial de CT-e a partir de NF-e recebida.

## O que ainda falta para o processo ficar pronto para operacao diaria

Antes de automatizar o recebimento de XML por e-mail/API, a recomendacao e fechar o fluxo manual assistido:

1. Melhorar o formulario de CT-e gerado a partir da NF-e.
2. Preencher automaticamente remetente, destinatario, valores, chave NF-e e produto predominante.
3. Permitir operador completar dados que nao vem no XML.
4. Validar tomador do frete.
5. Validar CFOP/CST/ICMS para os cenarios reais da NovaLog.
6. Puxar veiculo, motorista e TAC de cadastros reais.
7. Puxar apolice de seguro ativa.
8. Criar fluxo assistido para gerar MDF-e depois do CT-e autorizado.
9. Exibir rejeicoes da SEFAZ de forma clara para operador corrigir.
10. Guardar e disponibilizar XML/PDF/DACTE/DAMDFE.
11. Criar historico operacional por frete/viagem.
12. Amarrar o documento fiscal ao financeiro/pagamento/TAC/CIOT.

## Caminhos futuros para receber XML automaticamente

Opcoes consideradas para a entrada automatizada de NF-e:

### Upload manual

Operador recebe o XML e faz upload no Fretsoft.

Vantagens:

- Simples.
- Barato.
- Bom para MVP.
- Permite validar o processo fiscal completo antes de automatizar entrada.

Limites:

- Ainda depende de acao humana.

### E-mail fiscal

Criar um e-mail como `nfe@fretsoft.cloud` ou `fiscal@novalog...` e processar anexos XML automaticamente.

Vantagens:

- Muito aderente ao dia a dia de transportadora.
- Empresas emissoras ja costumam enviar XML por e-mail.
- Reduz trabalho do operador.

Cuidados:

- Anti-spam.
- Duplicidade por chave NF-e.
- Anexos invalidos.
- Rastreabilidade por remetente.
- Confirmacao de recebimento.

### API publica para clientes

Criar endpoint para empresas clientes enviarem XML diretamente ao Fretsoft.

Vantagens:

- Mais automatizado.
- Bom para clientes recorrentes.

Cuidados:

- Autenticacao por token por cliente.
- Rate limit.
- Logs.
- Validacao de XML.
- Contrato tecnico.

### Busca/recebimento via Focus ou DF-e

Avaliar recursos da Focus para distribuicao/recebimento de documentos fiscais quando a transportadora estiver autorizada no XML da NF-e.

Vantagens:

- Mais fiscalmente integrado.
- Pode reduzir dependencia de e-mail.

Cuidados:

- Precisa confirmar disponibilidade exata no plano/endpoint Focus.
- Pode depender do emissor colocar a transportadora/autorizado no XML.
- Pode exigir regras extras de certificado e manifestacao.

## Processo operacional sugerido para a NovaLog

Fluxo inicial recomendado:

1. Cliente envia XML da NF-e para NovaLog.
2. Operador importa o XML no Fretsoft.
3. Sistema cria item na caixa de NF-es recebidas.
4. Operador confere dados.
5. Operador clica em "Gerar CT-e".
6. Sistema abre CT-e pre-preenchido.
7. Operador completa dados operacionais.
8. Sistema envia CT-e para Focus.
9. Operador acompanha status.
10. Com CT-e autorizado, operador gera MDF-e.
11. Sistema puxa veiculo, motorista, seguro e CT-e.
12. Operador emite MDF-e.
13. Motorista segue viagem com documentos.
14. Ao fim da viagem, operador encerra MDF-e.
15. Sistema guarda historico fiscal e operacional.

## Planejamento recomendado

Ordem sugerida para continuar:

1. Consolidar o fluxo de upload manual de NF-e ate CT-e autorizado.
2. Criar wizard/acao assistida de CT-e a partir de NF-e.
3. Criar wizard/acao assistida de MDF-e a partir de CT-e autorizado.
4. Cadastrar apolice real da NovaLog.
5. Validar regras fiscais reais com contador/responsavel fiscal.
6. Melhorar tela de rejeicoes e pendencias.
7. Automatizar recebimento de XML por e-mail.
8. Depois, avaliar API publica ou recebimento via Focus/DF-e.

## Commits relevantes

Commits importantes no historico da integracao:

- `792aa22 Complete Focus fiscal integration workflow`
- `694ad0c Merge branch 'modulo-fiscal-inicial'`
- `4413f2b Redact Focus webhook authorization in logs`
- `9179e87 Add CT-e road modal data to Focus smoke`
- `334b233 Add fiscal NFe receipt inbox`

## Validacoes ja executadas

Comandos executados ao longo da integracao:

- `npm run test -- fiscal`
- `npm run build:api`
- `npm run build:web`
- `npm run test:front:run`
- `npm run smoke:focus`
- `npm run focus:webhooks:register`

Observacao:

- `npm run lint` tem falhas antigas nao relacionadas ao fluxo Focus/NF-e recebida.

## Cuidados para a proxima pessoa/branch

Ao continuar em outra branch:

1. Nao sobrescrever secrets do `.env`.
2. Nao commitar tokens Focus.
3. Confirmar branch base antes de cherry-pick/merge.
4. Conferir se migrations novas foram aplicadas local e na VPS.
5. Rodar pelo menos `npm run test -- fiscal`, `npm run build:api` e `npm run build:web`.
6. Para testes Focus reais, usar homologacao e referencias unicas.
7. Evitar reutilizar placa com MDF-e aberto.
8. Sempre encerrar MDF-e de teste quando o fluxo autorizar.
9. Conferir logs de comunicacao e eventos fiscais depois dos testes.
10. Validar payload final com a documentacao oficial da Focus antes de levar para producao.

