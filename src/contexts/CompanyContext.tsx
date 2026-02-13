import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { useCompanyMemberships } from "@/hooks/useCompanies";

type AppRole = "project_lead" | "team_lead" | "member";
type Department = "tech" | "marketing" | "research";

interface CompanyContextType {
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string | null) => void;
  activeRole: AppRole | null;
  activeDepartment: Department | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const { data: memberships = [] } = useCompanyMemberships();

  const activeMembership = useMemo(() => {
    if (!activeCompanyId) return null;
    return memberships.find(m => m.company_id === activeCompanyId) || null;
  }, [activeCompanyId, memberships]);

  const activeRole = (activeMembership?.role as AppRole) || null;
  const activeDepartment = (activeMembership?.department as Department) || null;

  return (
    <CompanyContext.Provider value={{ activeCompanyId, setActiveCompanyId, activeRole, activeDepartment }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error("useCompany must be used within CompanyProvider");
  return context;
}
