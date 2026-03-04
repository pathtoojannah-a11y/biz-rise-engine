import { useState, useCallback } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { LeadFilters } from './LeadFilters';
import { LeadRow } from './LeadRow';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { NewLeadModal } from './NewLeadModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function LeadsInbox() {
  const { leads, totalCount, totalPages, page, setPage, filters, updateFilter, resetFilters, isLoading } = useLeads();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((val: string) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateFilter('search', val), 300);
  }, [updateFilter]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const hasActiveFilters = filters.status || filters.source || filters.locationId || filters.assignedTo || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">{totalCount} total leads</p>
        </div>
        <Button onClick={() => setShowNewLead(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> New Lead
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
          {searchInput && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <LeadFilters filters={filters} updateFilter={updateFilter} />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-muted-foreground">
            Clear all filters
          </Button>
        )}
      </div>

      {/* Table (desktop) */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">No leads found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters || filters.search ? 'Try adjusting your filters' : 'Create your first lead to get started'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any) => (
                  <LeadRow key={lead.id} lead={lead} onClick={() => setSelectedLeadId(lead.id)} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {leads.map((lead: any) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{lead.name}</span>
                  <StatusBadge status={lead.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{lead.phone || 'No phone'}</p>
                {lead.source && <p className="text-xs text-muted-foreground mt-0.5">{lead.source}</p>}
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <LeadDetailDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      <NewLeadModal open={showNewLead} onClose={() => setShowNewLead(false)} />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-primary/15 text-primary',
    contacted: 'bg-[hsl(var(--nexa-warning))]/15 text-[hsl(var(--nexa-warning))]',
    qualified: 'bg-accent/15 text-accent',
    unqualified: 'bg-muted text-muted-foreground',
    lost: 'bg-destructive/15 text-destructive',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}
