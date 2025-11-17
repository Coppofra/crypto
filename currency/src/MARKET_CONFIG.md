# Market Configuration

## 🔒 Protezione della Configurazione API

Il file `market.ts` contiene la configurazione sensibile dell'applicazione, inclusi gli endpoint API e le chiavi di accesso. Questo file è **escluso dal repository** tramite `.gitignore` per proteggere le informazioni sensibili.

## ⚙️ Setup

1. **Copia il template:**
   ```bash
   cp src/market.ts.template src/market.ts
   ```

2. **Configura i tuoi endpoint:**
   Modifica `src/market.ts` con le tue impostazioni:
   ```typescript
   export const MarketConfig = {
     endpoints: {
       base: 'http://localhost:3000', // URL del tuo server API
       list: '/currency/list',
       detail: '/currency',
       health: '/health'
     },
     // ... altre configurazioni
   };
   ```

## 🛡️ Sicurezza

- ✅ Il file `src/market.ts` è ignorato da Git
- ✅ Le configurazioni sensibili non vengono committate
- ✅ Ogni sviluppatore può avere la propria configurazione locale
- ✅ Le chiamate API sono nascoste nel codice compilato

## 📋 Configurazioni Disponibili

### Endpoints API
- `base`: URL base del server API
- `list`: Endpoint per la lista delle valute
- `detail`: Endpoint per i dettagli di una valuta
- `health`: Endpoint per health check

### Settings
- `refreshInterval`: Intervallo di aggiornamento automatico (ms)
- `maxRetries`: Numero massimo di tentativi in caso di errore
- `timeout`: Timeout per le richieste (ms)
- `format`: Formato risposta (json, xml, csv)

### Feature Flags
- `useLocalAPI`: Usa il server locale invece dell'API esterna
- `enableCache`: Abilita il caching delle risposte
- `enablePolling`: Abilita l'aggiornamento automatico
- `showDebugInfo`: Mostra informazioni di debug

## 🔄 Fallback

Se il server locale non è disponibile, l'applicazione passa automaticamente all'API esterna di CoinGecko come fallback.

## 📝 Note per il Team

- **Non committare mai** `src/market.ts`
- Usa `src/market.ts.template` come riferimento
- Ogni ambiente (dev, staging, prod) può avere configurazioni diverse
- Per produzione, considera l'uso di variabili d'ambiente
