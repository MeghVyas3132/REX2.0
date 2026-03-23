'use client';

import React from 'react';
import './table.css';

export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  className?: string;
}

export const Table = React.forwardRef<
  HTMLTableElement,
  TableProps<any>
>(
  ({ columns, data, keyExtractor, className = '' }, ref) => {
    return (
      <table ref={ref} className={`table ${className}`.trim()}>
        <thead className="table__head">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="table__header-cell"
                style={{
                  textAlign: col.align === 'right' ? 'right' : 'left',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {data.map((row, rowIndex) => (
            <tr key={keyExtractor(row, rowIndex)} className="table__row">
              {columns.map((col) => (
                <td
                  key={`${col.key}-${rowIndex}`}
                  className={`table__cell ${col.mono ? 'table__cell--mono' : ''} ${col.align === 'right' ? 'table__cell--numeric' : ''}`.trim()}
                  style={{
                    textAlign: col.align === 'right' ? 'right' : 'left',
                  }}
                >
                  {col.render
                    ? col.render((row as any)[col.key], row, rowIndex)
                    : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
);

Table.displayName = 'Table';
