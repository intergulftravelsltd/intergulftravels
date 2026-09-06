'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CompanyProfile } from '@/lib/company-profile';

/**
 * The signed-in agency's letterhead (name, offices, phones, email, logo).
 * Fed once from the admin layout so every client export button prints the
 * right company without prop-drilling through each page.
 */
const CompanyProfileContext = createContext<CompanyProfile | null>(null);

export function CompanyProfileProvider({ company, children }: { company: CompanyProfile; children: ReactNode }) {
  return <CompanyProfileContext.Provider value={company}>{children}</CompanyProfileContext.Provider>;
}

export function useCompanyProfile(): CompanyProfile | null {
  return useContext(CompanyProfileContext);
}
