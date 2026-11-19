import React, { useState } from 'react';
import {
  CheckCircle2,
  HeartHandshake,
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
import { InternalDonation, PantryItem } from '../../../types';
import {
  formatCurrencyBRL,
  formatDateBR,
  getDisplayName,
} from '../../../utils/formatters';

/**
 * Subcomponente coeso (SRP): Controle Interno de Operações, Copa/Merenda e Doações Recebidas.
 * Exclusivo da Coordenação (não existe perfil externo de Doador).
 */
export const CoordinatorOperationsSection: React.FC = () => {
  const { currentPerson } = useSession();
  const {
    db,
    updatePantryItem,
    addPantryItem,
    addInternalDonation,
  } = useMockDatabase();
  const { showToast } = useToast();

  // Estado do Modal de Registro de Doação Interna
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
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

  // Estado do Modal de Novo Suprimento da Copa
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
    showToast({
      variant: 'info',
      title: `Estoque atualizado: ${item.name}`,
      description: `Quantidade atual: ${nextQty} ${item.unit}.`,
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
      title: 'Item adicionado ao controle da copa!',
      description: `${item.name} registrado com ${item.currentQuantity} ${item.unit}.`,
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
      ? linkedPerson.fullName
      : customSupporterName.trim();

    if (!supporterName) {
      setDonationError(
        'Informe o nome do apoiador, escolha uma pessoa cadastrada ou marque como Doador Anônimo.'
      );
      return;
    }

    let quantityOrValue = '';
    if (donationType === 'financeira') {
      const parsedAmount = Number(amountBrlText.replace(',', '.'));
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setDonationError('Informe um valor financeiro válido em Reais (R$).');
        return;
      }
      quantityOrValue = formatCurrencyBRL(parsedAmount);
    } else {
      if (itemNameText.trim().length < 2) {
        setDonationError('Informe o nome do item material doado (ex: Pacotes de biscoito, Resmas A4).');
        return;
      }
      const qty = Math.max(1, Number(itemQuantityText) || 1);
      quantityOrValue = `${qty} ${itemUnitText.trim() || 'unidades'} de ${itemNameText.trim()}`;
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
          ? 'Contribuição financeira espontânea para manutenção comunitária.'
          : `Doação material (${itemNameText.trim()}) para os estudantes do cursinho.`),
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
      title: 'Doação registrada no controle interno!',
      description: `${quantityOrValue} (${supporterName}) adicionado ao livro da coordenação.`,
    });
  };

  return (
    <div className="space-y-8">
      <CalloutAlert
        variant="info"
        title="Controle Interno de Operações, Copa e Doações Comunitárias"
      >
        Este módulo é de uso exclusivo da <strong>Coordenação do Cursinho Bonsucesso</strong> para
        organizar os lanches gratuitos servidos aos estudantes e registrar apoios financeiros ou
        materiais recebidos da comunidade (não existe login externo para doadores).
      </CalloutAlert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Controle de Suprimentos da Copa / Merenda (6 cols) */}
        <div className="lg:col-span-6">
          <Card
            as="section"
            title="Estoque da Copa e Merenda Comunitária"
            subtitle="Ajuste rapidamente as quantidades com os botões -1 e +1 ou cadastre um novo item."
            headerAction={
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsPantryModalOpen(true)}
              >
                Novo Item
              </Button>
            }
          >
            <div className="space-y-3">
              {db.pantryItems.map((item) => {
                const isLowStock = item.currentQuantity < item.minimumThreshold;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      isLowStock
                        ? 'border-warning-500/70 bg-warning-50/50 dark:border-amber-700 dark:bg-warning-950/20'
                        : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Estoque mínimo recomendado: {item.minimumThreshold} {item.unit} •
                          Atualizado em {formatDateBR(item.lastUpdated)}
                        </p>
                      </div>

                      <Badge variant={isLowStock ? 'warning' : 'success'}>
                        {isLowStock ? 'Repor estoque' : 'Estoque em dia'}
                      </Badge>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {item.currentQuantity} {item.unit}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdjustPantryQuantity(item, -1)}
                          aria-label={`Diminuir 1 ${item.unit} de ${item.name}`}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                          <span>-1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPantryQuantity(item, 1)}
                          aria-label={`Adicionar 1 ${item.unit} de ${item.name}`}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-primary-700 bg-primary-700 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-primary-800 dark:border-primary-500 dark:bg-primary-600"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          <span>+1</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Registro Interno de Doações Recebidas (6 cols) */}
        <div className="lg:col-span-6">
          <Card
            as="section"
            title="Livro Interno de Doações Recebidas"
            subtitle="Registre doações financeiras (R$) ou materiais vinculadas opcionalmente a uma pessoa ou anônimas."
            headerAction={
              <Button
                variant="secondary"
                leftIcon={<HeartHandshake className="h-4 w-4" />}
                onClick={() => setIsDonationModalOpen(true)}
              >
                Registrar Doação
              </Button>
            }
          >
            <div className="space-y-3">
              {db.internalDonations.map((don) => (
                <article
                  key={don.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant={don.category === 'financeiro' ? 'secondary' : 'primary'}
                    >
                      {don.category === 'financeiro'
                        ? 'Doação Financeira (R$)'
                        : don.category === 'alimentacao'
                        ? 'Alimentação / Merenda'
                        : 'Material Didático / Apoio'}
                    </Badge>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Recebido em {formatDateBR(don.receivedDate)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {don.supporterName}
                    </h4>
                    <span className="text-base font-extrabold text-primary-800 dark:text-primary-300">
                      {don.quantityOrValue}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {don.description}
                  </p>
                </article>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL PARA REGISTRAR DOAÇÃO INTERNA */}
      <Modal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        size="lg"
        title="Registrar Doação Recebida (Controle Interno)"
        description="Registre apoios financeiros ou materiais para transparência interna da coordenação."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDonationModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRegisterDonation}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Salvar Registro de Doação
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterDonation} className="space-y-4" noValidate>
          {donationError && (
            <CalloutAlert variant="error" title="Verifique os dados da doação">
              {donationError}
            </CalloutAlert>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDonationType('material')}
              aria-pressed={donationType === 'material'}
              className={`min-h-[48px] rounded-xl border-2 px-4 py-2.5 text-sm font-extrabold transition-all ${
                donationType === 'material'
                  ? 'border-primary-700 bg-primary-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              }`}
            >
              Doação Material (Alimentos, Papelaria, Equipamentos)
            </button>

            <button
              type="button"
              onClick={() => setDonationType('financeira')}
              aria-pressed={donationType === 'financeira'}
              className={`min-h-[48px] rounded-xl border-2 px-4 py-2.5 text-sm font-extrabold transition-all ${
                donationType === 'financeira'
                  ? 'border-secondary-700 bg-secondary-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              }`}
            >
              Doação Financeira (Valor em R$)
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymousDonor}
                onChange={(e) => setIsAnonymousDonor(e.target.checked)}
                className="h-5 w-5 rounded accent-primary-700"
              />
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                Registrar como Doador(a) Anônimo(a)
              </span>
            </label>

            {!isAnonymousDonor && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                <Select
                  label="Vincular a uma Pessoa Cadastrada (Opcional)"
                  value={selectedSupporterPersonId}
                  onChange={(e) => setSelectedSupporterPersonId(e.target.value)}
                  options={[
                    { value: '', label: 'Não vincular (Digitar comércio ou apoiador externo)' },
                    ...db.persons.map((p) => ({
                      value: p.id,
                      label: `${getDisplayName(p)} (CPF: ${p.cpf})`,
                    })),
                  ]}
                />

                {!selectedSupporterPersonId && (
                  <Input
                    label="Nome do Apoiador ou Comércio Local"
                    required
                    value={customSupporterName}
                    onChange={(e) => setCustomSupporterName(e.target.value)}
                    placeholder="Ex: Padaria Estrela de Bonsucesso"
                  />
                )}
              </div>
            )}
          </div>

          {donationType === 'financeira' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Valor Doado em Reais (R$)"
                required
                type="number"
                min={1}
                step="0.01"
                value={amountBrlText}
                onChange={(e) => setAmountBrlText(e.target.value)}
                placeholder="Ex: 250.00"
              />

              <Input
                label="Data do Recebimento"
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
                  label="Categoria do Material"
                  value={donationCategory}
                  onChange={(e) =>
                    setDonationCategory(e.target.value as InternalDonation['category'])
                  }
                  options={[
                    { value: 'alimentacao', label: 'Alimentação / Merenda da Copa' },
                    { value: 'material_didatico', label: 'Material Didático / Papelaria' },
                    { value: 'equipamentos', label: 'Equipamentos / Mobiliário' },
                  ]}
                />

                <Input
                  label="Data do Recebimento"
                  type="date"
                  required
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Item Doado"
                  required
                  value={itemNameText}
                  onChange={(e) => setItemNameText(e.target.value)}
                  placeholder="Ex: Café em pó 500g"
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
                  placeholder="Ex: pacotes, resmas, caixas"
                />
              </div>
            </div>
          )}

          <Input
            label="Observação / Destinação da Doação"
            optionalText="Opcional"
            value={donationDescription}
            onChange={(e) => setDonationDescription(e.target.value)}
            placeholder="Ex: Destinado ao lanche do 4º Simulado Comunitário de sábado."
          />
        </form>
      </Modal>

      {/* MODAL PARA ADICIONAR NOVO ITEM NA COPA */}
      <Modal
        isOpen={isPantryModalOpen}
        onClose={() => setIsPantryModalOpen(false)}
        title="Cadastrar Novo Suprimento da Copa"
        description="Adicione um item de lanche, bebida ou apoio para acompanhamento de estoque mínimo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsPantryModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePantryItem}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Adicionar à Copa
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePantryItem} className="space-y-4">
          <Input
            label="Nome do Item"
            required
            value={newPantryName}
            onChange={(e) => setNewPantryName(e.target.value)}
            placeholder="Ex: Achocolatado em Pó (Pacote 400g)"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Quantidade Atual"
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
              placeholder="pacotes, caixas..."
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
              { value: 'bebida', label: 'Bebida (Café, Leite, Suco)' },
              { value: 'descartavel', label: 'Copos / Guardanapos' },
              { value: 'limpeza', label: 'Limpeza da Copa' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};
