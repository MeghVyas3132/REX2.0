"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

type DataTableProps<TData> = {
  columns: Array<ColumnDef<TData>>;
  data: Array<TData>;
};

export function DataTable<TData>({ columns, data }: DataTableProps<TData>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="data-table-shell card">
      <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead className="data-table-head">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th className="data-table-header-cell" key={header.id} style={{ textAlign: "left", padding: "8px" }}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="data-table-body">
        {table.getRowModel().rows.map((row) => (
          <tr className="data-table-row" key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td className="data-table-cell" key={cell.id} style={{ padding: "8px", borderTop: "1px solid var(--border)" }}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
