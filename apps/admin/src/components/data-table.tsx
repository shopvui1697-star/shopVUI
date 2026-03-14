'use client';

import { useState } from 'react';
import { Pagination } from './pagination';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  idKey?: keyof T;
}

export function DataTable<T>({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  selectable,
  selectedIds,
  onSelectionChange,
  idKey = 'id' as keyof T,
}: DataTableProps<T>) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set());
  const selected = selectedIds ?? localSelected;
  const setSelected = onSelectionChange ?? setLocalSelected;

  function toggleAll() {
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map((row) => String(row[idKey]))));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.size === data.length}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rowId = String(row[idKey]);
                return (
                  <tr
                    key={rowId || idx}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  >
                    {selectable && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(rowId)}
                          onChange={() => toggleOne(rowId)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm">
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div className="mt-4 flex justify-end">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
