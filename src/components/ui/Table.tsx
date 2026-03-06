import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export const Table = ({ children, className = '' }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children }: { children: ReactNode }) => {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  );
};

export const TableBody = ({ children }: { children: ReactNode }) => {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) => {
  return (
    <tr
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <th
      scope="col"
      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <td className={`px-3 py-2 text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
};
