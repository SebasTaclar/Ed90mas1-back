# Sistema de Gestión de Equipos, Torneos y Categorías

Este documento describe las nuevas APIs implementadas para el sistema de gestión de equipos, torneos y categorías.

## Arquitectura de Datos

### Estructura de Entidades

```
User (Usuario)
├── id: number
├── email: string (único)
├── password: string
├── name: string
├── role: string
└── membershipPaid: boolean

Category (Categoría)
├── id: number
├── name: string (único)
├── description: string (opcional)
├── createdAt: DateTime
└── updatedAt: DateTime

Tournament (Torneo)
├── id: number
├── name: string
├── description: string (opcional)
├── startDate: DateTime
├── endDate: DateTime
├── maxTeams: number
├── isActive: boolean
├── createdAt: DateTime
├── updatedAt: DateTime
└── categories: Category[] (relación muchos a muchos)

Team (Equipo)
├── id: number
├── name: string
├── user: User (relación uno a uno)
├── isActive: boolean
├── createdAt: DateTime
├── updatedAt: DateTime
└── tournaments: Tournament[] (relación muchos a muchos)
```

### Relaciones

- **Usuario ↔ Equipo**: Un usuario puede tener múltiples equipos
- **Categoría ↔ Torneo**: Un torneo puede tener múltiples categorías, una categoría puede estar en múltiples torneos
- **Equipo ↔ Torneo**: Un equipo puede participar en múltiples torneos, un torneo puede tener múltiples equipos

## Endpoints de la API

### 🔓 Endpoints Públicos (No requieren autenticación)

#### 1. Listar Categorías

```http
GET /api/funcGetCategories
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Juvenil",
      "description": "Categoría para jugadores menores de 18 años",
      "createdAt": "2025-08-03T10:00:00Z",
      "updatedAt": "2025-08-03T10:00:00Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

#### 2. Listar Torneos

```http
GET /api/funcGetTournaments
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Liga Regional 2025",
      "description": "Torneo regional de temporada",
      "startDate": "2025-09-01T00:00:00Z",
      "endDate": "2025-12-15T23:59:59Z",
      "maxTeams": 16,
      "isActive": true,
      "createdAt": "2025-08-03T10:00:00Z",
      "updatedAt": "2025-08-03T10:00:00Z",
      "categories": [
        {
          "id": 1,
          "name": "Juvenil"
        }
      ]
    }
  ],
  "message": "Tournaments retrieved successfully"
}
```

#### 3. Crear Equipo (incluye creación de usuario)

```http
POST /api/funcCreateTeam
Content-Type: application/json

{
  "name": "Águilas FC",
  "userEmail": "capitan@aguilasfc.com",
  "userPassword": "password123",
  "userName": "Capitán Águilas",
  "tournamentIds": [1, 2]
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "team": {
      "id": 1,
      "name": "Águilas FC",
      "isActive": true,
      "createdAt": "2025-08-03T10:00:00Z",
      "user": {
        "id": 5,
        "email": "capitan@aguilasfc.com",
        "name": "Capitán Águilas"
      },
      "tournaments": [
        {
          "id": 1,
          "name": "Liga Regional 2025",
          "startDate": "2025-09-01T00:00:00Z",
          "endDate": "2025-12-15T23:59:59Z"
        }
      ]
    }
  },
  "message": "Team and user created successfully"
}
```

### 🔐 Endpoints Protegidos (Requieren autenticación de admin)

#### 4. Crear Categoría

```http
POST /api/funcCreateCategory
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Profesional",
  "description": "Categoría para jugadores profesionales"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Profesional",
    "description": "Categoría para jugadores profesionales",
    "createdAt": "2025-08-03T10:00:00Z",
    "updatedAt": "2025-08-03T10:00:00Z"
  },
  "message": "Category created successfully"
}
```

#### 5. Crear Torneo

```http
POST /api/funcCreateTournament
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Copa Nacional 2025",
  "description": "Torneo nacional eliminatorio",
  "startDate": "2025-10-01T00:00:00.000Z",
  "endDate": "2025-11-30T23:59:59.000Z",
  "maxTeams": 32,
  "categoryIds": [1, 2]
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Copa Nacional 2025",
    "description": "Torneo nacional eliminatorio",
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-11-30T23:59:59Z",
    "maxTeams": 32,
    "isActive": true,
    "createdAt": "2025-08-03T10:00:00Z",
    "updatedAt": "2025-08-03T10:00:00Z",
    "categories": [
      {
        "id": 1,
        "name": "Juvenil"
      },
      {
        "id": 2,
        "name": "Profesional"
      }
    ]
  },
  "message": "Tournament created successfully"
}
```

## Flujo de Trabajo Recomendado

### 1. Configuración Inicial (Admin)

1. **Crear Categorías** usando `funcCreateCategory`
2. **Crear Torneos** usando `funcCreateTournament` asociando las categorías

### 2. Registro de Equipos (Público)

1. **Listar categorías disponibles** usando `funcGetCategories`
2. **Listar torneos disponibles** usando `funcGetTournaments`
3. **Crear equipo** usando `funcCreateTeam` con:
   - Información del equipo
   - Datos del usuario administrador del equipo
   - IDs de los torneos en los que quiere participar

### 3. Flujo de Autenticación para Equipos

1. El equipo usa el email/password creado para hacer login con `funcLogin`
2. Con el token obtenido, puede acceder a endpoints protegidos si es necesario

## Validaciones Implementadas

### Categorías

- ✅ Nombre único y requerido (2-100 caracteres)
- ✅ Descripción opcional
- ✅ Solo admins pueden crear/modificar

### Torneos

- ✅ Nombre requerido (3-200 caracteres)
- ✅ Fechas válidas (inicio < fin, inicio > ahora)
- ✅ Máximo de equipos (1-1000)
- ✅ Al menos una categoría asociada
- ✅ Categorías deben existir
- ✅ Solo admins pueden crear/modificar

### Equipos

- ✅ Nombre requerido (2-100 caracteres)
- ✅ Usuario: email válido, password (min 6 chars), nombre requerido
- ✅ Email único en el sistema
- ✅ Torneos deben existir y estar activos
- ✅ Torneos no deben estar llenos
- ✅ Sin duplicados en lista de torneos

## Códigos de Error

### 400 - Bad Request

- Datos faltantes o inválidos
- Formato de email incorrecto
- Fechas inválidas

### 401 - Unauthorized

- Token JWT faltante o inválido
- Usuario no autenticado

### 403 - Forbidden

- Usuario no tiene permisos (no es admin)

### 409 - Conflict

- Email ya existe
- Nombre de categoría ya existe
- Torneo lleno

### 404 - Not Found

- Categoría no encontrada
- Torneo no encontrado
- Equipo no encontrado

## Estructura de Base de Datos

### Tablas Principales

- `users` - Usuarios del sistema
- `categories` - Categorías de competición
- `tournaments` - Torneos/Competiciones
- `teams` - Equipos

### Tablas de Relación

- `tournament_categories` - Relación muchos a muchos entre torneos y categorías
- `team_tournaments` - Relación muchos a muchos entre equipos y torneos

Todas las tablas incluyen campos `created_at` y `updated_at` para auditoría.
