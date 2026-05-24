/**
 * Papéis para RBAC (Cybersecurity: controle de acesso por papéis).
 * - ADMIN: administrador da plataforma.
 * - ANALYST: time de pós-venda da concessionária (usa o Cockpit).
 * - CUSTOMER: dono do veículo (usa o App do Cliente).
 */
export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  CUSTOMER = 'customer',
}
