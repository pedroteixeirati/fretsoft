import ExcelJS from 'exceljs';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { listRevenuesByTenant } from '../../revenues/repositories/revenues.repository';
import { mapRevenue } from '../../revenues/dtos/revenue.types';
import { listTenantNovalogEntries } from '../repositories/novalog.repository';
import { listTenantNovalogBillings } from '../repositories/novalog-billings.repository';
import { listNovalogReportPayments } from './novalog-billings.service';

type ExportTab = 'balance' | 'receipts' | 'operations';
type ExportType = 'tab' | 'complete';

type ExportFilters = {
  type: ExportType;
  tab: ExportTab;
  referenceMonth: string;
  startDate: string;
  endDate: string;
  companyName: string;
  status: string;
};

type ClientBalanceRow = {
  companyName: string;
  billedAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  overdueAmount: number;
  cteCount: number;
};

const BRAND_GREEN = '0B3F2D';
const PRIMARY_GREEN = '557400';
const LIGHT_GREEN = 'E9F6D4';
const HEADER_FILL = 'F4F6F2';
const BORDER = 'D9DED5';
const MUTED = '667085';
const WARNING = 'F59E0B';
const DANGER = 'DC2626';

function normalizeExportFilters(query: Record<string, unknown>): ExportFilters {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const referenceMonth = typeof query.referenceMonth === 'string' && /^\d{4}-\d{2}$/.test(query.referenceMonth) ? query.referenceMonth : currentMonth;
  const range = getReferenceMonthRange(referenceMonth);
  const tab = ['balance', 'receipts', 'operations'].includes(String(query.tab)) ? String(query.tab) as ExportTab : 'balance';
  const type = String(query.type) === 'complete' ? 'complete' : 'tab';

  return {
    type,
    tab,
    referenceMonth,
    startDate: typeof query.startDate === 'string' && query.startDate ? query.startDate : range.start,
    endDate: typeof query.endDate === 'string' && query.endDate ? query.endDate : range.end,
    companyName: typeof query.companyName === 'string' && query.companyName ? query.companyName : 'all',
    status: typeof query.status === 'string' && query.status ? query.status : 'all',
  };
}

function getReferenceMonthRange(value: string) {
  const [year, month] = value.split('-').map(Number);
  const start = new Date(year, (month || 1) - 1, 1);
  const end = new Date(year, month || 1, 0);
  return {
    start: start.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
    end: end.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
  };
}

function withinRange(value: string | null | undefined, start: string, end: string) {
  if (!value) return false;
  return (!start || value >= start) && (!end || value <= end);
}

function formatReferenceMonthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function formatDatePtBr(value: string) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    all: 'Todos os status',
    pending: 'Pendente',
    billed: 'Cobrada',
    partially_received: 'Parcial',
    received: 'Recebida',
    overdue: 'Em atraso',
    canceled: 'Cancelada',
    draft: 'Rascunho',
    open: 'Em aberto',
  };
  return labels[value] || value || '-';
}

function tabLabel(tab: ExportTab) {
  const labels: Record<ExportTab, string> = {
    balance: 'Saldo a receber por cliente',
    receipts: 'Recebimentos',
    operations: 'Operacao',
  };
  return labels[tab];
}

function buildClientBalanceRows(revenues: ReturnType<typeof mapRevenue>[]) {
  const grouped = new Map<string, ClientBalanceRow>();
  revenues.forEach((revenue) => {
    const key = revenue.companyId || revenue.companyName;
    const current = grouped.get(key) ?? {
      companyName: revenue.companyName || 'Cliente nao informado',
      billedAmount: 0,
      receivedAmount: 0,
      balanceAmount: 0,
      overdueAmount: 0,
      cteCount: 0,
    };
    current.billedAmount += Number(revenue.amount || 0);
    current.receivedAmount += Number(revenue.receivedAmount || 0);
    current.balanceAmount += Number(revenue.balanceAmount || 0);
    if (revenue.status === 'overdue') current.overdueAmount += Number(revenue.balanceAmount || 0);
    current.cteCount += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((left, right) => right.balanceAmount - left.balanceAmount || left.companyName.localeCompare(right.companyName, 'pt-BR'));
}

function currencyCell(cell: ExcelJS.Cell) {
  cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
}

function applySheetDefaults(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 4 }];
  sheet.properties.defaultRowHeight = 22;
  sheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 15 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
  ];
}

