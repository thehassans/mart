import { useMemo, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useAdminTheme } from '../../utils/adminTheme.js';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import GlassPanel from '../ui/GlassPanel.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

function getInventoryStatus(product) {
  const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;
  const hasValidExpiryDate = Boolean(expiryDate && !Number.isNaN(expiryDate.getTime()));
  const daysToExpiry = hasValidExpiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (product.stockQuantity <= 0) {
    return { tone: 'danger', key: 'outOfStock' };
  }

  if (product.stockQuantity <= product.reorderLevel) {
    return { tone: 'warning', key: 'lowStock' };
  }

  if (product.requiresExpiryTracking && daysToExpiry !== null && daysToExpiry <= 10) {
    return { tone: 'warning', key: 'expiringSoon' };
  }

  return { tone: 'success', key: 'healthy' };
}

export default function InventoryDataTable({ businessType, isLoading = false, products, onPrintLabel }) {
  const { i18n, t } = useTranslation();
  const { isDark } = useAdminTheme();
  const language = i18n.resolvedLanguage === 'ar' ? 'ar' : 'en';
  const [search, setSearch] = useState('');
  const columnHelper = createColumnHelper();

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return products.filter((product) => {
      if (!normalized) {
        return true;
      }

      return [
        product.brand?.en,
        product.brand?.ar,
        product.name.en,
        product.name.ar,
        product.sku,
        product.barcode,
        product.category?.en,
        product.category?.ar,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [products, search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.name[language] || row.name.en, {
        id: 'name',
        header: t('inventory.product'),
        cell: (info) => (
          <div className="flex items-center gap-3 text-start">
            {info.row.original.imageUrl ? (
              <img alt={info.getValue()} className="h-12 w-12 rounded-2xl object-cover" src={info.row.original.imageUrl} />
            ) : (
              <div className={isDark ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xs font-semibold text-slate-400' : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-500'}>
                {info.getValue().slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>{info.getValue()}</div>
              <div className={isDark ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>{info.row.original.brand?.[language] || info.row.original.brand?.en || (info.row.original.isWeighedItem ? t('printer.weightedSticker') : t('printer.shelfLabel'))}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.category?.[language] || row.category?.en || '-', {
        id: 'category',
        header: t('inventory.category'),
      }),
      columnHelper.accessor('sku', {
        header: t('inventory.sku'),
      }),
      columnHelper.accessor('barcode', {
        header: t('inventory.barcode'),
      }),
      columnHelper.accessor('stockQuantity', {
        header: t('inventory.stock'),
        cell: (info) => Number(info.getValue()).toFixed(1),
      }),
      columnHelper.accessor('sellingPrice', {
        header: t('inventory.price'),
        cell: (info) => `SAR ${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.display({
        id: 'status',
        header: t('inventory.status'),
        cell: ({ row }) => {
          const status = getInventoryStatus(row.original);
          return <StatusBadge tone={status.tone}>{t(`inventory.${status.key}`)}</StatusBadge>;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: t('inventory.actions'),
        cell: ({ row }) => (
          <Button onClick={() => onPrintLabel(row.original)} variant="secondary">
            {t('inventory.printLabel')}
          </Button>
        ),
      }),
    ],
    [columnHelper, isDark, language, onPrintLabel, t]
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <GlassPanel className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Field
          className="lg:max-w-xl"
          label={t('inventory.category')}
          name="search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('inventory.searchPlaceholder')}
          value={search}
        />
        {businessType === 'BAKALA' ? (
          <StatusBadge tone="warning">{t('inventory.weighedOnly')}</StatusBadge>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className={isDark ? 'min-w-full divide-y divide-white/10' : 'min-w-full divide-y divide-slate-200'}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th className={isDark ? 'px-4 py-4 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-400' : 'px-4 py-4 text-start text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'} key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
            {isLoading ? (
              <tr>
                <td className={isDark ? 'px-4 py-8 text-center text-sm text-slate-400' : 'px-4 py-8 text-center text-sm text-slate-500'} colSpan={columns.length}>
                  {t('inventory.loading')}
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className={isDark ? 'px-4 py-8 text-center text-sm text-slate-400' : 'px-4 py-8 text-center text-sm text-slate-500'} colSpan={columns.length}>
                  {t('inventory.noRows')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr className={isDark ? 'transition hover:bg-white/5' : 'transition hover:bg-slate-50'} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className={isDark ? 'px-4 py-4 text-sm text-slate-200' : 'px-4 py-4 text-sm text-slate-700'} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
