export const ROLES = {
  ADMIN: "admin",
  INVENTORY: "inventory",
  // Legacy alias kept for existing local accounts.
  RECEPTIONIST: "receptionist",
  CUSTOMER: "customer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "return",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ALLOWED_ORDER_STATUSES: readonly string[] = Object.values(ORDER_STATUS);

export const MOVEMENT_TYPE = {
  INPUT: "ENTRADA",
  OUTPUT: "SALIDA",
} as const;

export const LOW_STOCK_THRESHOLD = 5;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
