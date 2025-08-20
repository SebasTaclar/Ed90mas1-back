# 🔍 Monitoring Database Connections

## Consultas SQL para diagnosticar conexiones

### 1. Conteo total de conexiones

```sql
SELECT count(*) AS total_connections FROM pg_stat_activity;
```

### 2. Conexiones por estado

```sql
SELECT state, count(*) AS count
FROM pg_stat_activity
GROUP BY state
ORDER BY count DESC;
```

### 3. Conexiones por aplicación (después del cambio)

```sql
SELECT application_name, usename, client_addr, count(*) AS count
FROM pg_stat_activity
WHERE application_name LIKE '%ed90mas1_back%'
GROUP BY application_name, usename, client_addr
ORDER BY count DESC;
```

### 4. Ver límites del servidor

```sql
SELECT name, setting, short_desc
FROM pg_settings
WHERE name IN ('max_connections','superuser_reserved_connections');
```

### 5. Conexiones problemáticas (idle in transaction)

```sql
SELECT pid, usename, application_name, client_addr, state,
       query_start, now() - query_start AS duration,
       substring(query for 300) AS current_query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY query_start;
```

### 6. Listado detallado de todas las conexiones

```sql
SELECT pid, usename, application_name, client_addr, client_port,
       datname, state, wait_event_type, wait_event,
       query_start, now() - query_start AS duration,
       substring(query for 500) AS query_snippet
FROM pg_stat_activity
ORDER BY query_start NULLS LAST;
```

### 7. Terminar conexiones específicas (CUIDADO!)

```sql
-- Solo conexiones idle de tu app
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE application_name LIKE '%ed90mas1_back%'
  AND state = 'idle'
  AND pid <> pg_backend_pid();

-- Una conexión específica por PID
-- SELECT pg_terminate_backend(12345);
```

## 📊 Interpretación de resultados

- **state = 'active'**: Ejecutando query ahora
- **state = 'idle'**: Conexión abierta, esperando (normal en pooling)
- **state = 'idle in transaction'**: 🚨 Transacción abierta sin terminar (PROBLEMA)
- **application_name vacío**: Cliente que no especifica nombre
- **client_addr = null**: Procesos internos de PostgreSQL
- **usename = postgres**: Procesos de sistema (no tocar)

## 🎯 Qué buscar después de los cambios

1. **application_name = 'ed90mas1_back_local'**: Estas son TUS conexiones
2. **Número total < 20**: Deberías ver menos conexiones ahora
3. **No debe haber 'idle in transaction'**: Si aparecen, hay leaks de transacciones
4. **Duración < 5 minutos**: Conexiones muy largas pueden indicar problemas

## 🚨 Acciones si sigues viendo muchas conexiones

1. Verifica cuántas instancias de Azure Functions están corriendo
2. Revisa los logs de la app para ver cuántos clientes Prisma se crean
3. Si es necesario, reduce `connection_limit=3` a `connection_limit=2` en DATABASE_URL
4. Considera usar Azure SQL Database con pooling automático
