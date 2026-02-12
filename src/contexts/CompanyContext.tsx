import { createContext, useContext, useState, ReactNode } from "react";

interface CompanyContextType {
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string | null) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  return (
    <CompanyContext.Provider value={{ activeCompanyId, setActiveCompanyId }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error("useCompany must be used within CompanyProvider");
  return context;
}
