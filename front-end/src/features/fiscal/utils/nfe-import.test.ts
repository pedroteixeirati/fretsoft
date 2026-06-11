import { parseNfeXml } from './nfe-import';

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35250412544992000105550010000001231000000017">
      <emit>
        <CNPJ>12544992000105</CNPJ>
        <xNome>Mineradora Serra Azul Ltda</xNome>
        <IE>1234567</IE>
        <enderEmit><xLgr>Rua A</xLgr><nro>100</nro><xBairro>Centro</xBairro><cMun>3131703</cMun><xMun>Itabira</xMun><UF>MG</UF><CEP>35900000</CEP></enderEmit>
      </emit>
      <dest>
        <CNPJ>33041260065290</CNPJ>
        <xNome>Siderurgica Vale do Aco S/A</xNome>
        <enderDest><cMun>3131307</cMun><xMun>Ipatinga</xMun><UF>MG</UF></enderDest>
      </dest>
      <det><prod><xProd>Minerio de ferro</xProd></prod></det>
      <total><ICMSTot><vNF>48200.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
</nfeProc>`;

describe('parseNfeXml', () => {
  it('extrai chave, remetente, destinatario e valores com IBGE', () => {
    const result = parseNfeXml(SAMPLE);
    expect(result).not.toBeNull();
    expect(result!.nfeKey).toHaveLength(44);
    expect(result!.sender?.name).toBe('Mineradora Serra Azul Ltda');
    expect(result!.sender?.documentNumber).toBe('12544992000105');
    expect(result!.sender?.cityIbgeCode).toBe('3131703');
    expect(result!.recipient?.name).toBe('Siderurgica Vale do Aco S/A');
    expect(result!.recipient?.cityIbgeCode).toBe('3131307');
    expect(result!.valorCarga).toBe(48200);
    expect(result!.produtoPredominante).toBe('Minerio de ferro');
  });

  it('retorna null para conteudo que nao e NF-e', () => {
    expect(parseNfeXml('isto nao e xml de nfe')).toBeNull();
    expect(parseNfeXml('<outro><coisa>1</coisa></outro>')).toBeNull();
  });
});
