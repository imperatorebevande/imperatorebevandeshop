# 🚀 Guida al Deploy - Imperatore Bevande Shop

## ✅ Preparazione Completata

L'applicazione è già stata configurata per la produzione con:

- ✅ **PayPal**: Configurato per usare variabili d'ambiente
- ✅ **Stripe**: Configurato per usare variabili d'ambiente  
- ✅ **WooCommerce**: Configurato per usare variabili d'ambiente
- ✅ **Build ottimizzata**: Configurazione Vite ottimizzata per produzione
- ✅ **Vercel ready**: File `vercel.json` configurato con cache headers

## 🔧 Passaggi per il Deploy

### 1. Ottieni le Credenziali di Produzione

#### PayPal Live
1. Vai su [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Crea un'app per l'ambiente **LIVE** (non Sandbox)
3. Copia il **Client ID** (non inizia con "SB-")

#### Stripe Live
1. Vai su [Stripe Dashboard](https://dashboard.stripe.com/)
2. Passa all'ambiente **Live** (non Test)
3. Vai su **Developers > API keys**
4. Copia la **Publishable key** (`pk_live_...`)

#### WooCommerce
✅ **Già configurato**: Le credenziali WooCommerce sono già integrate nel codice
Non è necessaria alcuna configurazione aggiuntiva

### 2. Deploy su Vercel (Raccomandato)

#### Opzione A: Deploy da GitHub
1. Pusha il codice su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Importa il repository
4. Configura le variabili d'ambiente:

```bash
VITE_PAYPAL_CLIENT_ID=your_live_paypal_client_id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

#### Opzione B: Deploy da CLI
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura le variabili d'ambiente
vercel env add VITE_PAYPAL_CLIENT_ID
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
```

### 3. Deploy su Netlify

1. Vai su [netlify.com](https://netlify.com)
2. Drag & drop la cartella `dist` dopo aver fatto `npm run build`
3. Oppure connetti il repository GitHub
4. Configura le variabili d'ambiente nel pannello Netlify

### 4. Altri Provider

#### DigitalOcean App Platform
```bash
# Build command
npm run build

# Output directory
dist
```

#### AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload dist/ su S3
# Configura CloudFront per SPA
```

## 🧪 Test Post-Deploy

### Checklist di Verifica
- [ ] **Sito accessibile**: L'URL di produzione funziona
- [ ] **PayPal Live**: Test con piccolo importo (€1-2)
- [ ] **Stripe Live**: Test con carta reale
- [ ] **Ordini WooCommerce**: Verificati nel backend WordPress
- [ ] **Email conferma**: Ricevute correttamente
- [ ] **Performance**: Sito veloce e responsive
- [ ] **Console errors**: Nessun errore JavaScript

### Test di Pagamento
```bash
# PayPal: Usa il tuo account PayPal reale
# Stripe: Usa una carta reale con piccolo importo

# Carte di test Stripe (solo per verificare integrazione):
# 4242424242424242 (Visa)
# 5555555555554444 (Mastercard)
```

## 🔒 Sicurezza

### ✅ Già Implementato
- Variabili d'ambiente per credenziali sensibili
- Nessuna chiave segreta esposta nel frontend
- HTTPS obbligatorio per pagamenti
- Validazione lato client e server

### 📊 Monitoraggio
- **PayPal**: [Dashboard PayPal](https://www.paypal.com/merchantapps/)
- **Stripe**: [Dashboard Stripe](https://dashboard.stripe.com/)
- **WooCommerce**: Backend WordPress per ordini

## 🆘 Troubleshooting

### Errori Comuni

#### PayPal non funziona
```bash
# Verifica che il Client ID sia LIVE (non inizia con SB-)
# Controlla la console per errori JavaScript
```

#### Stripe non funziona
```bash
# Verifica che la key sia pk_live_... (non pk_test_...)
# Controlla che HTTPS sia attivo
```

#### WooCommerce non risponde
```bash
# WooCommerce è già configurato con credenziali integrate
# Verifica che le API REST siano abilitate in WordPress
# Controlla la connessione di rete
```

## 📞 Supporto

- **PayPal**: [developer.paypal.com/support](https://developer.paypal.com/support/)
- **Stripe**: [support.stripe.com](https://support.stripe.com/)
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Netlify**: [netlify.com/support](https://netlify.com/support)

---

## 🎉 Congratulazioni!

Se hai seguito tutti i passaggi, la tua applicazione è ora live in produzione! 🚀

**Ricorda**: Monitora i primi giorni per assicurarti che tutto funzioni correttamente.