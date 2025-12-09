# 🚀 CollabHub BFF  
_A production-grade Backend For Frontend built with NestJS, PostgreSQL, Prisma, GraphQL, Redis, and resilient orchestration patterns._

---

## 🧭 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Modules](#modules)
  - [Request Flow](#request-flow)
- [Resilience & Orchestration](#resilience--orchestration)
  - [Timeouts](#1-timeouts)
  - [Retries with Exponential Backoff](#2-retries-with-exponential-backoff)
  - [Circuit Breaker](#3-circuit-breaker)
  - [Partial Success in GraphQL](#4-partial-success-in-graphql)
  - [Concurrent Aggregation](#5-concurrent-aggregation)
- [Caching Layer](#caching-layer)
  - [In-memory + Redis](#in-memory--redis)
  - [Cache Keys & TTLs](#cache-keys--ttls)
- [Logging & Tracing](#logging--tracing)
  - [requestId Propagation](#requestid-propagation)
  - [Downstream Logging](#downstream-logging)
- [API Overview](#api-overview)
  - [REST Endpoints](#rest-endpoints)
  - [GraphQL Schema](#graphql-schema)
- [Running the Project](#running-the-project)
- [Development Guide](#development-guide)
- [Future Work (Phase 3)](#future-work-phase-3)
- [Why This Project Matters](#why-this-project-matters)

---

## 📌 Overview

**CollabHub BFF** is a full-featured Backend For Frontend built to model a real-world service:

- Authentication  
- CRUD modules (Users, Projects, Tasks)  
- Downstream orchestration  
- GraphQL aggregation  
- Redis caching  
- Circuit breaker  
- Request-level tracing  
- Modular architecture  

Unlike typical Node.js tutorials, this project focuses on **industrial backend engineering practices**:
resilience, observability, concurrency, and separation of concerns.

It is structured in phases that mirror real-world backend evolution.

---

## ⭐ Key Features

### **🔐 Authentication & Users**
- JWT-based auth
- `POST /auth/login`, `GET /me`
- Guards for REST & GraphQL
- User ↔ Projects relations

### **📂 CRUD Modules**
- Users  
- Projects  
- Tasks  
Each module follows Nest domain-based structure and Prisma models.

### **🧠 Orchestration & Resilience**
Downstream requests include:

- Timeout per call  
- Retries with backoff  
- Circuit breaker  
- Error capturing  
- Partial success responses  

### **⚡ Concurrent Aggregation**
GraphQL `externalDashboard` fetches multiple APIs in parallel using `Promise.all`.

### **📦 Caching Layer**
- Transparent caching with unified interface
- Redis-backed (or in-memory fallback)
- Automatic TTL-based invalidation

### **🕵️ Request Tracing**
- `requestId` via AsyncLocalStorage
- Included in all logs (REST, GraphQL, downstream)
- Critical for debugging and correlation

### **🧱 Clean Architecture**
Separation by domain:
---
src/
├─ auth/
├─ users/
├─ projects/
├─ tasks/
├─ external/ # orchestrator + downstream
├─ cache/ # Redis + memory cache
├─ logging/ # ALS + interceptors
├─ prisma/
└─ common/
---

## 🛠 Tech Stack

| Category | Tool |
|---------|------|
| Runtime | Node.js (LTS) |
| Language | TypeScript |
| Framework | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| API | REST + GraphQL |
| Testing | Jest + Supertest |
| DevOps | Docker Compose |
| Observability | requestId tracing + structured logs |
---

## 🏗 Architecture

### Modules

- **AuthModule**
- **UsersModule**
- **ProjectsModule**
- **TasksModule**
- **ExternalModule** – orchestrator + resilience
- **CacheModule** – Redis + in-memory
- **LoggingModule** – tracing interceptor
- **PrismaModule**

### Request Flow

Client
↓
Controller/Resolver
↓ [requestId injected]
Interceptor (logging & tracing)
↓
Service
↓
Prisma / External Service
↓
Cache / Resilient HTTP Client
↓
Response (with requestId)

---

# 🧩 Resilience & Orchestration

### 1. **Timeouts**

Every downstream HTTP call enforces a strict timeout:

```ts
axios.get(url, { timeout: TIMEOUT_MS });
Prevents request starvation and blocked event loop.
```

2. Retries with Exponential Backoff

BASE_BACKOFF_MS * 2 ** attempt;
Retry only when meaningful:

network errors

5xx responses

timeouts

3. Circuit Breaker
Three states:

CLOSED → normal

OPEN → short-circuit calls

HALF_OPEN → trial request

Per-service breaker:

nginx
Copiar código
coffees
beers
characters
Failures accumulate independently.

4. Partial Success in GraphQL
Even if one upstream dependency fails:

```graphql
{
  externalDashboard {
    coffees
    beers
    characters
    errors { service message }
  }
}
```

Client gets usable data + error metadata.

5. Concurrent Aggregation
ts
Copiar código
const [coffees, beers, characters] = await Promise.all([
  this.fetchCoffees(),
  this.fetchBeers(),
  this.fetchCharacters(),
]);
Critical performance improvement.

🧰 Caching Layer
In-memory + Redis
CacheService exposes:

```ts
get(key)
set(key, value, ttl)
delete(key)
clear()
Redis version automatically chosen if configured:
```

```ini
REDIS_URL=redis://localhost:6379
TTL-based invalidation for:
```
```kotlin
external:coffees
external:beers
external:characters
```

🔎 Logging & Tracing
requestId Propagation
Every request gets a unique requestId, injected via AsyncLocalStorage.

This ID appears in:

incoming HTTP logs
incoming GraphQL logs
external API calls
cache hits/misses
circuit breaker logs
Downstream Logging
Example log:

```ini
[coffees] reqId=abcd1234 attempt 1/3 GET https://...
Perfect for debugging concurrency under load.
```

📡 API Overview
REST Endpoints
Auth
bash
Copiar código
POST /auth/login
GET  /me
Projects
bash
Copiar código
POST /projects
GET  /projects
GET  /projects/:id
PATCH /projects/:id
DELETE /projects/:id
Tasks
bash
Copiar código
POST /tasks
GET  /tasks?projectId=1
PATCH /tasks/:id
DELETE /tasks/:id
GraphQL Schema
Key queries:

```graphql
query {
  meWorkspace {
    user { id email }
    projects { id name }
    tasks { id title }
  }

  externalDashboard {
    coffees { id title }
    beers { id name style }
    characters { id name species }
    errors { service message }
  }
}
```

🐳 Running the Project
1. Start Postgres + Redis
bash
Copiar código
docker-compose up -d
2. Prisma
bash
Copiar código
npx prisma generate
npx prisma migrate dev
3. Start backend
bash
Copiar código
npm run start:dev
4. GraphQL Playground

```bash
http://localhost:3000/graphql
```
🧑‍💻 Development Guide
Recommended flow
Make changes in modules

Keep services stateless

Don't put logic in controllers/resolvers

Use DTOs & validation

Add tracing to new services automatically

🔮 Future Work (Phase 3)
(This will likely live in a separate repo.)

WebSocket Gateway

Realtime chat per project

Task update events

Room management

Reconnection logic

Rate limiting & spam protection

Distributed events (Redis Pub/Sub or Kafka)

🧠 Why This Project Matters
This backend is intentionally built to resemble backend systems in FAANG-level companies:

high observability

resiliency

modular domain layers

hybrid API (REST + GraphQL)

caching

safe concurrent orchestration

It shows that you understand not just how to code, but how to design systems.

📄 License
MIT