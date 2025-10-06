# Guida al Deployment su Vercel - Pagamenti Stripe Reali

## 📋 Panoramica
Questa guida ti aiuterà a deployare il tuo sistema di pagamenti Stripe su Vercel, sia per il backend che per il frontend.

## 🚀 Deployment del Backend Stripe

### 1. Preparazione del Backend
Il backend è già configurato nella cartella `stripe-backend/` con:
- ✅ `vercel.json` configurato
- ✅ Server Express con endpoint Stripe
- ✅ Gestione CORS
- ✅ Webhook Stripe

### 2. Deploy del Backend su Vercel

#### Opzione A: Deploy tramite CLI Vercel
```bash
# Installa Vercel CLI se non l'hai già fatto
npm i -g vercel

# Naviga nella cartella del backend
cd stripe-backend

# Effettua il deploy
vercel

# Segui le istruzioni:
# - Set up and deploy? Y
# - Which scope? (seleziona il tuo account)
# - Link to existing project? N
# - What's your project's name? stripe-backend-imperatore
# - In which directory is your code located? ./
```

#### Opzione B: Deploy tramite Dashboard Vercel
1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa il repository GitHub
4. Configura:
   - **Root Directory**: `stripe-backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build` (se presente) o lascia vuoto
   - **Output Directory**: lascia vuoto
   - **Install Command**: `npm install`

### 3. Configurazione Variabili d'Ambiente su Vercel

#### Nel Dashboard Vercel:
1. Vai al progetto del backend
2. Settings → Environment Variables
3. Aggiungi le seguenti variabili:

```
STRIPE_SECRET_KEY=sk_live_TUA_CHIAVE_SEGRETA_LIVE
STRIPE_WEBHOOK_SECRET=whsec_TUO_WEBHOOK_SECRET
ALLOWED_ORIGINS=https://tuo-frontend.vercel.app,https://www.tuodominio.com
```

**⚠️ IMPORTANTE**: 
- Usa le chiavi **LIVE** di Stripe per produzione
- Ottieni il Webhook Secret dal Dashboard Stripe dopo aver configurato l'endpoint
- Aggiungi tutti i domini autorizzati in ALLOWED_ORIGINS

### 4. Configurazione Webhook Stripe
1. Vai su [Dashboard Stripe](https://dashboard.stripe.com)
2. Developers → Webhooks
3. "Add endpoint"
4. URL: `https://tuo-backend.vercel.app/api/webhook`
5. Eventi da ascoltare:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Copia il "Signing secret" e aggiungilo come `STRIPE_WEBHOOK_SECRET` su Vercel

## 🌐 Deployment del Frontend

### 1. Aggiorna l'URL del Backend
Nel file `.env.production`, aggiorna:
```
VITE_STRIPE_BACKEND_URL=https://tuo-backend.vercel.app
```

### 2. Deploy del Frontend su Vercel

#### Opzione A: CLI Vercel
```bash
# Dalla root del progetto
vercel

# Configura:
# - Root directory: ./
# - Framework: Vite
```

#### Opzione B: Dashboard Vercel
1. New Project
2. Importa repository
3. Configura:
   - **Root Directory**: `./` (root)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Variabili d'Ambiente Frontend
Nel Dashboard Vercel del frontend, aggiungi:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_TUA_CHIAVE_PUBBLICA_LIVE
VITE_STRIPE_BACKEND_URL=https://tuo-backend.vercel.app
```

## 🧪 Testing in Produzione

### 1. Test dei Pagamenti
1. Visita il tuo sito in produzione
2. Aggiungi prodotti al carrello
3. Procedi al checkout
4. Usa una carta di test Stripe:
   - **Successo**: `4242 4242 4242 4242`
   - **Fallimento**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`

### 2. Verifica Logs
- **Backend**: Dashboard Vercel → Functions → View Logs
- **Stripe**: Dashboard Stripe → Logs
- **Frontend**: Browser DevTools → Console

### 3. Test Webhook
1. Effettua un pagamento di test
2. Verifica nei logs di Vercel che il webhook sia stato ricevuto
3. Controlla nel Dashboard Stripe che l'evento sia stato processato

## 🔧 Troubleshooting

### Errori Comuni

#### 1. CORS Error
**Problema**: Errore CORS nel browser
**Soluzione**: Verifica che `ALLOWED_ORIGINS` nel backend includa l'URL del frontend

#### 2. Webhook Failed
**Problema**: Webhook non ricevuti
**Soluzione**: 
- Verifica l'URL del webhook su Stripe
- Controlla che `STRIPE_WEBHOOK_SECRET` sia corretto
- Verifica i logs del backend

#### 3. Payment Intent Failed
**Problema**: Errore nella creazione del Payment Intent
**Soluzione**:
- Verifica che `STRIPE_SECRET_KEY` sia la chiave live corretta
- Controlla i logs del backend per errori specifici

#### 4. Environment Variables
**Problema**: Variabili d'ambiente non caricate
**Soluzione**:
- Redeploy dopo aver aggiunto le variabili
- Verifica che i nomi siano corretti (case-sensitive)

## 📝 Checklist Pre-Deploy

### Backend
- [ ] `vercel.json` configurato
- [ ] Variabili d'ambiente aggiunte su Vercel
- [ ] Webhook configurato su Stripe
- [ ] CORS configurato correttamente

### Frontend
- [ ] `.env.production` aggiornato
- [ ] URL backend corretto
- [ ] Chiavi Stripe live configurate
- [ ] Build di produzione testata localmente

### Post-Deploy
- [ ] Test pagamenti con carte di test
- [ ] Verifica webhook funzionanti
- [ ] Test su diversi browser
- [ ] Verifica logs per errori

## 🔐 Sicurezza

### Best Practices
1. **Mai committare chiavi segrete** nel codice
2. **Usa sempre HTTPS** in produzione
3. **Valida sempre i webhook** con il signature secret
4. **Limita CORS** solo ai domini necessari
5. **Monitora i logs** per attività sospette

## 📞 Supporto

Se incontri problemi:
1. Controlla i logs di Vercel
2. Verifica la documentazione Stripe
3. Testa localmente prima del deploy
4. Usa le carte di test Stripe per il debugging

---

**🎉 Congratulazioni!** Il tuo sistema di pagamenti Stripe è ora live su Vercel!