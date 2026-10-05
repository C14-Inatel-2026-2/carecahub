'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PaginateParams } from '@/types/api'

export type ColumnDef<T> = {
  header: string
  accessorKey: string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

type PaginationProps = {
  totalCount: number
  params: PaginateParams
  setParams: React.Dispatch<React.SetStateAction<PaginateParams>>
}

export type DataTableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (item: T) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchFunction?: (item: T, searchTerm: string) => boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: React.ReactNode
  emptyStateAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  isLoading?: boolean
  loadingRowCount?: number
  idKey?: keyof T
  className?: string
  pagination?: PaginationProps
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
}

export function DataTable<T extends object>({
  data,
  columns,
  onRowClick,
  searchValue = '',
  onSearchChange,
  searchFunction,
  emptyStateTitle = 'Nenhum registro encontrado',
  emptyStateDescription = 'Tente outra busca ou crie um novo registro.',
  emptyStateIcon,
  emptyStateAction,
  isLoading = false,
  loadingRowCount = 10,
  idKey = 'id' as keyof T,
  className,
  pagination,
  onSortChange,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const searchTerm = onSearchChange ? searchValue : ''

  // Default search function if none provided
  const defaultSearchFunction = (item: T, term: string) => {
    return Object.values(item).some((value) => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(term.toLowerCase())
    })
  }

  // Filter data based on search term if not using server-side filtering
  const filteredData =
    !onSortChange && searchTerm
      ? data.filter((item) =>
          searchFunction
            ? searchFunction(item, searchTerm)
            : defaultSearchFunction(item, searchTerm)
        )
      : data

  // Sort data if a sort column is selected and not using server-side sorting
  const sortedData =
    !onSortChange && sortColumn
      ? [...filteredData].sort((a, b) => {
          const aValue = a[sortColumn as keyof T]
          const bValue = b[sortColumn as keyof T]

          if (aValue === bValue) return 0

          // Handle string comparison
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }

          // Handle number comparison
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
          }

          // Handle date comparison
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc'
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime()
          }

          // Default comparison
          return sortDirection === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue))
        })
      : filteredData

  const displayData = onSortChange ? data : sortedData

  // Handle column header click for sorting
  const handleHeaderClick = (column: ColumnDef<T>) => {
    if (!column.sortable) return

    const newDirection =
      sortColumn === column.accessorKey && sortDirection === 'asc' ? 'desc' : 'asc'

    if (onSortChange) {
      onSortChange(column.accessorKey, newDirection)
      setSortColumn(column.accessorKey)
      setSortDirection(newDirection)
    } else if (pagination) {
      // Handle sorting internally if pagination is provided but no onSortChange
      pagination.setParams((prev) => ({
        ...prev,
        orderBy: column.accessorKey,
        orderType: newDirection,
      }))
      setSortColumn(column.accessorKey)
      setSortDirection(newDirection)
    } else {
      if (sortColumn === column.accessorKey) {
        setSortDirection(newDirection)
      } else {
        setSortColumn(column.accessorKey)
        setSortDirection('asc')
      }
    }
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (pagination) {
      pagination.setParams((prev) => ({
        ...prev,
        skip: (page - 1) * (prev.take || 10),
      }))
    }
  }

  const handlePageSizeChange = (size: number) => {
    if (pagination) {
      pagination.setParams((prev) => ({
        ...prev,
        take: size,
        skip: 0,
      }))
    }
  }

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey} className={cn(column.className, 'px-4')}>
                <Skeleton className='h-6 w-full' />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: loadingRowCount }).map((_, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey} className={cn(column.className, 'px-4')}>
                  <Skeleton className='my-2 h-8 w-full' />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (displayData.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        {emptyStateIcon}
        <h3 className='mt-4 text-lg font-medium'>{emptyStateTitle}</h3>
        <p className='mt-1 text-center text-sm text-muted-foreground'>
          {searchTerm ? 'Nenhum registro corresponde à sua busca.' : emptyStateDescription}
        </p>
        {emptyStateAction && !searchTerm && (
          <Button className='mt-4' onClick={emptyStateAction.onClick}>
            {emptyStateAction.icon}
            {emptyStateAction.label}
          </Button>
        )}
      </div>
    )
  }

  // Calculate current page for pagination
  const currentPage = pagination
    ? Math.floor((pagination.params.skip || 0) / (pagination.params.take || 10)) + 1
    : 1
  const pageSize = pagination?.params.take || 10

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card/60 shadow-xs', className)}>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted/30'>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.accessorKey}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                    column.className,
                    'px-4'
                  )}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        column.sortable && sortColumn === column.accessorKey && 'font-semibold'
                      )}
                    >
                      {column.header}
                    </span>
                    {column.sortable && (
                      <div className='shrink-0'>
                        {sortColumn === column.accessorKey ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4 text-icon-accent' />
                          ) : (
                            <ArrowDown className='h-4 w-4 text-icon-accent' />
                          )
                        ) : (
                          <ArrowUpDown className='h-4 w-4 text-icon-muted/80' />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((item) => (
              <TableRow
                key={String(item[idKey])}
                role={onRowClick ? 'link' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  onRowClick &&
                    'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'
                )}
                onClick={(event) => {
                  // Portal events bubble through React even when the menu is outside the row.
                  if (!event.currentTarget.contains(event.target as Node)) return
                  if (
                    event.target instanceof Element &&
                    event.target.closest('a,button,input,select,textarea')
                  ) {
                    return
                  }
                  onRowClick?.(item)
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    onRowClick(item)
                  }
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.accessorKey} className={cn(column.className, 'px-4 py-3')}>
                    {column.cell
                      ? column.cell(item)
                      : String(item[column.accessorKey as keyof T] || '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalCount > pageSize && (
        <div className='flex items-center justify-between border-t p-4'>
          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <div className='hidden sm:block'>Itens por página</div>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className='hidden h-8 w-17.5 sm:flex'>
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              {pagination.totalCount > 0
                ? `${(currentPage - 1) * pageSize + 1}-${Math.min(
                    currentPage * pageSize,
                    pagination.totalCount
                  )} de ${pagination.totalCount}`
                : '0 resultados'}
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='h-8 px-2 md:px-3'
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className='h-4 w-4' />
              <span className='hidden md:ml-1 md:inline'>Página anterior</span>
            </Button>
            <Button
              variant='outline'
              className='h-8 px-2 md:px-3'
              disabled={currentPage * pageSize >= pagination.totalCount}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <span className='hidden md:mr-1 md:inline'>Próxima página</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {pagination && pagination.totalCount <= pageSize && (
        <div className='p-4 text-xs text-muted-foreground'>
          {`${pagination.totalCount} ${pagination.totalCount === 1 ? 'item' : 'itens'}`}
        </div>
      )}

      {!pagination && (
        <div className='p-4 text-xs text-muted-foreground'>
          {`${displayData.length} ${displayData.length === 1 ? 'item' : 'itens'}`}
        </div>
      )}
    </div>
  )
}
