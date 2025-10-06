# ✅ Checklist per la Messa in Produzione

## Prima del Deploy

### 🔐 Configurazione Credenziali

- [ ] **PayPal**: Ottenuto Client ID di produzione (inizia senza `SB-`)
- [ ] **Stripe**: Ottenuto Publishable Key di produzione (`pk_live_...`)
- [ ] **Stripe**: Ottenuto Secret Key di produzione (`sk_live_...`)
- [ ] **File `.env.local` creato** con tutte le variabili necessarie
- [ ] **Verificato che `.env.local` sia nel `.gitignore`**

### 🧪 Test in Ambiente Sandbox

- [ ] **PayPal Sandbox**: Pagamenti funzionanti
- [ ] **Stripe Test**: Pagamenti funzionanti
- [ ] **Ordini WooCommerce**: Creazione corretta
- [ ] **Email di conferma**: Inviate correttamente
- [ ] **WhatsApp**: Notifiche inviate (se configurato)

### 🔧 Modifiche al Codice

- [ ] **StripeCheckout.tsx**: Aggiornato per usare variabile d'ambiente
- [ ] **PayPalNativeCheckout.tsx**: Già configurato per variabile d'ambiente
- [ ] **Build del progetto**: `npm run build` completato senza errori
- [ ] **Test locale**: Applicazione funziona con `npm run preview`

## Durante il Deploy

### 🚀 Configurazione Hosting

- [ ] **Variabili d'ambiente configurate** nel pannello hosting:
  - `VITE_PAYPAL_CLIENT_ID`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `VITE_WOOCOMMERCE_URL`
  - `VITE_WOOCOMMERCE_CONSUMER_KEY`
  - `VITE_WOOCOMMERCE_CONSUMER_SECRET`

- [ ] **Deploy completato** senza errori
- [ ] **URL di produzione** accessibile

### 🔗 Configurazione Webhook (Opzionale)

- [ ] **Stripe Webhook**: Configurato per dominio di produzione
- [ ] **Endpoint webhook**: `/api/webhook` funzionante
- [ ] **Eventi selezionati**: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] **Signing secret**: Configurato nel backend

## Dopo il Deploy

### 🧪 Test di Produzione

- [ ] **PayPal Live**: Test con piccolo importo (€1-2)
- [ ] **Stripe Live**: Test con carta reale
- [ ] **Ordine creato**: Verificato in WooCommerce
- [ ] **Email ricevuta**: Conferma ordine arrivata
- [ ] **WhatsApp ricevuto**: Notifica arrivata (se configurato)

### 📊 Monitoraggio

- [ ] **Dashboard PayPal**: Accesso configurato
- [ ] **Dashboard Stripe**: Accesso configurato
- [ ] **Notifiche errori**: Configurate (email/Slack)
- [ ] **Backup database**: Programmato

### 🔒 Sicurezza

- [ ] **HTTPS**: Certificato SSL attivo
- [ ] **Chiavi segrete**: Non esposte nel codice frontend
- [ ] **CORS**: Configurato correttamente
- [ ] **Rate limiting**: Attivo (se necessario)

## 📋 Informazioni di Emergenza

### Contatti Supporto
- **PayPal**: [developer.paypal.com/support](https://developer.paypal.com/support/)
- **Stripe**: [support.stripe.com](https://support.stripe.com/)
- **WooCommerce**: [woocommerce.com/support](https://woocommerce.com/support/)

### Rollback Plan
- [ ] **Backup pre-deploy**: Creato
- [ ] **Procedura rollback**: Documentata
- [ ] **Chiavi sandbox**: Mantenute per test rapidi

---

## 🎉 Congratulazioni!

Se hai completato tutti i punti della checklist, la tua applicazione è pronta per la produzione!

**Ricorda**: Monitora attentamente i primi giorni per assicurarti che tutto funzioni correttamente.