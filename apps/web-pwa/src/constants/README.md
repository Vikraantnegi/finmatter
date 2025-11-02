# API Routes Constants

Centralized API endpoint definitions for type-safe route management.

## 📁 Location

`src/constants/apiRoutes.ts`

## ✨ Benefits

- ✅ **Type Safety**: Full TypeScript support with `as const`
- ✅ **Single Source of Truth**: Change routes in one place
- ✅ **No Typos**: Autocomplete prevents string errors
- ✅ **Easy Refactoring**: Update API structure easily
- ✅ **Better DX**: IDE autocomplete for all routes

## 📖 Usage Examples

### Import the constants

```typescript
import { API_ROUTES } from '@/constants/apiRoutes';

// Or import specific route groups
import { auth, user, health } from '@/constants/apiRoutes';
```

### Auth Routes (Static)

```typescript
// Send OTP
await apiClient.post(API_ROUTES.AUTH.SEND_OTP, { phoneNumber });

// Verify OTP
await apiClient.post(API_ROUTES.AUTH.VERIFY_OTP, { phoneNumber, otp });

// Refresh Token
await apiClient.post(API_ROUTES.AUTH.REFRESH_TOKEN, {});

// Sign Out
await apiClient.post(API_ROUTES.AUTH.SIGN_OUT);
```

### User Routes (Dynamic)

```typescript
// Get user by ID (dynamic route)
const userId = 'user-123';
await apiClient.get(API_ROUTES.USER.BY_ID(userId));
// Result: /api/users/user-123

// Update profile (static route)
await apiClient.put(API_ROUTES.USER.PROFILE, { firstName: 'John' });

// Complete onboarding (static route)
await apiClient.put(API_ROUTES.USER.ONBOARDING, { firstName: 'John' });

// Delete user (dynamic route)
await apiClient.delete(API_ROUTES.USER.DELETE(userId));
```

### Health Check

```typescript
await apiClient.get(API_ROUTES.HEALTH.CHECK);
```

## 🎯 Adding New Routes

### 1. Static Routes

For routes without parameters:

```typescript
export const YOUR_ROUTES = {
  STATIC_ROUTE: '/api/your-module/endpoint',
} as const;
```

### 2. Dynamic Routes

For routes with parameters:

```typescript
export const YOUR_ROUTES = {
  BY_ID: (id: string) => `/api/your-module/${id}` as const,
  NESTED: (parentId: string, childId: string) =>
    `/api/your-module/${parentId}/child/${childId}` as const,
} as const;
```

### 3. Add to API_ROUTES

```typescript
export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  USER: USER_ROUTES,
  YOUR_MODULE: YOUR_ROUTES, // Add here
} as const;
```

## 🔍 Current Routes

### Auth

- `AUTH.SEND_OTP` → `/api/auth/send-otp`
- `AUTH.VERIFY_OTP` → `/api/auth/verify-otp`
- `AUTH.REFRESH_TOKEN` → `/api/auth/refresh`
- `AUTH.SIGN_OUT` → `/api/auth/signout`

### User

- `USER.BY_ID(id)` → `/api/users/{id}`
- `USER.DELETE(id)` → `/api/users/{id}`
- `USER.PROFILE` → `/api/users/profile`
- `USER.ONBOARDING` → `/api/users/onboarding`

### Health

- `HEALTH.CHECK` → `/api/health`

## 🚀 Migration Guide

### Before (Hardcoded)

```typescript
// ❌ Prone to typos, hard to refactor
await apiClient.post('/api/auth/send-otp', data);
await apiClient.get(`/api/users/${userId}`);
```

### After (Constants)

```typescript
// ✅ Type-safe, autocomplete, easy to refactor
await apiClient.post(API_ROUTES.AUTH.SEND_OTP, data);
await apiClient.get(API_ROUTES.USER.BY_ID(userId));
```

## 📝 Type Safety

The constants are fully typed:

```typescript
// TypeScript knows all available routes
const route: ApiRoute = API_ROUTES.AUTH.SEND_OTP;

// TypeScript enforces correct parameters
const userRoute = API_ROUTES.USER.BY_ID('user-123'); // ✅
const userRoute = API_ROUTES.USER.BY_ID(); // ❌ TypeScript error
```

## 🎨 IDE Features

- **Autocomplete**: Type `API_ROUTES.` to see all available routes
- **Go to Definition**: Ctrl+Click to jump to route definition
- **Find References**: See everywhere a route is used
- **Rename Symbol**: Safely rename routes across the codebase
