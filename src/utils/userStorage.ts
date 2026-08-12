import type { UserAccount, Role } from '../types';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin',
    createdAt: '2026-08-01'
  },
  {
    id: 'user-manager',
    username: 'manager',
    password: 'manager123',
    name: 'Operations Manager',
    role: 'manager',
    createdAt: '2026-08-01'
  },
  {
    id: 'user-sales',
    username: 'sales',
    password: 'sales123',
    name: 'Sales Representative',
    role: 'salesperson',
    createdAt: '2026-08-01'
  }
];

export function getRegisteredUsers(): UserAccount[] {
  const saved = localStorage.getItem('upstep_registered_users');
  if (!saved) {
    localStorage.setItem('upstep_registered_users', JSON.stringify(INITIAL_USER_ACCOUNTS));
    return INITIAL_USER_ACCOUNTS;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return INITIAL_USER_ACCOUNTS;
  }
}

export function saveRegisteredUsers(users: UserAccount[]): void {
  localStorage.setItem('upstep_registered_users', JSON.stringify(users));
}

export function authenticateUser(usernameInput: string, passwordInput: string): UserAccount | null {
  const users = getRegisteredUsers();
  const found = users.find(
    u => u.username.toLowerCase().trim() === usernameInput.toLowerCase().trim() && u.password === passwordInput
  );
  return found || null;
}

export function getRoleTitle(role: Role): string {
  switch (role) {
    case 'admin': return 'System Admin';
    case 'manager': return 'Ops Manager';
    case 'salesperson': return 'Sales Executive';
    case 'rm': return 'Relationship Manager';
    default: return 'User';
  }
}
