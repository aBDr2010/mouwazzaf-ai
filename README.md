# Mouwazzaf AI — خلي الـAI يخدم مكانك

**Mouwazzaf AI** est une plateforme demo d'employé AI pour les entreprises algériennes. Le premier demo est un **AI Receptionist / Vendeur** qui parle en **Darija algérienne**, cherche les produits, et enregistre les commandes — prêt à être connecté à **n8n**, WhatsApp, Telegram, Google Sheets.

> Tagline: **"خلي الـAI يخدم مكانك"**

![Demo](https://img.shields.io/badge/status-DEMO-amber) ![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20Supabase-black)

---

## ✨ Features

- **Landing page** moderne (SaaS, clair, vert subtil)
- **Setup business** : crée ton magasin fictif, catégorie, ville, horaires, livraison
- **Demo Chat** : chat temps réel avec AI (Darija), outils réels
- **Outils AI** : `search_products`, `get_product`, `get_business_info`, `create_customer`, `create_order`
- **Commande complète** : collecte nom/téléphone/wilaya/commune → création commande
- **Activity feed** temps réel (DB-backed)
- **Dashboard** : stats, commandes, clients, produits
- **REST API v1** complet + webhooks n8n bidirectionnels
- **AI abstrait** : OpenAI-compatible / Ollama / Mock (fallback local sans clé)
- **Supabase** + fallback mémoire (demo immédiate sans DB)
- **Intégrations page** : tester n8n webhook
- **Mobile-first** + RTL arabe

---

## 🏗 Architecture

```
mouwazzaf-ai/
  client/   React + Vite + Tailwind + React Router
  server/   Express + TypeScript + Zod + Supabase
  shared/   Types
  docs/     API.md, N8N.md, DATABASE.md, SETUP.md
```

**Flux:**

```
Frontend -> POST /api/v1/chat -> ChatService -> AI Provider (Ollama/OpenAI/Mock)
                                      -> Tools (DB) -> Réponse Darija
                                      -> Activity + Webhook n8n

n8n: WhatsApp -> n8n Webhook -> POST /api/v1/webhooks/n8n/incoming -> AI -> reply -> n8n -> WhatsApp
```

**AI Provider interface:**
```ts
interface AIProvider { generateResponse(input: AIRequest): Promise<AIResponse> }
```
Implémentations: `OllamaProvider`, `OpenAICompatibleProvider`, `MockProvider`

---

## 🚀 Installation

### 1. Prérequis
Node 18+, npm

### 2. Installer
```bash
npm install --workspace=server
npm install --workspace=client
```

### 3. Env
```bash
cp .env.example .env
cp .env server/.env
# Edite .env — pour demo locale minimale:
# DISABLE_AUTH=true et AI_PROVIDER=mock suffisent
```

### 4. (Optionnel) Supabase
- Crée projet sur supabase.com
- SQL Editor -> colle `server/src/database/migration.sql` -> Run
- Mets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
- Sinon : in-memory (BladiPhone pré-seedé)

### 5. (Optionnel) Ollama
```bash
# https://ollama.com
ollama pull llama3.1
ollama serve
# .env: AI_PROVIDER=ollama, OLLAMA_MODEL=llama3.1
```

### 6. Lancer
```bash
# Terminal 1
cd server && npm run dev   # http://localhost:3000

# Terminal 2
cd client && npm run dev   # http://localhost:5173
```

Ouvre `http://localhost:5173` -> "جرّب موظفك AI" -> Setup -> Demo

---

## 🔑 Environment Variables

```
PORT=3000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_KEY=mouwazzaf-demo-key
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
AI_PROVIDER=ollama        # ollama | openai | mock
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
DISABLE_AUTH=true
```

---

## 🗄 Supabase SQL

Fichier: `server/src/database/migration.sql`

Tables: `businesses`, `products`, `customers`, `orders`, `conversations`, `activities`

Seed: BladiPhone + 4 produits (iPhone 13 78k DZD, Galaxy A56 52k, Redmi Note 14 32k, Tecno Spark 40 22k)

Voir `docs/DATABASE.md`

---

## 📡 API

Base: `http://localhost:3000/api/v1`

Auth: `Authorization: Bearer API_KEY` ou `X-API-Key` (désactivé si `DISABLE_AUTH=true`)

| Method | URL | Description |
|---|---|---|
| GET | /health | health |
| POST | /businesses | create |
| GET | /businesses/:id | get |
| GET | /businesses/:id/products | list |
| POST | /businesses/:id/products | create |
| PATCH | /products/:id | update |
| DELETE | /products/:id | delete |
| POST | /chat | chat |
| GET | /conversations/:sessionId | history |
| GET | /businesses/:id/orders | orders |
| POST | /orders | create |
| GET | /orders/:id | get |
| PATCH | /orders/:id | update |
| POST | /customers | create |
| GET | /businesses/:id/customers | list |
| POST | /webhooks/n8n/incoming | n8n inbound |
| POST | /webhooks/n8n/test | send test |
| GET | /webhooks/n8n/status | status |

Voir `docs/API.md` pour curl examples.

---

## 🔗 n8n

Voir `docs/N8N.md`

Inbound: `POST /api/v1/webhooks/n8n/incoming`  
Outbound: `POST {N8N_WEBHOOK_URL}` on `order_created`, `customer_created`, etc.

Workflows exemples:
1. Webhook -> Mouwazzaf -> Respond
2. Order Created -> Telegram + Sheets
3. WhatsApp -> n8n -> Mouwazzaf -> WhatsApp Reply
4. Instagram -> AI -> Order -> Notify

Teste via `/integrations` -> "إرسال حدث تجريبي"

---

## 💬 Demo Conversation

```
Customer: سلام، عندكم iPhone 13؟
AI: سلام، إي نعم متوفر. تحب تعرف السعر؟
Customer: شحال؟
AI: السعر 78 ألف دج.
Customer: نحب واحد.
AI: أكيد. عطيني اسمك برك.
Customer: محمد
AI: رقم الهاتف؟
Customer: 0550000000
AI: الولاية؟
Customer: البليدة
AI: والبلدية؟
Customer: البليدة
AI: تمام، سجلتلك الطلب ✅
-> Order créé, Activity, Webhook, Dashboard update
```

Supporte Darija: "نحب واحد", "ديرلي الطلب", "زوج ملاين", etc.  
Parser prix: "مليون"=10k, "زوج ملاين"=20k, "مليون ونص"=15k (via `priceParser.ts`)

---

## ✅ Vérification

```bash
cd server && npm run build   # tsc
cd client && npm run build   # vite build
```

APIs testées: health, businesses, chat, products, orders, webhooks  
Demo flow complet vérifié en local (mémoire fallback, mock AI).

---

## ⚠️ Limitations MVP

- Pas de paiement / abonnement / teams
- Auth simple (API key) — pas de JWT
- RLS désactivé (à activer en prod)
- Stock décrémenté naïvement
- Pas de pagination
- AI mock si Ollama/OpenAI non configuré (déterministe mais limité)

---

## 📄 License

MVP demo — libre pour test local.

---

**Made for Algerian businesses 🇩🇿 — Darija first, real tools, real orders, n8n-ready.**
