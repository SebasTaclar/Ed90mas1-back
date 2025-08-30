# Frontend Implementation - Firebase Real-time Events

## Instalación

Instala Firebase SDK en tu proyecto frontend:

```bash
npm install firebase
```

## Configuración

### 1. Configurar Firebase en tu proyecto

Crea un archivo `firebase-config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'tu-api-key',
  authDomain: 'tu-project-id.firebaseapp.com',
  databaseURL: 'https://tu-project-id-default-rtdb.firebaseio.com/',
  projectId: 'tu-project-id',
  storageBucket: 'tu-project-id.appspot.com',
  messagingSenderId: '123456789',
  appId: 'tu-app-id',
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### 2. Servicio de Eventos en Tiempo Real

Crea `real-time-events.service.js`:

```javascript
import { database } from './firebase-config.js';
import { ref, onValue, off } from 'firebase/database';

export class RealTimeEventsService {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Escucha eventos de un partido en tiempo real
   */
  subscribeToMatchEvents(matchId, callback) {
    const eventsRef = ref(database, `matches/${matchId}/events`);

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const events = [];
      snapshot.forEach((childSnapshot) => {
        events.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Ordenar eventos por minuto y ID
      events.sort((a, b) => {
        if (a.minute !== b.minute) return a.minute - b.minute;
        return a.id - b.id;
      });

      callback(events);
    });

    this.listeners.set(`match-events-${matchId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Escucha datos del partido (marcador, estado, tiempo)
   */
  subscribeToMatchData(matchId, callback) {
    const matchRef = ref(database, `matches/${matchId}/data`);

    const unsubscribe = onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    this.listeners.set(`match-data-${matchId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Escucha solo eventos nuevos (desde ahora)
   */
  subscribeToNewEvents(matchId, callback) {
    const eventsRef = ref(database, `matches/${matchId}/events`);

    let isFirstLoad = true;
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return; // Ignorar la primera carga
      }

      const events = [];
      snapshot.forEach((childSnapshot) => {
        events.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Solo eventos nuevos (últimos 5 segundos)
      const now = new Date();
      const recentEvents = events.filter((event) => {
        const eventTime = new Date(event.createdAt);
        return now - eventTime < 5000; // 5 segundos
      });

      if (recentEvents.length > 0) {
        callback(recentEvents);
      }
    });

    this.listeners.set(`new-events-${matchId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Desuscribirse de un partido específico
   */
  unsubscribeFromMatch(matchId) {
    const eventListener = this.listeners.get(`match-events-${matchId}`);
    const dataListener = this.listeners.get(`match-data-${matchId}`);
    const newEventListener = this.listeners.get(`new-events-${matchId}`);

    if (eventListener) {
      eventListener();
      this.listeners.delete(`match-events-${matchId}`);
    }

    if (dataListener) {
      dataListener();
      this.listeners.delete(`match-data-${matchId}`);
    }

    if (newEventListener) {
      newEventListener();
      this.listeners.delete(`new-events-${matchId}`);
    }
  }

  /**
   * Desuscribirse de todos los eventos
   */
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}
```

### 3. Hook de React (si usas React)

Crea `use-real-time-match.js`:

```javascript
import { useState, useEffect, useRef } from 'react';
import { RealTimeEventsService } from './real-time-events.service';

export function useRealTimeMatch(matchId) {
  const [events, setEvents] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const serviceRef = useRef(null);

  useEffect(() => {
    if (!matchId) return;

    // Inicializar servicio
    serviceRef.current = new RealTimeEventsService();
    setIsConnected(true);

    // Suscribirse a eventos
    const eventsUnsubscribe = serviceRef.current.subscribeToMatchEvents(matchId, setEvents);

    // Suscribirse a datos del partido
    const dataUnsubscribe = serviceRef.current.subscribeToMatchData(matchId, setMatchData);

    // Cleanup
    return () => {
      if (serviceRef.current) {
        serviceRef.current.unsubscribeFromMatch(matchId);
        setIsConnected(false);
      }
    };
  }, [matchId]);

  return {
    events,
    matchData,
    isConnected,
  };
}
```

### 4. Componente de Ejemplo (React)

```javascript
import React from 'react';
import { useRealTimeMatch } from './use-real-time-match';

export function LiveMatchComponent({ matchId }) {
  const { events, matchData, isConnected } = useRealTimeMatch(matchId);

  if (!isConnected) {
    return <div>Conectando...</div>;
  }

  return (
    <div className="live-match">
      {/* Datos del partido */}
      {matchData && (
        <div className="match-header">
          <h2>
            {matchData.homeTeamName} vs {matchData.awayTeamName}
          </h2>
          <div className="score">
            {matchData.homeScore} - {matchData.awayScore}
          </div>
          <div className="match-info">
            <span>Estado: {matchData.status}</span>
            {matchData.currentMinute && <span> | Minuto: {matchData.currentMinute}'</span>}
          </div>
        </div>
      )}

      {/* Eventos en tiempo real */}
      <div className="events">
        <h3>Eventos del Partido</h3>
        {events.map((event) => (
          <div key={event.id} className={`event event-${event.eventType.toLowerCase()}`}>
            <div className="event-time">
              {event.minute}' {event.extraTime && `+${event.extraTime}`}
            </div>
            <div className="event-details">
              <strong>{event.playerName}</strong> ({event.teamName})
              <div className="event-type">{formatEventType(event.eventType)}</div>
              {event.description && <div className="description">{event.description}</div>}
              {event.assistPlayerName && (
                <div className="assist">Asistencia: {event.assistPlayerName}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEventType(eventType) {
  const types = {
    GOAL: '⚽ Gol',
    PENALTY_GOAL: '⚽ Gol de penal',
    OWN_GOAL: '⚽ Gol en contra',
    YELLOW_CARD: '🟨 Tarjeta amarilla',
    RED_CARD: '🟥 Tarjeta roja',
    SUBSTITUTION: '🔄 Sustitución',
    INJURY: '🏥 Lesión',
    OFFSIDE: '⚠️ Fuera de juego',
  };
  return types[eventType] || eventType;
}
```

### 5. Implementación Vanilla JavaScript

Para proyectos sin frameworks:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Partido en Vivo</title>
  </head>
  <body>
    <div id="match-info"></div>
    <div id="events-list"></div>

    <script type="module">
      import { RealTimeEventsService } from './real-time-events.service.js';

      const matchId = 123; // ID del partido
      const service = new RealTimeEventsService();

      // Elementos del DOM
      const matchInfoEl = document.getElementById('match-info');
      const eventsListEl = document.getElementById('events-list');

      // Escuchar datos del partido
      service.subscribeToMatchData(matchId, (matchData) => {
          matchInfoEl.innerHTML = \`
              <h2>\${matchData.homeTeamName} vs \${matchData.awayTeamName}</h2>
              <div class="score">\${matchData.homeScore} - \${matchData.awayScore}</div>
              <div>Estado: \${matchData.status}</div>
              \${matchData.currentMinute ? \`<div>Minuto: \${matchData.currentMinute}'</div>\` : ''}
          \`;
      });

      // Escuchar eventos
      service.subscribeToMatchEvents(matchId, (events) => {
          eventsListEl.innerHTML = events.map(event => \`
              <div class="event">
                  <span class="time">\${event.minute}'</span>
                  <span class="player">\${event.playerName}</span>
                  <span class="type">\${event.eventType}</span>
                  \${event.description ? \`<span class="desc">\${event.description}</span>\` : ''}
              </div>
          \`).join('');
      });

      // Limpiar al cerrar la página
      window.addEventListener('beforeunload', () => {
          service.unsubscribeAll();
      });
    </script>
  </body>
</html>
```

## Uso

1. Configura Firebase en tu proyecto frontend
2. Importa y usa `RealTimeEventsService`
3. Suscríbete a eventos de partidos específicos
4. Los eventos se actualizarán automáticamente en tiempo real
5. No olvides desuscribirte cuando cambies de página

## Características

- ✅ **100 conexiones simultáneas gratuitas** con Firebase
- ✅ **Actualizaciones en tiempo real** de eventos y marcadores
- ✅ **Reconexión automática** si se pierde la conexión
- ✅ **Ordenación automática** de eventos por tiempo
- ✅ **Gestión de memoria** con desuscripciones automáticas
- ✅ **Compatible** con React, Vue, Angular o vanilla JavaScript
