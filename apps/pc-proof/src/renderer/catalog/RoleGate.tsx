/**
 * RoleGate — shows children only for allowed roles [BR3.17].
 */
import type { JSX, ReactNode } from 'react';

export type CatalogUiRole = 'vendeur' | 'gerant' | 'proprietaire';

export interface RoleGateProps {
  readonly role: CatalogUiRole;
  readonly allow: readonly CatalogUiRole[];
  readonly children: ReactNode;
}

export function RoleGate({ role, allow, children }: RoleGateProps): JSX.Element | null {
  if (!allow.includes(role)) return null;
  return <>{children}</>;
}