async function addTenantLogo(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, logoUrl?: string | null) {
  if (!logoUrl) return false;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpeg' : undefined;
    if (!extension) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    const imageId = workbook.addImage({ buffer, extension });
    sheet.addImage(imageId, {
      tl: { col: 0.2, row: 0.35 },
      ext: { width: 34, height: 34 },
    });
    return true;
  } catch {
    return false;
  }
}

async function addTopHeader(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, auth: AuthContext, title: string, filters: ExportFilters) {
  sheet.mergeCells('A1:I2');
  const header = sheet.getCell('A1');
  header.value = `   ${auth.tenantName || 'NovaLog'}    ${title}`;
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN } };
  header.font = { color: { argb: 'FFFFFF' }, bold: true, size: 20 };
  header.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 34;
  sheet.getRow(2).height = 8;

  const hasLogo = await addTenantLogo(workbook, sheet, auth.tenantLogoUrl);
  if (!hasLogo) {
    sheet.getCell('A1').value = `▲ ${auth.tenantName || 'NovaLog'}    ${title}`;
  }

  sheet.mergeCells('A3:I3');
  const meta = sheet.getCell('A3');
  meta.value = `Competencia: ${formatReferenceMonthLabel(filters.referenceMonth)}  •  Periodo: ${formatDatePtBr(filters.startDate)} — ${formatDatePtBr(filters.endDate)}  •  Cliente: ${filters.companyName === 'all' ? 'Todos os clientes' : filters.companyName}  •  Status: ${formatStatus(filters.status)}  •  Usuario: ${auth.email}`;
  meta.font = { color: { argb: MUTED }, size: 10 };
  meta.alignment = { vertical: 'middle', horizontal: 'left' };
}

function styleSectionTitle(sheet: ExcelJS.Worksheet, row: number, title: string) {
  sheet.mergeCells(row, 1, row, 9);
  const cell = sheet.getCell(row, 1);
  cell.value = title;
  cell.font = { bold: true, size: 14, color: { argb: '002B22' } };
  cell.border = { bottom: { style: 'medium', color: { argb: BRAND_GREEN } } };
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, row: number, columns: number) {
  const headerRow = sheet.getRow(row);
  headerRow.height = 24;
  for (let col = 1; col <= columns; col += 1) {
    const cell = sheet.getCell(row, col);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.font = { bold: true, color: { argb: MUTED }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: BRAND_GREEN } } };
  }
}

function styleBodyRow(sheet: ExcelJS.Worksheet, row: number, columns: number, alternate = false) {
  for (let col = 1; col <= columns; col += 1) {
    const cell = sheet.getCell(row, col);
    cell.fill = alternate ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAF7' } } : undefined;
    cell.border = { bottom: { style: 'thin', color: { argb: BORDER } } };
    cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'center' };
  }
}

