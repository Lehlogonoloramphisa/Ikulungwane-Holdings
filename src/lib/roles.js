export const ADMIN_ROLES = ["admin", "super_admin"];

export const isAdminRole = (role) => ADMIN_ROLES.includes(role);
