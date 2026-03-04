import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { Navigate } from 'react-router-dom';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { workspace, loading, hasWorkspace } = useWorkspace();
  useRealtimeInvalidation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasWorkspace) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display text-sm font-semibold text-foreground/80">{workspace?.name}</h2>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
