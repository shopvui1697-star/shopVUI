'use client';

import type { PriceTierData } from '@shopvui/shared';
import { formatCurrency } from '@shopvui/shared';
import { useTranslations } from 'next-intl';

interface PriceTierTableProps {
  tiers: PriceTierData[];
}

export function PriceTierTable({ tiers }: PriceTierTableProps) {
  const t = useTranslations('priceTier');
  if (tiers.length === 0) return null;

  return (
    <div data-testid="price-tier-table">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t('title')}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="py-2 pr-4 text-left font-medium text-neutral-600 dark:text-neutral-300">
              {t('quantity')}
            </th>
            <th className="py-2 pl-4 text-right font-medium text-neutral-600 dark:text-neutral-300">
              {t('unitPrice')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {tiers.map((tier) => (
            <tr key={tier.id}>
              <td className="py-2 pr-4 text-neutral-700 dark:text-neutral-300">
                {tier.maxQty ? `${tier.minQty} - ${tier.maxQty}` : `${tier.minQty}+`}
              </td>
              <td className="py-2 pl-4 text-right font-semibold text-black dark:text-white">
                {formatCurrency(tier.price, 'VND')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
