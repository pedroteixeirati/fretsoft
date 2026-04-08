# Guia de Padrao de KPI

## Objetivo
Este documento define o padrao oficial dos cards de KPI do sistema.

O objetivo e garantir consistencia visual, semantica e tecnica em todas as telas que exibem indicadores-resumo.

## Componente oficial
Todo KPI novo deve usar:

- [KpiCard.tsx](C:/Users/pedro/Documents/Projetos/Nova-Log-main/front-end/src/components/KpiCard.tsx)

Nao crie novos `StatCard`, `Metric`, `MetricBox` ou variacoes locais para novas telas.

## Estrutura obrigatoria
Todo KPI deve seguir esta estrutura:

1. titulo no topo esquerdo
2. icone no topo direito
3. valor abaixo
4. helper text opcional abaixo do valor

## Biblioteca oficial de icones
Use sempre:

- `lucide-react`

Nao use bibliotecas diferentes para KPIs sem necessidade real.

## Mapeamento semantico de icones
O sistema ja resolve automaticamente varios casos com base no label do KPI.

### Financeiro
- saldo
- receita
- faturamento
- custo
- conta
- valor
- pagamento
- recebimento
- carteira
- financeiro

Icone padrao:
- `Wallet`

### Combustivel
- combustivel

Icone padrao:
- `Fuel`

### Manutencao
- manutencao

Icone padrao:
- `Wrench`

### Fornecedores e parceiros
- fornecedor
- parceiro
- oficina

Icone padrao:
- `BriefcaseBusiness`

### Empresas e tenants
- empresa
- transportadora
- tenant

Icone padrao:
- `Building2`

### Owners e pessoas
- owner

Icone padrao:
- `UserRound`

### Contratos e planos
- contrato
- plano

Icone padrao:
- `FileText`

### Frota e veiculos
- veiculo
- frota
- caminhao

Icone padrao:
- `Truck`

### Viagens e rotas
- viagem
- rota
- frete

Icone padrao:
- `Route`

### Localizacao
- uf
- estado
- localizacao

Icone padrao:
- `MapPinned`

### Contato
- email
- e-mail
- contato

Icone padrao:
- `Mail`

### Saude positiva
- ativo
- ativa
- ativos
- aprovado

Icone padrao:
- `CheckCircle2`

### Alerta e atencao
- pendente
- pendencias
- atraso
- vencido
- alerta
- erro
- risco

Icone padrao:
- `AlertTriangle`

## Tons visuais
Os tons padrao tambem sao inferidos pela semantica do label.

### `primary`
Usar para:
- contratos
- empresas
- tenants
- planos

### `secondary`
Usar para:
- combustivel

### `tertiary`
Usar para:
- manutencao
- alguns estados financeiros secundarios

### `success`
Usar para:
- ativos
- aprovados
- recebidos
- situacoes positivas

### `danger`
Usar para:
- pendencias
- atrasos
- vencidos
- alertas
- erros

### `neutral`
Usar para:
- indicadores administrativos sem destaque semantico forte

## Regra de override manual
O sistema tenta resolver icone e tom automaticamente pelo label, mas e permitido sobrescrever manualmente quando:

1. o KPI tiver um significado mais especifico do que o label sugere
2. o produto exigir um simbolo mais forte para aquela tela
3. o label for ambiguo

Exemplo:

```tsx
<KpiCard
  label="Recebidas"
  value={currency(totalReceived)}
  icon={RefreshCw}
  tone="success"
/>
```

## Regras de valor
O componente trata automaticamente:

- contadores simples
- valores monetarios
- datas/textos curtos

### Valores monetarios
- o `R$` fica separado do numero
- o numero tem mais protagonismo visual
- o card ganha um pouco mais de altura

### Contadores
- tipografia maior
- leitura mais rapida

### Datas ou textos curtos
- tipografia mais contida

## Regras de UX
Todo KPI deve:

- ser escaneavel em menos de 2 segundos
- ter titulo curto e claro
- evitar frases longas
- evitar siglas obscuras
- evitar valores quebrando linha
- manter consistencia de altura na grade

## Quando NAO usar KPI
Nao use KPI para:

- instrucoes
- alertas longos
- explicacoes de regra
- blocos com muito texto
- dados que dependem de leitura detalhada

Nesses casos, prefira:
- cards informativos
- paines analiticos
- tabelas
- banners de status

## Exemplo de uso

```tsx
import KpiCard from '../components/KpiCard';

<KpiCard label="Empresas ativas" value="24" />
<KpiCard label="Receita faturada" value="R$ 120.000,00" />
<KpiCard label="Pendentes" value="3 lancamentos" tone="danger" />
```

## Regra final
Se uma nova tela tiver KPI:

1. usar `KpiCard`
2. manter titulo + icone no topo
3. manter valor abaixo
4. usar `lucide-react`
5. seguir o mapeamento semantico antes de escolher override manual
