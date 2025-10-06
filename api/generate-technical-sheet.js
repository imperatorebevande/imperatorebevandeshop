export default async function handler(req, res) {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const { productName, productDescription, productCategory } = req.body;

    if (!productName || !productDescription) {
      return res.status(400).json({ 
        error: 'Nome prodotto e descrizione sono obbligatori' 
      });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ 
        error: 'Chiave API OpenAI non configurata' 
      });
    }

    // Verifica se è un'acqua minerale per utilizzare il prompt specifico
    const isWater = productCategory && productCategory.toLowerCase().includes('acqua');
    
    const prompt = isWater ? `
Agisci come esperto di acque minerali e nutrizione sportiva. Lingua: italiano, tono chiaro e conciso.

OBIETTIVO
Dato il nome di un'acqua minerale "${productName}", genera una scheda tecnica standardizzata.

STRUTTURA OBBLIGATORIA
## 💧 ${productName}
**Tipo:** (oligominerale/mediominerale/effervescente naturale, ecc.)
**pH:** …
**Residuo fisso a 180 °C:** … mg/L

### 🧪 Composizione chimico-fisica (mg/L)
| Componente | Quantità | Note |
|---|---:|---|
| Calcio (Ca²⁺) | … | … |
| Magnesio (Mg²⁺) | … | … |
| Sodio (Na⁺) | … | … |
| Potassio (K⁺) | … | … |
| Bicarbonato (HCO₃⁻) | … | … |
| Cloruri (Cl⁻) | … | … |
| Solfati (SO₄²⁻) | … | … |
| Nitrati (NO₃⁻) | … | … |
| Fluoruri (F⁻) | … | … |
Se un valore non è disponibile, scrivi "n.d." (non lasciare celle vuote).
⚠️ Non riportare mai fonti o link nelle note. Le note devono contenere solo indicazioni semplici (es. "basso contenuto di sodio", "dato non disponibile", "quantità minima", ecc.).

### ✅ Benefici e indicazioni
- Rilevanza per sportivi (reintegro sali, crampi, digestione, sudorazione, ecc.)
- Vantaggi/limiti (es. sodio basso/alto; residuo fisso alto/medio/basso; tollerabilità dell'effervescenza).
- Suggerisci quando abbinarla a bevande isotoniche/elettroliti per sforzi prolungati.

STILE
- Risposte brevi ma complete.
- Tabella sempre presente.
- Nessun riferimento a fonti esterne, etichette o siti web.

Converti questa scheda tecnica in formato JSON con la seguente struttura:
{
  "technicalSpecs": {
    "category": "tipo di acqua (oligominerale/mediominerale/etc)",
    "ph": "valore pH",
    "fixedResidue": "residuo fisso in mg/L",
    "calcium": "calcio in mg/L",
    "magnesium": "magnesio in mg/L",
    "sodium": "sodio in mg/L",
    "potassium": "potassio in mg/L",
    "bicarbonate": "bicarbonato in mg/L",
    "chlorides": "cloruri in mg/L",
    "sulfates": "solfati in mg/L",
    "nitrates": "nitrati in mg/L",
    "fluorides": "fluoruri in mg/L"
  },
  "benefits": {
    "healthBenefits": ["beneficio per la salute 1", "beneficio per la salute 2"],
    "nutritionalInfo": ["info nutrizionale 1", "info nutrizionale 2"],
    "recommendations": ["raccomandazione per sportivi 1", "raccomandazione per sportivi 2"]
  },
  "pairingsSuggestions": ["suggerimento abbinamento 1", "suggerimento abbinamento 2"],
  "description": "descrizione dettagliata con focus sui benefici per sportivi e caratteristiche dell'acqua"
}

Rispondi SOLO con il JSON, senza testo aggiuntivo.` : `
Analizza il seguente prodotto e genera una scheda tecnica completa in formato JSON:

Nome prodotto: ${productName}
Descrizione: ${productDescription}
Categoria: ${productCategory || 'Non specificata'}

Genera una risposta in formato JSON con la seguente struttura:
{
  "technicalSpecs": {
    "category": "categoria del prodotto",
    "ingredients": "ingredienti principali (se applicabile)",
    "alcoholContent": "gradazione alcolica (se applicabile)",
    "volume": "volume/formato (se specificato)",
    "producer": "produttore (se specificato)",
    "vintage": "annata (se applicabile)",
    "servingTemperature": "temperatura di servizio consigliata",
    "storageConditions": "condizioni di conservazione",
    "fixedResidue": "residuo fisso per acque (mg/L)"
  },
  "benefits": {
    "healthBenefits": ["beneficio 1", "beneficio 2", "beneficio 3"],
    "nutritionalInfo": ["info nutrizionale 1", "info nutrizionale 2"],
    "recommendations": ["raccomandazione 1", "raccomandazione 2"]
  },
  "pairingsSuggestions": ["abbinamento 1", "abbinamento 2", "abbinamento 3"],
  "description": "descrizione dettagliata e professionale del prodotto con focus sui suoi punti di forza"
}

Rispondi SOLO con il JSON, senza testo aggiuntivo. Assicurati che tutte le informazioni siano accurate e professionali, adatte per un e-commerce di bevande di qualità.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sei un esperto sommelier e consulente per bevande di qualità. Genera schede tecniche professionali e accurate per prodotti di bevande.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Errore OpenAI API:', response.status, errorData);
      
      if (response.status === 401) {
        return res.status(500).json({ error: 'Chiave API OpenAI non valida' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Limite di richieste raggiunto. Riprova più tardi' });
      }
      
      return res.status(500).json({ error: 'Errore nella chiamata a OpenAI' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'Risposta vuota da OpenAI' });
    }

    // Pulisci la risposta da eventuali caratteri extra
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    
    try {
      const technicalSheet = JSON.parse(cleanedContent);
      
      // Validazione e sanitizzazione dei dati
      const validatedSheet = {
        technicalSpecs: {
          category: technicalSheet.technicalSpecs?.category || 'Non specificato',
          ingredients: technicalSheet.technicalSpecs?.ingredients,
          alcoholContent: technicalSheet.technicalSpecs?.alcoholContent,
          volume: technicalSheet.technicalSpecs?.volume,
          origin: technicalSheet.technicalSpecs?.origin,
          producer: technicalSheet.technicalSpecs?.producer,
          vintage: technicalSheet.technicalSpecs?.vintage,
          servingTemperature: technicalSheet.technicalSpecs?.servingTemperature,
          storageConditions: technicalSheet.technicalSpecs?.storageConditions,
          fixedResidue: technicalSheet.technicalSpecs?.fixedResidue,
          // Campi specifici per acque minerali
          ph: technicalSheet.technicalSpecs?.ph,
          calcium: technicalSheet.technicalSpecs?.calcium,
          magnesium: technicalSheet.technicalSpecs?.magnesium,
          sodium: technicalSheet.technicalSpecs?.sodium,
          potassium: technicalSheet.technicalSpecs?.potassium,
          bicarbonate: technicalSheet.technicalSpecs?.bicarbonate,
          chlorides: technicalSheet.technicalSpecs?.chlorides,
          sulfates: technicalSheet.technicalSpecs?.sulfates,
          nitrates: technicalSheet.technicalSpecs?.nitrates,
          fluorides: technicalSheet.technicalSpecs?.fluorides
        },
        benefits: {
          healthBenefits: Array.isArray(technicalSheet.benefits?.healthBenefits) ? technicalSheet.benefits.healthBenefits : [],
          nutritionalInfo: Array.isArray(technicalSheet.benefits?.nutritionalInfo) ? technicalSheet.benefits.nutritionalInfo : [],
          recommendations: Array.isArray(technicalSheet.benefits?.recommendations) ? technicalSheet.benefits.recommendations : []
        },
        pairingsSuggestions: Array.isArray(technicalSheet.pairingsSuggestions) ? technicalSheet.pairingsSuggestions : [],
        description: technicalSheet.description || 'Descrizione non disponibile'
      };

      res.status(200).json({
        success: true,
        data: validatedSheet
      });

    } catch (parseError) {
      console.error('Errore nel parsing JSON:', parseError);
      return res.status(500).json({ error: 'Formato risposta non valido da OpenAI' });
    }

  } catch (error) {
    console.error('Errore generale:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}