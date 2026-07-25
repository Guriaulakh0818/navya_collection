'use client';

import { useState } from 'react';

import { Pagination } from '@/components/ui/pagination';

type CategoryPaginationProps = {
  page: number;
  totalPages: number;
};

export function CategoryPagination({ page, totalPages }: CategoryPaginationProps) {
  const [currentPage, setCurrentPage] = useState(page);

  return (
    <div className="mt-8 flex justify-center">
      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
