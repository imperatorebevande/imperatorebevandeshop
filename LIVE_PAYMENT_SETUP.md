# Configurazione Pagamenti Live - Imperatore Bevande

## ⚠️ IMPORTANTE - Ambiente di Produzione

Questo documento spiega come configurare i pagamenti per l'ambiente live di produzione.

## 🔧 Configurazione PayPal Live

### 1. Ottenere le Credenziali Live PayPal

1. Accedi al [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Vai su "My Apps & Credentials"
3. Seleziona la tab "Live" (non Sandbox)
4. Crea una nuova app o usa una esistente
5. Copia il **Client ID** dalla sezione "Live"

### 2. Aggiornare il File .env.local

Sostituisci `YOUR_LIVE_PAYPAL_CLIENT_ID_HERE` nel file `.env.local` con il tuo Client ID live:

```env
VITE_PAYPAL_CLIENT_ID=Il_Tuo_Client_ID_Live_PayPal
```

## 💳 Configurazione Stripe Live

### 1. Ottenere le Credenziali Live Stripe

1. Accedi al [Stripe Dashboard](https://dashboard.stripe.com/)
2. Assicurati di essere in modalità "Live" (non Test)
3. Vai su "Developers" > "API keys"
4. Copia la **Publishable key** (inizia con `pk_live_`)

### 2. Aggiornare il File .env.local

Sostituisci `pk_live_YOUR_LIVE_STRIPE_KEY_HERE` nel file `.env.local` con la tua Publishable Key live:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_La_Tua_Publishable_Key_Live
```

## 🚀 Deployment

### Variabili d'Ambiente per Vercel/Netlify

Quando fai il deploy, assicurati di configurare queste variabili d'ambiente:

- `VITE_PAYPAL_CLIENT_ID`: Il tuo Client ID live PayPal
- `VITE_STRIPE_PUBLISHABLE_KEY`: La tua Publishable Key live Stripe

## ✅ Verifica della Configurazione

1. **PayPal**: I pagamenti dovrebbero processare transazioni reali
2. **Stripe**: Le carte di credito dovrebbero essere caricate realmente
3. **Test**: Fai sempre un test con piccoli importi prima del lancio

## 🔒 Sicurezza

- ❌ **NON** committare mai le chiavi live su Git
- ✅ Usa sempre variabili d'ambiente per le credenziali
- ✅ Tieni le chiavi segrete al sicuro
- ✅ Monitora regolarmente le transazioni

## 📞 Supporto

Per problemi con:
- **PayPal**: Contatta il supporto PayPal Developer
- **Stripe**: Contatta il supporto Stripe
- **Applicazione**: Verifica i log del browser e del server

---

**⚠️ ATTENZIONE**: In ambiente live, tutti i pagamenti sono reali. Testa sempre con piccoli importi prima del lancio ufficiale.