function addFooter(sheet: ExcelJS.Worksheet, row: number) {
  sheet.mergeCells(row, 1, row, 9);
  const cell = sheet.getCell(row, 1);
  cell.value = `NovaLog © 2026 — Sistema de Gestao Financeira & Logistica • Fretsoft • Ultima sincronizacao: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
  cell.font = { color: { argb: '98A2B3' }, size: 9 };
  cell.alignment = { horizontal: 'center' };
  cell.border = { top: { style: 'medium', color: { argb: BRAND_GREEN } } };
}

function addKpiBlock(sheet: ExcelJS.Worksheet, startRow: number, kpis: Array<{ label: string; value: string | number; tone?: 'green' | 'orange' | 'red' | 'neutral' }>) {
  const spans = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
  ];
  kpis.slice(0, 4).forEach((kpi, index) => {
    const [fromCol, toCol] = spans[index];
    sheet.mergeCells(startRow, fromCol, startRow, toCol);
    sheet.mergeCells(startRow + 1, fromCol, startRow + 2, toCol);
    const label = sheet.getCell(startRow, fromCol);
    const value = sheet.getCell(startRow + 1, fromCol);
    label.value = `• ${kpi.label.toUpperCase()}`;
    label.font = { bold: true, color: { argb: MUTED }, size: 10 };
    value.value = kpi.value;
    value.font = { bold: true, color: { argb: '00362E' }, size: 20 };
    value.alignment = { vertical: 'middle', horizontal: 'left' };
    const borderColor = kpi.tone === 'red' ? DANGER : kpi.tone === 'orange' ? WARNING : kpi.tone === 'green' ? '16A34A' : BORDER;
    for (let row = startRow; row <= startRow + 2; row += 1) {
      for (let col = fromCol; col <= toCol; col += 1) {
        sheet.getCell(row, col).border = { bottom: { style: 'thin', color: { argb: borderColor } } };
      }
    }
  });
}

async function addSummarySheet(workbook: ExcelJS.Workbook, auth: AuthContext, filters: ExportFilters, data: ReportData) {
  const sheet = workbook.addWorksheet('Resumo');
  applySheetDefaults(sheet);
  await addTopHeader(workbook, sheet, auth, 'Sistema de Gestao Financeira & Logistica', filters);

  const kpis = [
    { label: 'Saldo total a receber', value: data.kpis.balanceAmount, tone: 'green' as const },
    { label: 'Recebido no periodo', value: data.kpis.receivedAmount, tone: 'green' as const },
    { label: 'Clientes com saldo', value: data.kpis.clientsWithBalance, tone: 'neutral' as const },
    { label: 'CT-es em aberto', value: data.kpis.openCtes, tone: 'red' as const },
  ];
  addKpiBlock(sheet, 5, kpis.map((kpi) => ({ ...kpi, value: typeof kpi.value === 'number' && kpi.label.includes('Saldo') || kpi.label.includes('Recebido') ? kpi.value : kpi.value })));
  [sheet.getCell('A6'), sheet.getCell('C6')].forEach(currencyCell);

  styleSectionTitle(sheet, 10, 'Informacoes da Competencia');
  sheet.getCell('A12').value = 'Competencia:';
  sheet.getCell('B12').value = formatReferenceMonthLabel(filters.referenceMonth);
  sheet.getCell('A13').value = 'Cliente:';
  sheet.getCell('B13').value = filters.companyName === 'all' ? 'Todos os clientes' : filters.companyName;
  sheet.getCell('E12').value = 'Periodo:';
  sheet.getCell('F12').value = `${formatDatePtBr(filters.startDate)} a ${formatDatePtBr(filters.endDate)}`;
  sheet.getCell('E13').value = 'Status:';
  sheet.getCell('F13').value = formatStatus(filters.status);
  ['B12', 'B13', 'F12', 'F13'].forEach((address) => {
    sheet.getCell(address).font = { bold: true };
  });

  styleSectionTitle(sheet, 16, 'Distribuicao de CT-es por Status');
  const statusRows = data.statusSummary;
  sheet.getRow(18).values = ['Status', 'Quantidade', 'Valor total (R$)', '% do total', 'Distribuicao'];
  styleHeaderRow(sheet, 18, 5);
  statusRows.forEach((row, index) => {
    const excelRow = 19 + index;
    sheet.getRow(excelRow).values = [formatStatus(row.status), row.count, row.amount, row.percent, ''];
    styleBodyRow(sheet, excelRow, 5, index % 2 === 1);
    currencyCell(sheet.getCell(excelRow, 3));
    sheet.getCell(excelRow, 4).numFmt = '0.00%';
    sheet.getCell(excelRow, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row.color } };
  });
  addFooter(sheet, 23 + statusRows.length);
}

async function addBalanceSheet(workbook: ExcelJS.Workbook, auth: AuthContext, filters: ExportFilters, rows: ClientBalanceRow[]) {
  const sheet = workbook.addWorksheet('Saldo por Cliente');
  applySheetDefaults(sheet);
  await addTopHeader(workbook, sheet, auth, 'Saldo a Receber por Cliente', filters);
  sheet.getRow(5).values = ['Cliente', 'Total faturado', 'Total recebido', 'Saldo em aberto', 'Em atraso', 'CT-es'];
  styleHeaderRow(sheet, 5, 6);
  rows.forEach((row, index) => {
    const excelRow = 6 + index;
    sheet.getRow(excelRow).values = [row.companyName, row.billedAmount, row.receivedAmount, row.balanceAmount, row.overdueAmount, row.cteCount];
    styleBodyRow(sheet, excelRow, 6, index % 2 === 1);
    [2, 3, 4, 5].forEach((col) => currencyCell(sheet.getCell(excelRow, col)));
    sheet.getCell(excelRow, 1).font = { bold: true };
    sheet.getCell(excelRow, 4).font = { bold: true, color: { argb: PRIMARY_GREEN } };
    sheet.getCell(excelRow, 5).font = { bold: true, color: { argb: DANGER } };
  });
  const totalRow = 6 + rows.length;
  sheet.getRow(totalRow).values = [
    `TOTAL — ${rows.length} cliente(s)`,
    rows.reduce((sum, row) => sum + row.billedAmount, 0),
    rows.reduce((sum, row) => sum + row.receivedAmount, 0),
    rows.reduce((sum, row) => sum + row.balanceAmount, 0),
    rows.reduce((sum, row) => sum + row.overdueAmount, 0),
    rows.reduce((sum, row) => sum + row.cteCount, 0),
  ];
  for (let col = 1; col <= 6; col += 1) {
    const cell = sheet.getCell(totalRow, col);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  }
  [2, 3, 4, 5].forEach((col) => currencyCell(sheet.getCell(totalRow, col)));
  addFooter(sheet, totalRow + 3);
}

async function addPaymentsSheet(workbook: ExcelJS.Workbook, auth: AuthContext, filters: ExportFilters, rows: Awaited<ReturnType<typeof listNovalogReportPayments>>) {
  const sheet = workbook.addWorksheet('Recebimentos');
  applySheetDefaults(sheet);
  await addTopHeader(workbook, sheet, auth, 'Recebimentos', filters);
  sheet.getRow(5).values = ['Cliente', 'CT-e', 'Valor recebido', 'Data do recebimento', 'Observacao'];
  styleHeaderRow(sheet, 5, 5);
  rows.forEach((row, index) => {
    const excelRow = 6 + index;
    sheet.getRow(excelRow).values = [row.companyName, row.cteNumber, row.amount, formatDatePtBr(row.paymentDate), row.notes || '-'];
    styleBodyRow(sheet, excelRow, 5, index % 2 === 1);
    currencyCell(sheet.getCell(excelRow, 3));
    sheet.getCell(excelRow, 1).font = { bold: true };
  });
  const totalRow = 6 + rows.length;
  sheet.getRow(totalRow).values = [`TOTAL — ${rows.length} recebimento(s)`, '', rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)];
  for (let col = 1; col <= 5; col += 1) {
    const cell = sheet.getCell(totalRow, col);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  }
  currencyCell(sheet.getCell(totalRow, 3));
  addFooter(sheet, totalRow + 3);
}

async function addBillingsSheet(workbook: ExcelJS.Workbook, auth: AuthContext, filters: ExportFilters, rows: ReportData['filteredBillings']) {
  const sheet = workbook.addWorksheet('Faturamentos');
  applySheetDefaults(sheet);
  await addTopHeader(workbook, sheet, auth, 'Faturamentos', filters);
  sheet.getRow(5).values = ['Faturamento', 'Cliente', 'Data', 'Vencimento', 'Total', 'Recebido', 'Saldo', 'Status', 'CT-es'];
  styleHeaderRow(sheet, 5, 9);
  rows.forEach((row, index) => {
    const excelRow = 6 + index;
    sheet.getRow(excelRow).values = [
      row.display_id ? `#${row.display_id}` : row.id,
      row.company_name,
      formatDatePtBr(row.billing_date),
      formatDatePtBr(row.due_date),
      Number(row.total_amount || 0),
      Number(row.received_amount || 0),
      Number(row.open_amount || 0) + Number(row.overdue_amount || 0),
      formatStatus(row.status),
      Number(row.cte_count || 0),
    ];
    styleBodyRow(sheet, excelRow, 9, index % 2 === 1);
    [5, 6, 7].forEach((col) => currencyCell(sheet.getCell(excelRow, col)));
  });
  addFooter(sheet, 8 + rows.length);
}

