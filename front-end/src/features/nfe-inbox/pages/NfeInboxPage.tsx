import React, { useMemo, useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { useFirebase } from '../../../context/FirebaseContext';
import Alert from '../../../shared/ui/Alert';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { useNfeInboxQuery } from '../hooks/useNfeInboxQuery';
import { useNfeInboxMutations } from '../hooks/useNfeInboxMutations';
import NfeReceiptList from '../components/NfeReceiptList';
import { NfeReceipt } from '../types/nfe-inbox.types';

export default function NfeInboxPage() {
  const { userProfile } = useFirebase();
  const canCreatePayable = canAccess(userProfile, 'payables', 'create');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [ignoringReceipt, setIgnoringReceipt] = useState<NfeReceipt | null>(null);

  const { receipts, isLoading, error: loadError } = useNfeInboxQuery({ enabled: Boolean(userProfile) });
  const { importXml, generatePayable, ignoreReceipt } = useNfeInboxMutations();

  const pendingReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.status !== 'ignored'),
    [receipts],
  );

  const handleImportClick = () => {
    setFeedback(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const xml = await file.text();
      await importXml.mutateAsync(xml);
      setFeedback({ tone: 'success', message: 'NF-e importada com sucesso.' });
    } catch (importError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(importError, 'Nao foi possivel importar o XML da NF-e.') });
    }
  };

  const handleGeneratePayable = async (receipt: NfeReceipt) => {
    setFeedback(null);
    try {
      await generatePayable.mutateAsync({ id: receipt.id, payload: {} });
      setFeedback({ tone: 'success', message: 'Conta a pagar gerada a partir da NF-e. Confira em Contas a pagar.' });
    } catch (genError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(genError, 'Nao foi possivel gerar a conta a pagar.') });
    }
  };

  const handleConfirmIgnore = async () => {
    if (!ignoringReceipt) return;
    setFeedback(null);
    try {
      await ignoreReceipt.mutateAsync(ignoringReceipt.id);
      setIgnoringReceipt(null);
      setFeedback({ tone: 'success', message: 'NF-e marcada como ignorada.' });
    } catch (ignoreError) {
      setIgnoringReceipt(null);
      setFeedback({ tone: 'danger', message: getErrorMessage(ignoreError, 'Nao foi possivel ignorar a NF-e.') });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">NF-e de Entrada</h1>
          <p className="mt-2 text-on-secondary-container">
            Importe o XML da NF-e do fornecedor e gere a conta a pagar com fornecedor, numero e valor ja preenchidos.
          </p>
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={handleImportClick}
            disabled={importXml.isPending}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {importXml.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            IMPORTAR XML
          </button>
        </div>
      </div>

      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {loadError ? <Alert tone="danger">{getErrorMessage(loadError, 'Nao foi possivel carregar as NF-es recebidas.')}</Alert> : null}

      {!canCreatePayable ? (
        <Alert tone="info">
          Voce pode visualizar as NF-es recebidas, mas nao tem permissao para gerar contas a pagar.
        </Alert>
      ) : null}

      <NfeReceiptList
        receipts={pendingReceipts}
        loading={isLoading}
        canCreatePayable={canCreatePayable}
        generatingId={generatePayable.isPending ? (generatePayable.variables?.id ?? null) : null}
        emptyIcon={FileText}
        onGeneratePayable={handleGeneratePayable}
        onIgnore={setIgnoringReceipt}
      />

      <ConfirmDialog
        isOpen={Boolean(ignoringReceipt)}
        title="Ignorar NF-e"
        message="A NF-e sera marcada como ignorada e sai da lista. Voce pode reimportar o XML depois se precisar."
        confirmLabel="Ignorar"
        variant="warning"
        isLoading={ignoreReceipt.isPending}
        onConfirm={handleConfirmIgnore}
        onCancel={() => setIgnoringReceipt(null)}
      />
    </div>
  );
}
