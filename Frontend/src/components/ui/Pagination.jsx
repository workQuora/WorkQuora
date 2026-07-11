import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const getPageList = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  if (currentPage > 3) pages.push('ellipsis-start');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (currentPage < totalPages - 2) pages.push('ellipsis-end');
  pages.push(totalPages);

  return pages;
};

const PageButton = ({ active, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-9 h-9 rounded-xl text-sm flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/70 text-foreground'
    }`}
  >
    {children}
  </button>
);

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = getPageList(currentPage, totalPages);

  return (
    <div className="flex items-center gap-2">
      <PageButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
        <ChevronLeft className="w-4 h-4" />
      </PageButton>

      {pages.map((p) =>
        typeof p === 'number' ? (
          <PageButton key={p} active={p === currentPage} onClick={() => onPageChange(p)}>
            {p}
          </PageButton>
        ) : (
          <span key={p} className="w-9 h-9 flex items-center justify-center text-muted-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </span>
        )
      )}

      <PageButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
        <ChevronRight className="w-4 h-4" />
      </PageButton>
    </div>
  );
};

export default Pagination;
