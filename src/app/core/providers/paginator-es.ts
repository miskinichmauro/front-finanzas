import { MatPaginatorIntl } from '@angular/material/paginator';

export function getEsPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Por página:';
  intl.nextPageLabel     = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel    = 'Primera página';
  intl.lastPageLabel     = 'Última página';
  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    const start = page * pageSize + 1;
    const end   = Math.min(page * pageSize + pageSize, length);
    return `${start} – ${end} de ${length}`;
  };
  return intl;
}