async function addOperationsSheet(workbook: ExcelJS.Workbook, auth: AuthContext, filters: ExportFilters, data: ReportData) {
  const sheet = workbook.addWorksheet('Operacao');
  applySheetDefaults(sheet);
  await addTopHeader(workbook, sheet, auth, 'Operacao', filters);
  sheet.getRow(5).values = ['Competencia', 'Lancamentos', 'Peso total', 'Total empresa'];
  styleHeaderRow(sheet, 5, 4);
  sheet.getRow(6).values = [
    formatReferenceMonthLabel(filters.referenceMonth),
    data.operationEntries.length,
    data.kpis.operationWeightTotal,
    data.kpis.operationCompanyTotal,
  ];
  styleBodyRow(sheet, 6, 4);
  sheet.getCell('C6').numFmt = '#,##0.00 "t"';
  currencyCell(sheet.getCell('D6'));

  styleSectionTitle(sheet, 9, 'Lancamentos da Competencia');
  sheet.getRow(11).values = ['ID', 'Data', 'Origem', 'Destino', 'Peso', 'Total empresa', 'Posto'];
  styleHeaderRow(sheet, 11, 7);
  data.operationEntries.forEach((row, index) => {
    const excelRow = 12 + index;
    sheet.getRow(excelRow).values = [
      row.display_id || row.id,
      formatDatePtBr(row.operation_date),
      row.origin_name,
      row.destination_name,
      Number(row.weight || 0),
      Number(row.company_gross_amount || 0),
      row.fuel_station_name || '-',
    ];
    styleBodyRow(sheet, excelRow, 7, index % 2 === 1);
    sheet.getCell(excelRow, 5).numFmt = '#,##0.00';
    currencyCell(sheet.getCell(excelRow, 6));
  });
  addFooter(sheet, 14 + data.operationEntries.length);
}

