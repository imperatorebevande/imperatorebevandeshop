# Guida per la Messa in Produzione - PayPal e Stripe

Questa guida ti aiuterà a configurare correttamente PayPal e Stripe per l'ambiente di produzione.

## 🔧 Modifiche Necessarie

### 1. PayPal - Configurazione Produzione

#### Attualmente (Sviluppo):
- **Client ID**: `AYGtIXY3WWCFKCHrizRHKS0TOSWLD8ekRyb4ZHnE9WBNj1lennIFBLqRwIC9C-c0KP57tA2dXzWouLk_` (SANDBOX)
- **Ambiente**: Sandbox (test)

#### Da Modificare per Produzione:

1. **Crea un file `.env.local`** nella root del progetto:
```bash
# PayPal Production Configuration
VITE_PAYPAL_CLIENT_ID=your_production_paypal_client_id_here
```

2. **Ottieni le credenziali di produzione PayPal**:
   - Vai su [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Crea un'app per l'ambiente **LIVE** (non Sandbox)
   - Copia il **Client ID** di produzione
   - Sostituisci `your_production_paypal_client_id_here` con il tuo Client ID reale

3. **File da modificare**: `src/components/PayPalNativeCheckout.tsx`
   - Il codice è già configurato per leggere da `import.meta.env.VITE_PAYPAL_CLIENT_ID`
   - ✅ Nessuna modifica necessaria al codice

### 2. Stripe - Configurazione Produzione

#### Attualmente (Sviluppo):
- **Publishable Key**: `pk_test_q2T6zSXCsZgSDBoczp5ESl9I` (TEST)
- **Secret Key**: Configurata tramite `process.env.STRIPE_SECRET_KEY` (TEST)

#### Da Modificare per Produzione:

1. **Aggiorna il file `.env.local`**:
```bash
# PayPal Production Configuration
VITE_PAYPAL_CLIENT_ID=your_production_paypal_client_id_here

# Stripe Production Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key_here
```

2. **Ottieni le credenziali di produzione Stripe**:
   - Vai su [Stripe Dashboard](https://dashboard.stripe.com/)
   - Passa all'ambiente **Live** (non Test)
   - Vai su **Developers > API keys**
   - Copia la **Publishable key** (inizia con `pk_live_`)
   - Copia la **Secret key** (inizia con `sk_live_`)

3. **Modifica il file**: `src/components/StripeCheckout.tsx`
   - Sostituisci la riga 14:
   ```typescript
   // DA:
   const stripePromise = loadStripe('pk_test_q2T6zSXCsZgSDBoczp5ESl9I');
   
   // A:
   const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
   ```

4. **Configura il backend Stripe** (se usi il server personalizzato):
   - Nel file `stripe-backend/.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here
   ```

### 3. Configurazione Webhook (Opzionale ma Raccomandato)

#### Per Stripe:
1. Vai su **Stripe Dashboard > Developers > Webhooks**
2. Crea un nuovo endpoint per il tuo dominio di produzione
3. Seleziona gli eventi: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copia il **Signing secret** e aggiungilo a `.env`

#### Per PayPal:
- PayPal gestisce automaticamente le notifiche, non sono necessari webhook aggiuntivi

## 📁 Struttura File Finale

```
root/
├── .env.local (NUOVO - non committare su Git)
│   ├── VITE_PAYPAL_CLIENT_ID=pk_live_...
│   └── VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
├── stripe-backend/.env (se usi il server personalizzato)
│   ├── STRIPE_SECRET_KEY=sk_live_...
│   └── STRIPE_WEBHOOK_SECRET=whsec_...
└── src/components/StripeCheckout.tsx (MODIFICATO)
```

## ⚠️ Importante - Sicurezza

1. **Non committare mai le chiavi di produzione su Git**
   - Il file `.env.local` è già nel `.gitignore`
   - Le chiavi `sk_live_` sono segrete e non devono mai essere esposte

2. **Testa sempre in ambiente sandbox prima**
   - Verifica che tutti i pagamenti funzionino correttamente
   - Controlla che gli ordini vengano creati correttamente

3. **Monitora i pagamenti**
   - Controlla regolarmente i dashboard di PayPal e Stripe
   - Configura le notifiche per pagamenti falliti

## 🚀 Deploy

Dopo aver configurato tutto:

1. **Build del progetto**:
   ```bash
   npm run build
   ```

2. **Deploy su Vercel/Netlify**:
   - Configura le variabili d'ambiente nel pannello di controllo
   - `VITE_PAYPAL_CLIENT_ID`
   - `VITE_STRIPE_PUBLISHABLE_KEY`

3. **Testa i pagamenti**:
   - Effettua alcuni ordini di test con piccoli importi
   - Verifica che gli ordini arrivino correttamente

## 📞 Supporto

Se hai problemi:
- **PayPal**: [PayPal Developer Support](https://developer.paypal.com/support/)
- **Stripe**: [Stripe Support](https://support.stripe.com/)

---

**Nota**: Questa configurazione mantiene la compatibilità con WooCommerce e tutti i plugin di pagamento esistenti.