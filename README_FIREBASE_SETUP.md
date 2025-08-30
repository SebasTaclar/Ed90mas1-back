# Firebase Real-Time Events - Setup Guide

## 📋 Resumen

Esta implementación añade funcionalidad de **WebSockets en tiempo real** usando **Firebase Realtime Database** para sincronizar eventos de partidos automáticamente.

### ✅ Características Implementadas

- 🔄 **Sincronización automática** de eventos cuando se crean/actualizan/eliminan
- ⚽ **Actualización de marcadores** en tiempo real
- ⏱️ **Tiempo del partido** actualizado cada minuto
- 🏟️ **Estado del partido** (programado, en progreso, finalizado)
- 🔗 **100 conexiones concurrentes gratuitas** con Firebase
- 📱 **Cliente JavaScript** listo para usar

## 🚀 Configuración del Backend

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Realtime Database** en el panel izquierdo
4. Configura las reglas de seguridad:

```json
{
  "rules": {
    "matches": {
      "$matchId": {
        ".read": true,
        ".write": false
      }
    }
  }
}
```

### 2. Generar Service Account Key

1. Ve a **Project Settings** → **Service Accounts**
2. Click en **Generate new private key**
3. Descarga el archivo JSON

### 3. Configurar Variables de Entorno

Actualiza tu `local.settings.json`:

```json
{
  "Values": {
    // ... otras variables existentes
    "FIREBASE_PROJECT_ID": "tu-project-id-aqui",
    "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\nTU_PRIVATE_KEY_AQUI\\n-----END PRIVATE KEY-----",
    "FIREBASE_CLIENT_EMAIL": "firebase-adminsdk-xyz@tu-project.iam.gserviceaccount.com"
  }
}
```

> **⚠️ Importante**: En el `FIREBASE_PRIVATE_KEY`, reemplaza los saltos de línea reales con `\\n`

### 4. Estructura de Datos en Firebase

Los datos se organizan así:

```javascript
firebase/
├── matches/
    ├── {matchId}/
        ├── data/               // Datos del partido
        │   ├── id: number
        │   ├── homeTeamName: string
        │   ├── awayTeamName: string
        │   ├── homeScore: number
        │   ├── awayScore: number
        │   ├── status: string
        │   ├── currentMinute: number
        │   └── lastUpdated: string
        └── events/             // Eventos del partido
            ├── {eventId}/
                ├── id: number
                ├── matchId: number
                ├── playerId: number
                ├── teamId: number
                ├── eventType: string
                ├── minute: number
                ├── playerName: string
                ├── teamName: string
                └── createdAt: string
```

## 🔧 Funcionalidades Implementadas

### Backend Changes

#### 1. **FirebaseService** (`src/services/FirebaseService.ts`)

- ✅ Conexión y configuración de Firebase
- ✅ Sincronización de eventos de partidos
- ✅ Actualización de marcadores
- ✅ Gestión de tiempo del partido

#### 2. **MatchEventService** - Actualizado

- ✅ Sincroniza con Firebase al crear eventos
- ✅ Sincroniza con Firebase al actualizar eventos
- ✅ Sincroniza con Firebase al eliminar eventos
- ✅ Actualiza marcador automáticamente

#### 3. **MatchService** - Actualizado

- ✅ Sincroniza al iniciar partidos
- ✅ Sincroniza al finalizar partidos

#### 4. **Timer Function** (`funcMatchTimer/`)

- ✅ Actualiza tiempo de partidos cada minuto
- ✅ Solo para partidos en progreso
- ✅ Límite de 120 minutos máximo

## 📱 Configuración del Frontend

### 1. Instalar Firebase

```bash
npm install firebase
```

### 2. Configurar Firebase

Crea `firebase-config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'tu-api-key',
  authDomain: 'tu-project-id.firebaseapp.com',
  databaseURL: 'https://tu-project-id-default-rtdb.firebaseio.com/',
  projectId: 'tu-project-id',
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### 3. Usar el Servicio de Tiempo Real

```javascript
import { RealTimeEventsService } from './real-time-events.service.js';

const service = new RealTimeEventsService();
const matchId = 123;

// Escuchar eventos
service.subscribeToMatchEvents(matchId, (events) => {
  console.log('Nuevos eventos:', events);
  // Actualizar UI aquí
});

// Escuchar marcador
service.subscribeToMatchData(matchId, (matchData) => {
  console.log('Datos del partido:', matchData);
  // Actualizar marcador en UI
});
```

## 🧪 Testing

### Probar la Implementación

1. **Crear un evento**:

```bash
POST /matches/{matchId}/events
{
  "playerId": 1,
  "teamId": 1,
  "eventType": "GOAL",
  "minute": 23,
  "description": "Gol espectacular"
}
```

2. **Verificar en Firebase**:

   - Abre Firebase Console → Realtime Database
   - Deberías ver el evento en `matches/{matchId}/events/{eventId}`

3. **Verificar en Frontend**:
   - El evento debe aparecer automáticamente sin recargar

## 🚨 Troubleshooting

### Error: "Failed to initialize Firebase"

**Solución**:

- Verifica que las variables de entorno estén bien configuradas
- Asegúrate de que el `FIREBASE_PRIVATE_KEY` tenga los `\\n` correctos
- Verifica que el Service Account tenga permisos de admin

### Error: "Permission denied"

**Solución**:

- Revisa las reglas de Firebase Realtime Database
- Asegúrate de que `.read` esté en `true` para `matches`

### Frontend no recibe eventos

**Solución**:

- Verifica la URL de la database en la configuración
- Confirma que el `matchId` sea correcto
- Abre las Dev Tools para ver errores de conexión

## 💰 Costos

- **Tier Gratuito**: 100 conexiones, 10GB transferencia/mes
- **Costo estimado mensual**: $0 para desarrollo y testing
- **Escalabilidad**: Automática hasta el límite gratuito

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:

- `src/services/FirebaseService.ts`
- `funcMatchTimer/function.json`
- `funcMatchTimer/index.ts`
- `docs/FRONTEND_REAL_TIME_IMPLEMENTATION.md`

### Archivos Modificados:

- `src/application/services/MatchEventService.ts`
- `src/application/services/MatchService.ts`
- `src/shared/serviceProvider.ts`
- `local.settings.json`
- `package.json` (firebase-admin agregado)

## 🎯 Próximos Pasos

1. Configurar Firebase con tus credenciales reales
2. Implementar el frontend usando los ejemplos proporcionados
3. Probar con eventos reales
4. Agregar notificaciones push (opcional)
5. Implementar autenticación de usuarios (opcional)

---

**¿Tienes preguntas?** Revisa la documentación completa en `docs/FRONTEND_REAL_TIME_IMPLEMENTATION.md`