type ReportData = Awaited<ReturnType<typeof loadReportData>>;

async function loadReportData(auth: AuthContext, filters: ExportFilters) {
  const revenuesResult = await listRevenuesByTenant(auth.tenantId);
  const revenues = revenuesResult.rows.map(mapRevenue);
  const payments = await listNovalogReportPayments(auth);
  const billings = await listTenantNovalogBillings(auth.tenantId);
  const operationEntries = await listTenantNovalogEntries(auth.tenantId, { referenceMonth: filters.referenceMonth });

  const novalogRevenues = revenues.filter((revenue) => revenue.sourceType === 'novalog_billing_item' && revenue.status !== 'canceled');
  const filteredRevenues = novalogRevenues.filter((revenue) => {
    const matchesCompany = filters.companyName === 'all' || revenue.companyName === filters.companyName;
    const matchesStatus = filters.status === 'all' || revenue.status === filters.status;
    return matchesCompany && matchesStatus && withinRange(revenue.dueDate, filters.startDate, filters.endDate);
  });
  const filteredPayments = payments.filter((payment) => {
    const matchesCompany = filters.companyName === 'all' || payment.companyName === filters.companyName;
    return matchesCompany && withinRange(payment.paymentDate, filters.startDate, filters.endDate);
  });
  const filteredBillings = billings.filter((billing) => {
    const matchesCompany = filters.companyName === 'all' || billing.company_name === filters.companyName;
    const matchesStatus = filters.status === 'all' || billing.status === filters.status;
    return matchesCompany && matchesStatus && withinRange(billing.due_date, filters.startDate, filters.endDate);
  });

  const clientBalanceRows = buildClientBalanceRows(filteredRevenues);
  const balanceAmount = filteredRevenues.reduce((sum, revenue) => sum + Number(revenue.balanceAmount || 0), 0);
  const overdueAmount = filteredRevenues.filter((revenue) => revenue.status === 'overdue').reduce((sum, revenue) => sum + Number(revenue.balanceAmount || 0), 0);
  const clientsWithBalance = new Set(filteredRevenues.filter((revenue) => Number(revenue.balanceAmount || 0) > 0).map((revenue) => revenue.companyId || revenue.companyName)).size;
  const openCtes = filteredRevenues.filter((revenue) => Number(revenue.balanceAmount || 0) > 0).length;
  const receivedAmount = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const operationWeightTotal = operationEntries.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
  const operationCompanyTotal = operationEntries.reduce((sum, entry) => sum + Number(entry.company_gross_amount || 0), 0);
  const totalStatusAmount = filteredRevenues.reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0) || 1;
  const statusSummary = ['received', 'partially_received', 'pending', 'billed', 'overdue'].map((status) => {
    const statusRows = filteredRevenues.filter((revenue) => revenue.status === status);
    const amount = statusRows.reduce((sum, revenue) => sum + Number(revenue.balanceAmount || revenue.receivedAmount || revenue.amount || 0), 0);
    return {
      status,
      count: statusRows.length,
      amount,
      percent: amount / totalStatusAmount,
      color: status === 'received' ? '16A34A' : status === 'overdue' ? DANGER : status === 'partially_received' ? WARNING : LIGHT_GREEN,
    };
  }).filter((row) => row.count > 0);

  return {
    clientBalanceRows,
    filteredPayments,
    filteredBillings,
    operationEntries,
    statusSummary,
    kpis: {
      balanceAmount,
      overdueAmount,
      clientsWithBalance,
      openCtes,
      receivedAmount,
      operationWeightTotal,
      operationCompanyTotal,
    },
  };
}

export async function exportNovalogReportWorkbook(auth: AuthContext | undefined, query: Record<string, unknown>) {
  if (!auth?.tenantId) return null;
  const filters = normalizeExportFilters(query);
  const data = await loadReportData(auth, filters);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fretsoft';
  workbook.created = new Date();
  workbook.modified = new Date();

  await addSummarySheet(workbook, auth, filters, data);
  if (filters.type === 'complete' || filters.tab === 'balance') {
    await addBalanceSheet(workbook, auth, filters, data.clientBalanceRows);
  }
  if (filters.type === 'complete' || filters.tab === 'receipts') {
    await addPaymentsSheet(workbook, auth, filters, data.filteredPayments);
  }
  if (filters.type === 'complete') {
    await addBillingsSheet(workbook, auth, filters, data.filteredBillings);
  }
  if (filters.type === 'complete' || filters.tab === 'operations') {
    await addOperationsSheet(workbook, auth, filters, data);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `novalog-${filters.type === 'complete' ? 'relatorio-completo' : tabLabel(filters.tab).toLowerCase().replace(/\s+/g, '-')}-${filters.referenceMonth}.xlsx`;
  return {
    buffer: Buffer.from(buffer),
    fileName,
  };
}
