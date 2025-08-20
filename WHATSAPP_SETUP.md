# Configurazione Sistema WhatsApp - Imperatore Bevande

Questo documento spiega come configurare il sistema di invio messaggi WhatsApp per il form di contatto.

## 🚨 Situazione Attuale

Il sistema è configurato per **inviare messaggi direttamente al numero WhatsApp 3402486783**. Il form di contatto aprirà WhatsApp con un messaggio precompilato indirizzato a questo numero.

## 📱 Come Funziona

### Sistema Semplificato (Attivo)
- Il form raccoglie i dati del cliente
- Crea un messaggio formattato con tutte le informazioni
- Apre WhatsApp (app o web) con il messaggio precompilato per il numero 3402486783
- L'utente deve solo premere "Invia" in WhatsApp
- **Non sono necessarie API o configurazioni complesse**

## ⚙️ Configurazione

### ✅ Sistema Già Configurato

Il sistema è **già completamente configurato** e funzionante! 

- **Numero di destinazione**: 3402486783
- **Nessuna configurazione aggiuntiva richiesta**
- **Nessuna API da configurare**

Il form di contatto aprirà automaticamente WhatsApp con il messaggio indirizzato al numero 3402486783.

### 🔧 Personalizzazione (Opzionale)

Se in futuro volessi cambiare il numero di destinazione, puoi modificare il file:
```
src/services/whatsappService.ts
```

Cerca la riga:
```typescript
businessNumber: '3402486783', // Numero WhatsApp diretto
```

E sostituisci con il nuovo numero desiderato.

## 🧪 Test del Sistema

1. **Riavvia il server di sviluppo**
   ```bash
   npm run dev
   ```

2. **Testa il form**
   - Vai sulla pagina Contatti
   - Compila tutti i campi
   - Clicca "Invia su WhatsApp"
   - Verifica che si apra WhatsApp con il messaggio

3. **Verifica il messaggio**
   Il messaggio dovrebbe contenere:
   - Nome del cliente
   - Email (se fornita)
   - Telefono
   - Oggetto
   - Messaggio
   - Data e ora
   - Fonte (Sito Web)

## 🎨 Personalizzazione Messaggio

Per modificare il formato del messaggio WhatsApp, modifica la funzione `formatWhatsAppMessage` in:
```
src/services/whatsappService.ts
```

Esempio di personalizzazione:
```typescript
const formatWhatsAppMessage = (data: WhatsAppFormData): string => {
  return `🍺 *NUOVO CONTATTO - Imperatore Bevande*\n\n` +
    `👤 *Nome:* ${data.name}\n` +
    `📧 *Email:* ${data.email}\n` +
    `📱 *Telefono:* ${data.phone}\n` +
    `📋 *Oggetto:* ${data.subject}\n\n` +
    `💬 *Messaggio:*\n${data.message}\n\n` +
    `---\n` +
    `📅 *Data:* ${new Date().toLocaleString('it-IT')}\n` +
    `🌐 *Fonte:* Sito Web - Form Contatti`;
};
```

## 🔧 Risoluzione Problemi

### WhatsApp non si apre
- Verifica che WhatsApp sia installato sul dispositivo
- Su desktop, assicurati che WhatsApp Web funzioni
- Controlla la console del browser per errori

### Messaggio non formattato correttamente
- Verifica la funzione `formatWhatsAppMessage`
- Controlla che i dati del form siano completi
- Testa con diversi browser

### API non funziona
- Verifica le credenziali API (Access Token, ecc.)
- Controlla i log del server
- Assicurati che l'endpoint `/api/send-whatsapp` sia accessibile

### Errori comuni
- **Numero non valido**: Verifica il formato del numero (senza + iniziale)
- **CORS Error**: Controlla la configurazione CORS nell'API
- **Token scaduto**: Rinnova l'Access Token di WhatsApp Business API

## 📊 Vantaggi del Sistema WhatsApp

- ✅ **Maggiore visibilità**: I messaggi WhatsApp hanno un tasso di apertura del 98%
- ⚡ **Risposta immediata**: Notifiche push istantanee
- 📱 **Facilità d'uso**: Interfaccia familiare per tutti gli utenti
- 🔒 **Sicurezza**: Crittografia end-to-end
- 🌍 **Universalità**: Disponibile su tutti i dispositivi
- 💰 **Gratuito**: Nessun costo per l'invio
- 🚀 **Velocità**: Consegna istantanea del messaggio
- 👥 **Engagement**: Maggiore probabilità di risposta
- 📞 **Multifunzione**: Possibilità di chiamate vocali/video immediate
- 🎯 **Diretto**: Comunicazione one-to-one senza filtri spam

## 📝 Note Importanti

- Il file `.env.local` non deve essere committato su Git
- Per la produzione, configura le variabili nel tuo hosting provider
- WhatsApp Business API ha limiti di messaggi gratuiti
- Testa sempre su diversi dispositivi (mobile/desktop)
- Mantieni aggiornato il numero WhatsApp Business

## 🆘 Supporto

Se hai problemi:
1. Controlla la console del browser per errori
2. Verifica che WhatsApp sia accessibile
3. Testa prima con la modalità base (URL)
4. Se necessario, contatta il supporto tecnico

---

**Configurazione completata!** 🎉

Il tuo form di contatto ora invia messaggi tramite WhatsApp per una comunicazione più diretta ed efficace con i clienti.