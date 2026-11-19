import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Minus,
  Plus,
  Save,
} from 'lucide-react';
import {
  Badge,
  Button,
  CalloutAlert,
  Card,
  Input,
  Modal,
  Select,
} from '../../../components/ui';
import { useMockDatabase } from '../../../contexts/MockDatabaseContext';
import { useSession } from '../../../contexts/SessionContext';
import { useToast } from '../../../contexts/ToastContext';
import { exportToCsv } from '../../../lib/exportCsv';
import { getDisplayName } from '../../../lib/person';
import { InternalDonation, PantryItem } from '../../../types';
import {
  cn,
  formatCurrencyBRL,
  formatDateBR,
} from '../../../utils/formatters';

export const CoordinatorOperationsSection: React.FC = () => {
  const { currentPerson } = useSession();
  const {
    db,
    updatePantryItem,
    addPantryItem,
    addInternalDonation,
  } = useMockDatabase();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new-donation') {
      setIsDonationModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [donationType, setDonationType] = useState<'financeira' | 'material'>('material');
  const [isAnonymousDonor, setIsAnonymousDonor] = useState(false);
  const [selectedSupporterPersonId, setSelectedSupporterPersonId] = useState('');
  const [customSupporterName, setCustomSupporterName] = useState('');
  const [donationCategory, setDonationCategory] =
    useState<InternalDonation['category']>('alimentacao');
  const [amountBrlText, setAmountBrlText] = useState('');
  const [itemNameText, setItemNameText] = useState('');
  const [itemQuantityText, setItemQuantityText] = useState('10');
  const [itemUnitText, setItemUnitText] = useState('pacotes');
  const [donationDescription, setDonationDescription] = useState('');
  const [donationDate, setDonationDate] = useState('2026-11-19');
  const [donationError, setDonationError] = useState('');

  const [isPantryModalOpen, setIsPantryModalOpen] = useState(false);
  const [newPantryName, setNewPantryName] = useState('');
  const [newPantryCategory, setNewPantryCategory] =
    useState<PantryItem['category']>('lanche');
  const [newPantryQty, setNewPantryQty] = useState('10');
  const [newPantryMin, setNewPantryMin] = useState('5');
  const [newPantryUnit, setNewPantryUnit] = useState('pacotes');

  const handleAdjustPantryQuantity = (item: PantryItem, delta: number) => {
    const nextQty = Math.max(0, item.currentQuantity + delta);
    updatePantryItem({
      ...item,
      currentQuantity: nextQty,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCreatePantryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPantryName.trim().length < 3) return;
    const item: PantryItem = {
      id: `pan-${Date.now()}`,
      name: newPantryName.trim(),
      category: newPantryCategory,
      currentQuantity: Math.max(0, Number(newPantryQty) || 0),
      minimumThreshold: Math.max(1, Number(newPantryMin) || 5),
      unit: newPantryUnit.trim() || 'unidades',
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    addPantryItem(item);
    setIsPantryModalOpen(false);
    setNewPantryName('');
    showToast({
      variant: 'success',
      title: 'Item adicionado à copa',
    });
  };

  const handleRegisterDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setDonationError('');

    const linkedPerson = selectedSupporterPersonId
      ? db.persons.find((p) => p.id === selectedSupporterPersonId)
      : undefined;

    const supporterName = isAnonymousDonor
      ? 'Doador(a) Anônimo(a)'
      : linkedPerson
      ? getDisplayName(linkedPerson)
      : customSupporterName.trim();

    if (!supporterName) {
      setDonationError('Informe o nome do apoiador ou marque como anônimo.');
      return;
    }

    let quantityOrValue = '';
    if (donationType === 'financeira') {
      const parsedAmount = Number(amountBrlText.replace(',', '.'));
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setDonationError('Informe um valor válido em Reais (R$).');
        return;
      }
      quantityOrValue = formatCurrencyBRL(parsedAmount);
    } else {
      if (itemNameText.trim().length < 2) {
        setDonationError('Informe o item doado.');
        return;
      }
      const qty = Math.max(1, Number(itemQuantityText) || 1);
      quantityOrValue = `${qty} ${itemUnitText.trim() || 'un.'} de ${itemNameText.trim()}`;
    }

    const newDonation: InternalDonation = {
      id: `don-${Date.now()}`,
      supporterName,
      supporterPersonId: isAnonymousDonor ? undefined : selectedSupporterPersonId || undefined,
      isAnonymous: isAnonymousDonor,
      donationType,
      amountBrl:
        donationType === 'financeira'
          ? Number(amountBrlText.replace(',', '.'))
          : undefined,
      itemName: donationType === 'material' ? itemNameText.trim() : undefined,
      itemQuantity:
        donationType === 'material' ? Number(itemQuantityText) || 1 : undefined,
      itemUnit: donationType === 'material' ? itemUnitText.trim() : undefined,
      category:
        donationType === 'financeira' ? 'financeiro' : donationCategory,
      description:
        donationDescription.trim() ||
        (donationType === 'financeira'
          ? 'Contribuição financeira.'
          : `Doação material (${itemNameText.trim()}).`),
      quantityOrValue,
      receivedDate: donationDate,
      registeredByPersonId: currentPerson?.id ?? 'per-coord-01',
    };

    addInternalDonation(newDonation);
    setIsDonationModalOpen(false);
    setCustomSupporterName('');
    setSelectedSupporterPersonId('');
    setAmountBrlText('');
    setItemNameText('');
    setDonationDescription('');

    showToast({
      variant: 'success',
      title: 'Doação registrada',
    });
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* Estoque da Copa (Linhas Horizontais Limpas — sem sub-cards aninhados) */}
      <div className="lg:col-span-6">
        <Card
          as="section"
          title="Estoque da Copa"
          headerAction={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsPantryModalOpen(true)}
            >
              Novo Item
            </Button>
          }
          noPadding
        >
          <ul className="divide-y divide-line">
            {db.pantryItems.map((item) => {
              const isLowStock = item.currentQuantity < item.minimumThreshold;
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {item.name}
                      </span>
                      {isLowStock && <Badge variant="assess">Repor</Badge>}
                    </div>
                    <p className="text-xs text-ink-muted">
                      Mínimo: <span className="font-mono tabular-nums">{item.minimumThreshold}</span> {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustPantryQuantity(item, -1)}
                      aria-label={`Diminuir ${item.name}`}
                      title={`Diminuir ${item.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-subtle"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>

                    <span className="w-24 text-center text-sm">
                      <strong className="font-mono font-semibold text-ink tabular-nums">
                        {item.currentQuantity}
                      </strong>{' '}
                      <span className="text-xs text-ink-muted">{item.unit}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAdjustPantryQuantity(item, 1)}
                      aria-label={`Aumentar ${item.name}`}
                      title={`Aumentar ${item.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-subtle"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Registro Interno de Doações (1 único CTA primário na tela + Exportar CSV) */}
      <div className="lg:col-span-6">
        <Card
          as="section"
          title="Registro Interno de Doações"
          headerAction={
            <div className="no-print flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => {
                  exportToCsv({
                    filename: 'bonsucesso-doacoes',
                    headers: [
                      'Data',
                      'Apoiador(a)',
                      'Categoria',
                      'Valor / Quantidade',
                      'Descrição',
                    ],
                    rows: db.internalDonations.map((don) => [
                      formatDateBR(don.receivedDate),
                      don.supporterName,
                      don.category,
                      don.quantityOrValue,
                      don.description,
                    ]),
                  });
                  showToast({
                    variant: 'success',
                    title: 'Doações exportadas em CSV',
                  });
                }}
              >
                Exportar CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsDonationModalOpen(true)}
              >
                Registrar Doação
              </Button>
            </div>
          }
          noPadding
        >
          <ul className="divide-y divide-line">
            {db.internalDonations.map((don) => (
              <li key={don.id} className="px-5 py-3.5 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {don.supporterName}
                  </span>
                  <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                    {don.quantityOrValue}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                  <span className="truncate">{don.description}</span>
                  <span className="font-mono tabular-nums">{formatDateBR(don.receivedDate)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Modal: Registrar Doação */}
      <Modal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        size="lg"
        title="Registrar Doação"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDonationModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRegisterDonation}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Salvar
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterDonation} className="space-y-4" noValidate>
          {donationError && (
            <CalloutAlert variant="error" title="Verifique os dados">
              {donationError}
            </CalloutAlert>
          )}

          {/* Segmented Control Suave (sem blocos pretos) */}
          <div className="grid grid-cols-2 gap-1 rounded-md bg-track p-1">
            <button
              type="button"
              onClick={() => setDonationType('material')}
              aria-pressed={donationType === 'material'}
              className={cn(
                'h-9 rounded text-xs font-medium transition-colors',
                donationType === 'material'
                  ? 'bg-surface font-semibold text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Doação Material
            </button>
            <button
              type="button"
              onClick={() => setDonationType('financeira')}
              aria-pressed={donationType === 'financeira'}
              className={cn(
                'h-9 rounded text-xs font-medium transition-colors',
                donationType === 'financeira'
                  ? 'bg-surface font-semibold text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Doação Financeira (R$)
            </button>
          </div>

          <div className="space-y-3 rounded-md bg-subtle p-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymousDonor}
                onChange={(e) => setIsAnonymousDonor(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium text-ink">
                Doador(a) Anônimo(a)
              </span>
            </label>

            {!isAnonymousDonor && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Pessoa Cadastrada (Opcional)"
                  value={selectedSupporterPersonId}
                  onChange={(e) => setSelectedSupporterPersonId(e.target.value)}
                  options={[
                    { value: '', label: 'Apoiador externo / comércio' },
                    ...db.persons.map((p) => ({
                      value: p.id,
                      label: getDisplayName(p),
                    })),
                  ]}
                />

                {!selectedSupporterPersonId && (
                  <Input
                    label="Nome do Apoiador"
                    required
                    value={customSupporterName}
                    onChange={(e) => setCustomSupporterName(e.target.value)}
                    placeholder="Ex: Padaria Estrela"
                  />
                )}
              </div>
            )}
          </div>

          {donationType === 'financeira' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Valor (R$)"
                required
                type="number"
                min={1}
                step="0.01"
                value={amountBrlText}
                onChange={(e) => setAmountBrlText(e.target.value)}
                placeholder="250.00"
              />
              <Input
                label="Data"
                type="date"
                required
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Categoria"
                  value={donationCategory}
                  onChange={(e) =>
                    setDonationCategory(e.target.value as InternalDonation['category'])
                  }
                  options={[
                    { value: 'alimentacao', label: 'Alimentação / Copa' },
                    { value: 'material_didatico', label: 'Material Didático' },
                    { value: 'equipamentos', label: 'Equipamentos' },
                  ]}
                />
                <Input
                  label="Data"
                  type="date"
                  required
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Item"
                  required
                  value={itemNameText}
                  onChange={(e) => setItemNameText(e.target.value)}
                  placeholder="Café 500g"
                />
                <Input
                  label="Quantidade"
                  type="number"
                  min={1}
                  required
                  value={itemQuantityText}
                  onChange={(e) => setItemQuantityText(e.target.value)}
                />
                <Input
                  label="Unidade"
                  required
                  value={itemUnitText}
                  onChange={(e) => setItemUnitText(e.target.value)}
                  placeholder="pacotes"
                />
              </div>
            </div>
          )}

          <Input
            label="Observação"
            optionalText="Opcional"
            value={donationDescription}
            onChange={(e) => setDonationDescription(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal: Novo Item na Copa */}
      <Modal
        isOpen={isPantryModalOpen}
        onClose={() => setIsPantryModalOpen(false)}
        title="Novo Item da Copa"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPantryModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePantryItem}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Salvar
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePantryItem} className="space-y-4">
          <Input
            label="Item"
            required
            value={newPantryName}
            onChange={(e) => setNewPantryName(e.target.value)}
            placeholder="Ex: Achocolatado 400g"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Quantidade"
              type="number"
              min={0}
              required
              value={newPantryQty}
              onChange={(e) => setNewPantryQty(e.target.value)}
            />
            <Input
              label="Estoque Mínimo"
              type="number"
              min={1}
              required
              value={newPantryMin}
              onChange={(e) => setNewPantryMin(e.target.value)}
            />
            <Input
              label="Unidade"
              required
              value={newPantryUnit}
              onChange={(e) => setNewPantryUnit(e.target.value)}
            />
          </div>

          <Select
            label="Categoria"
            value={newPantryCategory}
            onChange={(e) =>
              setNewPantryCategory(e.target.value as PantryItem['category'])
            }
            options={[
              { value: 'lanche', label: 'Lanche / Alimento' },
              { value: 'bebida', label: 'Bebida' },
              { value: 'descartavel', label: 'Descartáveis' },
              { value: 'limpeza', label: 'Limpeza' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};
