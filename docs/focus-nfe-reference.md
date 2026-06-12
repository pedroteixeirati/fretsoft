# Focus NFe reference

Use estes links como fonte de verdade para a integracao fiscal com a Focus NFe.

- Indice para agentes: https://doc.focusnfe.com.br/llms.txt
- MDF-e emitir: https://doc.focusnfe.com.br/reference/emitir_mdfe.md
- MDF-e consultar: https://doc.focusnfe.com.br/reference/consultar_mdfe.md
- MDF-e encerrar: https://doc.focusnfe.com.br/reference/encerrar_mdfe.md
- MDF-e cancelar: https://doc.focusnfe.com.br/reference/cancelar_mdfe.md
- MDF-e incluir condutor: https://doc.focusnfe.com.br/reference/incluir_condutor_mdfe.md
- Campos completos MDF-e: https://campos.focusnfe.com.br/mdfe/MDFeXML.html
- Modal rodoviario MDF-e: https://campos.focusnfe.com.br/mdfe/TransporteRodoviarioXML.html
- CT-e emitir: https://doc.focusnfe.com.br/reference/emitir_cte.md
- CT-e consultar: https://doc.focusnfe.com.br/reference/consultar_cte_cte_os.md
- CT-e cancelar: https://doc.focusnfe.com.br/reference/cancelar_cte_cte_os.md
- CT-e carta de correcao: https://doc.focusnfe.com.br/reference/carta_correcao_cte_cte_os.md
- Campos completos CT-e: https://campos.focusnfe.com.br/cte_cteos/ConhecimentoTransporteXML.html
- Modal rodoviario CT-e: https://campos.focusnfe.com.br/cte_cteos/TransporteRodoviarioXML.html
- Webhooks: https://doc.focusnfe.com.br/reference/webhooks.md
- Criar webhook: https://doc.focusnfe.com.br/reference/criar_webhook.md

Observacoes ja validadas no projeto:

- MDF-e e CT-e sao processados de forma assincrona; apos emitir, consultar a ref ate `autorizado` ou `erro_autorizacao`.
- A API de CT-e/MDF-e da Focus nao oferece endpoint `/email`; usar os links de XML/DACTE/DAMDFe retornados na consulta.
- Para seguro de carga do MDF-e, o campo enviado para a Focus deve usar `numero_averbacao`; no retorno processado a Focus mostra `numeros_averbacao`.
- Cancelamento de CT-e/CT-e OS e MDF-e e sincrono, usa `DELETE /cte/{referencia}` ou `DELETE /mdfe/{referencia}` com body `{ "justificativa": "..." }` e justificativa entre 15 e 255 caracteres.
- Carta de correcao de CT-e e sincrona, usa `POST /cte/{referencia}/carta_correcao` com `campo_corrigido`, `valor_corrigido`, e opcionalmente `grupo_corrigido`, `numero_item_grupo_corrigido`, `campo_api`.
- Inclusao de condutor no MDF-e e sincrona, usa `POST /mdfe/{referencia}/inclusao_condutor` com `nome` e `cpf`.
- Webhooks da Focus podem ser cadastrados em `POST /hooks`, com eventos `cte` e `mdfe`; em falha de entrega, a Focus reenvia em 1 minuto, 30 minutos, 1 hora, 3 horas e 24 horas.
- URL de recebimento no Fretsoft: `POST /api/fiscal/webhooks/focus/{event}`, usando `{event}` como `cte` ou `mdfe`.
- Seguranca do webhook: configurar no ambiente `FOCUS_NFE_WEBHOOK_AUTHORIZATION` e, opcionalmente, `FOCUS_NFE_WEBHOOK_AUTHORIZATION_HEADER` (default `authorization`). No painel/endpoint da Focus, enviar o mesmo valor em `authorization`.

Registro de webhooks Focus:

- Script: `npm run focus:webhooks:register`
- Documentacao oficial: `POST /hooks` cria um gatilho com `event`, `url`, `cnpj`, `authorization` e `authorization_header`.
- Variaveis obrigatorias:
  - `FOCUS_NFE_TOKEN`
  - `FOCUS_NFE_ENV` ou `FOCUS_NFE_BASE_URL`
  - `FOCUS_WEBHOOK_CNPJ`
  - `FRETSOFT_PUBLIC_API_BASE_URL`
  - `FOCUS_NFE_WEBHOOK_AUTHORIZATION`
  - `FOCUS_NFE_WEBHOOK_AUTHORIZATION_HEADER` (opcional; default `authorization`)
- O script cria dois hooks:
  - `cte` -> `/api/fiscal/webhooks/focus/cte`
  - `mdfe` -> `/api/fiscal/webhooks/focus/mdfe`

Smoke test ponta a ponta:

- Script: `npm run smoke:focus`
- O script chama a API do Fretsoft, portanto exige um usuario autenticado no tenant alvo via `FRETSOFT_API_TOKEN` (Firebase ID token).
- Variaveis obrigatorias:
  - `FRETSOFT_API_BASE_URL` (ex.: `http://localhost:3001` ou URL da VPS)
  - `FRETSOFT_API_TOKEN`
  - `FOCUS_SMOKE_NFE_KEY` (NF-e valida de homologacao, 44 digitos)
  - `FOCUS_SMOKE_CIOT`
  - `FOCUS_SMOKE_RNTRC`
  - `FOCUS_SMOKE_VEHICLE_RENAVAM`
  - `FOCUS_SMOKE_DRIVER_CPF`
- Sequencia executada:
  1. cria CT-e de terceiro/TAC;
  2. emite CT-e;
  3. consulta CT-e ate autorizar;
  4. cria MDF-e com a chave do CT-e autorizado;
  5. emite MDF-e;
  6. consulta MDF-e ate autorizar;
  7. consulta logs e eventos fiscais.
- Encerramento de MDF-e e opt-in: usar `FOCUS_SMOKE_CLOSE_MDFE=true`. Essa etapa pode falhar por indisponibilidade/retorno externo Focus-SEFAZ, como ja observado em homologacao.

Roadmap da integracao Focus no Fretsoft:

1. Resolver/acompanhar o encerramento do MDF-e em homologacao quando a Focus/SEFAZ deixar de retornar erro externo `codigo: -1`.
2. Implementado: cancelamento de CT-e e MDF-e com justificativa auditavel.
3. Implementado: carta de correcao de CT-e para ajustes permitidos pela SEFAZ.
4. Implementado: inclusao de condutor em MDF-e autorizado.
5. Implementado no Fretsoft: endpoint publico de webhook Focus. Pendente: configurar no painel da Focus os webhooks `cte` e `mdfe` apontando para o endpoint publico.
6. Amarrar o fluxo de produto: frete/faturamento -> CT-e autorizado -> MDF-e autorizado -> encerramento -> consulta de XML/PDF.
7. Homologar cenarios reais com a NovaLog antes de virar token/ambiente de producao.
