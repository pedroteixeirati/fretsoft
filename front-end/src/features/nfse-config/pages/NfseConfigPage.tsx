import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getErrorMessage } from '../../../lib/errors';
import { useFirebase } from '../../../context/FirebaseContext';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import Alert from '../../../shared/ui/Alert';
import { FieldLabel } from '../../../shared/forms';
import { useNfseConfig } from '../hooks/useNfseConfig';
import { NfseConfigPayload } from '../types/nfse-config.types';

const emptyForm: NfseConfigPayload = {
  serviceCode: '',
  serviceListItem: '',
  cnaeCode: '',
  issRate: null,
  issRetained: false,
  specialRegime: '',
  municipalIncidenceIbge: '',
  defaultServiceDescription: '',
  enabled: false,
};

export default function NfseConfigPage() {
  const { userProfile } = useFirebase();
  const { config, isLoading, error, saveConfig } = useNfseConfig(Boolean(userProfile));

  const [form, setForm] = useState<NfseConfigPayload>(emptyForm);
  const [issRateText, setIssRateText] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  useEffect(() => {
    if (config) {
      setForm({
        serviceCode: config.serviceCode,
        serviceListItem: config.serviceListItem,
        cnaeCode: config.cnaeCode,
        issRate: config.issRate,
        issRetained: config.issRetained,
        specialRegime: config.specialRegime,
        municipalIncidenceIbge: config.municipalIncidenceIbge,
        defaultServiceDescription: config.defaultServiceDescription,
        enabled: config.enabled,
      });
      setIssRateText(config.issRate !== null && config.issRate !== undefined ? String(config.issRate) : '');
    }
  }, [config]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    const payload: NfseConfigPayload = {
      ...form,
      issRate: issRateText.trim() === '' ? null : Number(issRateText.replace(',', '.')),
    };
    try {
      await saveConfig.mutateAsync(payload);
      setFeedback({ tone: 'success', message: 'Configuracao de NFS-e salva com sucesso.' });
    } catch (saveError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(saveError, 'Nao foi possivel salvar a configuracao de NFS-e.') });
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Configuracao de NFS-e</h1>
        <p className="mt-2 text-on-secondary-container">
          Defina os parametros fiscais da nota de servico (codigo de tributacao, ISS, item da lista). Os dados do prestador vem do cadastro da transportadora.
        </p>
      </div>

      <Alert tone="info">
        O emitente (CNPJ, inscricao municipal, regime, endereco) usa o cadastro da transportadora. O certificado digital fica no painel da Focus. Ative a NFS-e apenas quando esses dados estiverem completos.
      </Alert>

      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {error ? <Alert tone="danger">{getErrorMessage(error, 'Nao foi possivel carregar a configuracao.')}</Alert> : null}

      {isLoading ? (
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Carregando configuracao...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-surface-container-lowest p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Codigo de tributacao nacional"
              hint="Ex: 16.02.01 (transporte de natureza municipal)"
              value={form.serviceCode}
              onChange={(event) => setForm((current) => ({ ...current, serviceCode: event.target.value }))}
            />
            <Input
              label="Item da lista de servico (LC 116)"
              hint="Ex: 16.02"
              value={form.serviceListItem}
              onChange={(event) => setForm((current) => ({ ...current, serviceListItem: event.target.value }))}
            />
            <Input
              label="Aliquota do ISS (%)"
              type="number"
              hint="Ex: 5"
              value={issRateText}
              onChange={(event) => setIssRateText(event.target.value)}
            />
            <div className="space-y-2">
              <FieldLabel>ISS retido pelo tomador?</FieldLabel>
              <CustomSelect
                value={form.issRetained ? 'yes' : 'no'}
                onChange={(value) => setForm((current) => ({ ...current, issRetained: value === 'yes' }))}
                options={[
                  { value: 'no', label: 'Nao' },
                  { value: 'yes', label: 'Sim' },
                ]}
              />
            </div>
            <Input
              label="CNAE do servico"
              value={form.cnaeCode}
              onChange={(event) => setForm((current) => ({ ...current, cnaeCode: event.target.value }))}
              placeholder="Opcional"
            />
            <Input
              label="Municipio de incidencia do ISSQN (IBGE)"
              hint="7 digitos. Em branco usa o municipio do prestador."
              value={form.municipalIncidenceIbge}
              onChange={(event) => setForm((current) => ({ ...current, municipalIncidenceIbge: event.target.value }))}
              placeholder="Opcional"
            />
            <Input
              label="Regime especial de tributacao"
              value={form.specialRegime}
              onChange={(event) => setForm((current) => ({ ...current, specialRegime: event.target.value }))}
              placeholder="Opcional (padrao: nenhum)"
            />
            <div className="space-y-2">
              <FieldLabel>NFS-e ativa para este tenant?</FieldLabel>
              <CustomSelect
                value={form.enabled ? 'yes' : 'no'}
                onChange={(value) => setForm((current) => ({ ...current, enabled: value === 'yes' }))}
                options={[
                  { value: 'no', label: 'Nao (apenas configurando)' },
                  { value: 'yes', label: 'Sim (pronta para emitir)' },
                ]}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Descricao padrao do servico"
                hint="Ex: Prestacao de servico de transporte de colaboradores."
                value={form.defaultServiceDescription}
                onChange={(event) => setForm((current) => ({ ...current, defaultServiceDescription: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveConfig.isPending}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {saveConfig.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Salvar configuracao
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
