import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-14 items-center px-4">
          <SidebarTrigger />
        </header>

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-5xl px-6 bg-red-100">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
