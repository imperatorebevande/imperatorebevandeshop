import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Clock, Truck, CreditCard, User, Droplets } from 'lucide-react';

const FAQ = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const faqCategories = [
    {
      id: 'orari-consegne',
      title: '🚚 Orari e Consegne',
      icon: <Truck className="w-6 h-6" />,
      questions: [
        {
          id: 'costi-consegna',
          question: '💰 Quali sono i costi consegna?',
          answer: (
            <div className="space-y-3">
              <p>✅ Non abbiamo nessun costo aggiuntivo! I prezzi che vedi esposti sono compresivi di <strong>TRASPORTO</strong> 🚛.</p>
              <p>🎯 Non avrai nessuna sorpresa finale sul <strong>PREZZO</strong>. Ti basterà semplicemente effettuare l'ordine e aspettare la consegna 📦.</p>
              <p className="text-green-600 font-medium">🎉 Anzi ti dico di più.. per poter provare il servizio avrai sul primo ordine uno sconto del 5% su tutto il catalogo! 🛍️✨</p>
            </div>
          )
        },
        {
          id: 'orari-consegna',
          question: '⏰ Quali sono gli orari di consegna?',
          answer: (
            <div className="space-y-3">
              <p>🌅 Le consegne iniziano dalle <strong>06.30</strong> della mattina per terminare alle <strong>16.30</strong> del pomeriggio 🌇.</p>
              <p>6.30 😱😱??? Si hai capito bene 😏. Ci sono <strong>CLIENTI</strong> che richiedono la consegna a quell'ora dato che vanno via molto presto e preferiscono togliersi questo fastidioso problema fin da subito 🏃‍♂️💨. Offrendoci alle volte anche un buon ☕️.</p>
              <p>💪 Per noi non ci sono assolutamente problemi. Siamo già operativi! Cerchiamo di andare incontro quanto più possibile alle esigenze dei nostri clienti 🤝❤️.</p>
            </div>
          )
        },
        {
          id: 'ordine-minimo',
          question: '📦 Bisogna effettuare un ordine minimo?',
          answer: (
            <div className="space-y-3">
              <p>🙅‍♂️ Non chiediamo a nessun Cliente di dover acquistare 10 confezioni di acqua 😆…</p>
              <p>😅 Ma dover consegnare una sola confezione, ci risulterebbe veramente impossibile 😔. Ecco perchè chiediamo di dover acquistare almeno <strong>2 confezioni</strong> con un importo pari o superiore a <strong>5,00€</strong> 🤗💧.</p>
            </div>
          )
        },
        {
          id: 'tempo-ordine',
          question: '⏱️ Quanto tempo prima bisogna effettuare l\'ordine?',
          answer: (
            <div className="space-y-3">
              <p>🎯 Essendo specializzati nella consegna di acqua, sono in grado di <strong>GARANTIRTI al 100%</strong> la consegna dell'ordine in sole <strong>24 ore</strong> ⚡.</p>
              <p className="text-blue-600 font-bold text-lg">📅 Ordina OGGI, consegnamo DOMANI 🚀</p>
            </div>
          )
        },
        {
          id: 'consegna-piano',
          question: '🏠 L\'ordine viene consegnato direttamente al piano?',
          answer: (
            <div className="space-y-3">
              <p>✅ Ovviamente! Il nostro servizio di consegna effettua la consegna fin su al piano <strong>senza nessun costo aggiuntivo</strong> 🆓. Non dovrete far nessuno sforzo 💪. Penseremo a tutto noi 😊!</p>
              <p className="text-amber-600">⚠️ Nei palazzi non muniti di ascensore sarà possibile effettuare la consegna fino al <strong>primo piano</strong> 🏢.</p>
            </div>
          )
        }
      ]
    },
    {
      id: 'acqua-vetro',
      title: '🍶 Acqua in vetro',
      icon: <Droplets className="w-6 h-6" />,
      questions: [
        {
          id: 'costi-cauzione',
          question: '💳 Ci sono costi di cauzione per le casse in vetro?',
          answer: (
            <div className="space-y-3">
              <p>💰 Solitamente i costi di cauzione di ogni singola cassa acquistata, è di 5,00€ ma per poter promuovere l'acqua nelle bottiglie di vetro abbiamo abbassato il costo a <strong>3,00€</strong> 🎉, lasciando al cliente la possibilità di provarla senza spendere cifre esorbitanti 💸.</p>
              <p>📋 Ovviamente vi verrà rilasciata una ricevuta che vi permetterà nel momento in cui decidiate di non voler acquistare più l'acqua nelle bottiglie di vetro, di ottenere il rimborso del costo cauzionale lasciato la prima volta 💰✅.</p>
            </div>
          )
        },
        {
          id: 'vuoto-rendere',
          question: '♻️ Come funziona il discorso del vuoto a "rendere"?',
          answer: (
            <div className="space-y-3">
              <p>🔄 Allora è tutto molto semplice! Quando un cliente effettua un'ordine gli verranno consegnate la casse di acqua nelle bott. di vetro e in automatico un nostro incaricato ritirerà le casse vuote 🔁.</p>
              <p className="text-green-600">🌱 L'obiettivo del "vuoto a rendere" è sensibilizzare i consumatori sull'importanza del riciclo e diminuire la produzione dei rifiuti 🌍💚.</p>
            </div>
          )
        }
      ]
    },
    {
      id: 'pagamento-account',
      title: '💳 Pagamento e Account',
      icon: <CreditCard className="w-6 h-6" />,
      questions: [
        {
          id: 'metodi-pagamento',
          question: '💰 Quali sono i metodi di pagamento?',
          answer: (
            <div className="space-y-3">
              <p>🎯 Al momento sono disponibili svariate modalità di pagamento per dare anche sotto questo punto di vista la comodità 😊.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>💵 Pagare al momento della consegna tramite <strong>contanti</strong></li>
                <li>💳 Pagare con <strong>carta di credito / Bancomat</strong> al momento della consegna attraverso il nostro pos mobile 📱</li>
                <li>🌐 Con la tua <strong>carta di credito / Bancomat</strong> direttamente dal nostro sito internet</li>
                <li>🅿️ Con il tuo account <strong>PayPal</strong></li>
                <li>🏦 Pagare direttamente effettuando un <strong>bonifico bancario</strong>. Le coordinate bancarie vi verranno inviate automaticamente scegliendolo come metodo di pagamento 📧</li>
                <li>📱 Utilizzare il più moderno e comodo <strong>Satispay</strong> tramite il tuo smartphone ⚡</li>
              </ul>
              <p className="text-blue-600">🤔 Ci sono altri metodo di pagamento 🤔🤔?? Non credo 🤣😂</p>
            </div>
          )
        },
        {
          id: 'modificare-indirizzo',
          question: '🏠 Modificare indirizzo di consegna',
          answer: (
            <div className="space-y-3">
              <p>📍 Per modificare l'indirizzo di consegna, ti basterà andare nella pagina del tuo <strong>Account</strong> 👤</p>
              <p>📝 e Seguire in ordine questi semplici passaggi:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>👆 Clicca su <strong>"IMPOSTAZIONI UTENTE"</strong></li>
                <li>🏠 Clicca su <strong>"MODIFICA INDIRIZZO"</strong></li>
                <li>✏️ Clicca su <strong>"MODIFICA"</strong></li>
              </ol>
              <p className="text-amber-600">💡 Se invece l'indirizzo di consegna è temporaneo e non vuoi modificarlo ogni volta, puoi scriverlo all'interno delle <strong>NOTE</strong> nel momento in cui effettuerai l'ORDINE per un indirizzo differente 📝✨</p>
            </div>
          )
        },
        {
          id: 'metodo-pagamento',
          question: '💳 Inserire o modificare Metodo di Pagamento',
          answer: (
            <div className="space-y-3">
              <p>🎉 Attraverso il nostro portale è finalmente possibile pagare con <strong>CARTA DI CREDITO / BANCOMAT</strong> 💳✨.</p>
              <p>⚙️ Se vuoi aggiungere o modificare il "Metodo di Pagamento" ti basterà andare nella pagina del tuo <strong>Account</strong> 👤</p>
              <p>📋 e Seguire in ordine questi semplici passaggi:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>💳 Clicca su <strong>"METODI DI PAGAMENTO"</strong></li>
                <li>➕ Clicca su <strong>"AGGIUNGI METODO DI PAGAMENTO"</strong></li>
              </ol>
              <p>📝 E inserisci a questo punto le informazioni necessarie per poter ottenere l'autorizzazione:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>🔢 Immettere le 16 cifre della carta di credito / Bancomat</li>
                <li>📅 Inserire la data di scadenza, riportata nella parte frontale della carta</li>
                <li>🔐 Immettere il codice di 3 cifre (CvC) posto nella parte posteriore della carta nel riquadro bianco</li>
              </ul>
              <p className="text-red-600 font-medium">⚠️ Prima di chiudere la pagina ricordati sempre di <strong>SALVARE LE MODIFICHE</strong> apportate 💾!</p>
            </div>
          )
        },
        {
          id: 'username-password',
          question: '👤 Modificare Username & Password',
          answer: (
            <div className="space-y-3">
              <p>🔧 Per modificare Username o la Password, ti basterà andare nella pagina del tuo <strong>Account</strong> 👤</p>
              <p>📝 e Seguire in ordine questi semplici passaggi:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>⚙️ Clicca su <strong>"IMPOSTAZIONI UTENTE"</strong></li>
                <li>🔑 Clicca su <strong>"MODIFICA USER & PASSWORD"</strong></li>
              </ol>
              <p>✏️ Effetua le modifiche nei campi stabiliti e infine per rendere effettive le modifiche, ricordati di cliccare su</p>
              <p className="text-green-600 font-medium">👉🏻 <strong>"SALVA LE MODIFICHE"</strong> 💾✅</p>
            </div>
          )
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-[#1B5AAB] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">❓ F.A.Q ❓</h1>
          <p className="text-xl md:text-2xl mb-6">🤔 Frequently Asked Questions 💭</p>
          <p className="text-lg max-w-4xl mx-auto">
            📝 Ovvero le domande che più ci vengono poste: alcune sono semplici curiosità 🧐, 
            mentre altre servono per alcuni dubbi che ci possono essere per i nuovi clienti 🆕.
          </p>
          <p className="text-lg mt-4">
            🗂️ Per una migliore navigazione, abbiamo diviso le domande per categorie 📋
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {faqCategories.map((category) => (
            <Card key={category.id} className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-3 text-2xl text-[#1B5AAB]">
                  {category.icon}
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {category.questions.map((faq) => (
                    <Collapsible
                      key={faq.id}
                      open={openItems.includes(faq.id)}
                      onOpenChange={() => toggleItem(faq.id)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {openItems.includes(faq.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="pt-4 text-gray-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-[#1B5AAB] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">🤷‍♂️ Non hai trovato la risposta che cercavi? 🔍</h2>
          <p className="text-lg mb-6">📞 Contattaci direttamente, saremo felici di aiutarti! 😊💙</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>🗓️ Lun-Ven: 6:30 - 16:30 ⏰</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>🚚 Consegne a Bari e dintorni 🏠</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;