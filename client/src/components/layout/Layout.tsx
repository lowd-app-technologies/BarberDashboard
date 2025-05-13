import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64 pb-16 md:pb-0">
        {children}
      </div>
      <MobileNavigation />
    </div>
  );
}