# Istruzioni per il Carousel di Immagini - AGGIORNATO

## Posizione del Carousel
Il carousel di immagini è stato posizionato nella homepage **sotto la sezione "Prodotti Più Acquistati"**.

## ✅ STATO ATTUALE
Il carousel è già configurato con **5 immagini** basate sulle foto che hai fornito:
1. **Magazzino con prodotti** - Ampia selezione di bevande
2. **Cassette di bevande** - Evian, Sant'Anna, Levissima, Dreher, Peroni
3. **Furgone di consegna** - Servizio di consegna a domicilio
4. **Scaffali del magazzino** - Organizzazione professionale
5. **Bevande nel furgone** - Trasporto refrigerato

## Come Sostituire i File Placeholder con le Tue Immagini Reali

### 1. Preparare le Immagini
- **Formato**: JPG/JPEG (perfetto per immagini da Instagram)
- **Dimensioni ottimali**: 1200x600 pixel (rapporto 2:1)
- **Peso file**: Massimo 500KB per immagine
- **Numero di immagini**: 5 immagini (già configurate)
- **Fonte**: Immagini scaricate da Instagram già ottimizzate

### 2. Sostituire i File Placeholder
**IMPORTANTE**: I file placeholder sono già stati creati nella cartella corretta.

**Percorso**: `public/carousel-images/`

**File da sostituire**:
1. `magazzino-prodotti.jpg` - Sostituisci con la foto del magazzino con prodotti
2. `cassette-bevande.jpg` - Sostituisci con la foto delle cassette di bevande
3. `furgone-consegna.jpg` - Sostituisci con la foto del furgone Imperatore Bevande
4. `magazzino-scaffali.jpg` - Sostituisci con la foto degli scaffali del magazzino
5. `bevande-furgone.jpg` - Sostituisci con la foto delle bevande nel furgone

**Come sostituire**:
1. Vai nella cartella `public/carousel-images/`
2. Sostituisci ogni file placeholder con la tua immagine reale
3. **Mantieni esattamente gli stessi nomi dei file**
4. Il sito si aggiornerà automaticamente

### 3. ✅ Codice Già Configurato
**NON È NECESSARIO MODIFICARE IL CODICE!**

Il carousel è già completamente configurato nel file `src/pages/Index.tsx` con:

```javascript
// Immagini del carousel di Imperatore Bevande
const carouselImages = [
  {
    id: 1,
    src: '/carousel-images/magazzino-prodotti.jpg',
    alt: 'Magazzino con prodotti',
    title: 'Il Nostro Magazzino',
    description: 'Ampia selezione di acqua, birra, vino e bevande delle migliori marche'
  },
  {
    id: 2,
    src: '/carousel-images/cassette-bevande.jpg',
    alt: 'Cassette di bevande',
    title: 'Prodotti di Qualità',
    description: 'Evian, Sant\'Anna, Levissima, Dreher, Peroni e tante altre marche premium'
  },
  {
    id: 3,
    src: '/carousel-images/furgone-consegna.jpg',
    alt: 'Furgone di consegna Imperatore Bevande',
    title: 'Consegna a Domicilio',
    description: 'Servizio di consegna rapido e affidabile in tutta Bari e provincia'
  },
  {
    id: 4,
    src: '/carousel-images/magazzino-scaffali.jpg',
    alt: 'Scaffali del magazzino',
    title: 'Organizzazione Professionale',
    description: 'Magazzino moderno e organizzato per garantire la freschezza dei prodotti'
  },
  {
    id: 5,
    src: '/carousel-images/bevande-furgone.jpg',
    alt: 'Bevande nel furgone',
    title: 'Sempre Freschi',
    description: 'Trasporto refrigerato per mantenere la qualità delle bevande'
  }
];
```

### 4. Personalizzare Titoli e Descrizioni
Per ogni immagine puoi modificare:
- **title**: Il titolo principale che appare sull'immagine
- **description**: La descrizione che appare sotto il titolo
- **alt**: Testo alternativo per l'accessibilità

### 5. Configurazioni Avanzate
Nel componente `ImageCarousel` puoi modificare:
- **autoPlayInterval**: Tempo tra le transizioni automatiche (default: 6000ms = 6 secondi)
- **autoPlay**: Attiva/disattiva la riproduzione automatica (default: true)
- **showDots**: Mostra/nascondi gli indicatori a punti (default: true)
- **showArrows**: Mostra/nascondi le frecce di navigazione (default: true)

## Caratteristiche del Carousel

✅ **Responsive**: Si adatta automaticamente a tutti i dispositivi
✅ **Touch-friendly**: Supporta swipe su dispositivi mobili
✅ **Accessibile**: Include etichette ARIA per screen reader
✅ **Auto-play intelligente**: Si ferma quando l'utente interagisce
✅ **Controlli intuitivi**: Frecce, punti e barra di progresso
✅ **Animazioni fluide**: Transizioni CSS3 ottimizzate

## ✅ Struttura File Attuale
```
public/
└── carousel-images/
    ├── magazzino-prodotti.jpg (SOSTITUISCI CON LA TUA IMMAGINE)
    ├── cassette-bevande.jpg (SOSTITUISCI CON LA TUA IMMAGINE)
    ├── furgone-consegna.jpg (SOSTITUISCI CON LA TUA IMMAGINE)
    ├── magazzino-scaffali.jpg (SOSTITUISCI CON LA TUA IMMAGINE)
    └── bevande-furgone.jpg (SOSTITUISCI CON LA TUA IMMAGINE)

src/
└── pages/
    └── Index.tsx (GIÀ CONFIGURATO - NON MODIFICARE)
```

## Note Importanti
- ✅ **TUTTO È GIÀ CONFIGURATO** - Devi solo sostituire i file immagine
- ✅ **Nessuna modifica al codice necessaria**
- ✅ **Il sito si aggiorna automaticamente** quando sostituisci le immagini
- ✅ **I nomi dei file sono già corretti** - mantienili identici
- ✅ **Ottimizzazione automatica** durante il build di produzione

## 🚀 Processo Semplificato per Immagini Instagram
1. **Vai in** `public/carousel-images/`
2. **Sostituisci** i 5 file placeholder con le tue immagini JPG da Instagram
3. **Mantieni** gli stessi nomi dei file (es: `magazzino-prodotti.jpg`)
4. **Fine!** Il carousel funzionerà automaticamente

💡 **Tip**: Le immagini da Instagram sono già nel formato giusto (JPG) e ottimizzate!

## Supporto
Se hai problemi:
1. Verifica che i nomi dei file siano identici
2. Controlla che le immagini siano in formato JPG/JPEG (standard Instagram)
3. Assicurati che siano nella cartella `public/carousel-images/`
4. Le immagini da Instagram sono già ottimizzate e compatibili
5. Mantieni le dimensioni originali se sono già buone