import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export function Layout({ children, pageTitle }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64 pb-16 md:pb-0">
        <div className="p-6">
          {pageTitle && (
            <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
          )}
          {children}
        </div>
      </div>
      <MobileNavigation />
    </div>
  );
}