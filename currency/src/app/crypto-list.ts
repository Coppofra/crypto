import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CryptoService } from './crypto.service';

@Component({
  selector: 'crypto-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container">
      <!-- Convertitore Valuta -->
      <div class="converter-section">
        <div class="converter-header">
          <h2>💱 Convertitore Crypto ⇄ Forex</h2>
          <div class="status-badge" [class.cached]="usingCachedData" [class.live]="!usingCachedData">
            <span *ngIf="!usingCachedData">🟢 Live</span>
            <span *ngIf="usingCachedData">📦 Cache</span>
            <span class="update-time" *ngIf="lastUpdateTime">{{ lastUpdateTime }}</span>
          </div>
        </div>
        <div class="converter-card">
          <div class="input-group">
            <label>Importo</label>
            <input 
              type="number" 
              [(ngModel)]="converterAmount" 
              placeholder="1.00"
              min="0"
              step="any"
            />
          </div>
          
          <div class="input-group">
            <label>Da</label>
            <select [(ngModel)]="selectedFrom">
              <option value="">-- Seleziona --</option>
              <optgroup label="Valute Forex">
                <option value="FOREX:USD">USD - Dollaro Americano</option>
                <option value="FOREX:EUR">EUR - Euro</option>
                <option value="FOREX:GBP">GBP - Sterlina</option>
                <option value="FOREX:JPY">JPY - Yen Giapponese</option>
                <option value="FOREX:CNY">CNY - Yuan Cinese</option>
                <option value="FOREX:CHF">CHF - Franco Svizzero</option>
                <option value="FOREX:AUD">AUD - Dollaro Australiano</option>
                <option value="FOREX:CAD">CAD - Dollaro Canadese</option>
              </optgroup>
              <optgroup label="Criptovalute">
                <option *ngFor="let s of symbols" [value]="'CRYPTO:' + s.id">
                  {{ s.display.split('/')[0] }} - {{ s.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="converter-arrow" (click)="swapCurrencies()" title="Inverti valute">
            <span class="arrow-icon">⇄</span>
          </div>

          <div class="input-group">
            <label>A</label>
            <select [(ngModel)]="selectedTo">
              <option value="">-- Seleziona --</option>
              <optgroup label="Criptovalute" *ngIf="selectedFrom.startsWith('FOREX:')">
                <option *ngFor="let s of symbols" [value]="'CRYPTO:' + s.id">
                  {{ s.display.split('/')[0] }} - {{ s.name }}
                </option>
              </optgroup>
              <optgroup label="Valute Forex" *ngIf="selectedFrom.startsWith('CRYPTO:')">
                <option value="FOREX:USD">USD - Dollaro Americano</option>
                <option value="FOREX:EUR">EUR - Euro</option>
                <option value="FOREX:GBP">GBP - Sterlina</option>
                <option value="FOREX:JPY">JPY - Yen Giapponese</option>
                <option value="FOREX:CNY">CNY - Yuan Cinese</option>
                <option value="FOREX:CHF">CHF - Franco Svizzero</option>
                <option value="FOREX:AUD">AUD - Dollaro Australiano</option>
                <option value="FOREX:CAD">CAD - Dollaro Canadese</option>
              </optgroup>
            </select>
          </div>

          <button class="convert-button" (click)="calculateConversion()" [disabled]="!selectedFrom || !selectedTo || !converterAmount">
            🔄 Converti
          </button>

          <div class="conversion-result" *ngIf="conversionResult !== null && selectedFrom && selectedTo">
            <div class="result-label">Risultato</div>
            <div class="result-value">
              {{ conversionResult | number:'1.2-8' }} {{ getDisplayName(selectedTo) }}
            </div>
            <div class="result-rate" *ngIf="exchangeRate">
              1 {{ getDisplayName(selectedFrom) }} = {{ exchangeRate | number:'1.2-8' }} {{ getDisplayName(selectedTo) }}
            </div>
          </div>
        </div>
      </div>

      <main>
        <div *ngIf="loading" class="loading">Caricamento...</div>

        <div class="grid">
          <a
            class="card"
            *ngFor="let s of symbols"
            [routerLink]="['/detail', s.symbolForRoute]"
          >
            <div class="card-header">
              <div class="symbol-badge">{{ s.display.split('/')[0] }}</div>
              <div class="change-badge" 
                   [class.positive]="getQuote(s)?.price_change_percentage_24h >= 0"
                   [class.negative]="getQuote(s)?.price_change_percentage_24h < 0">
                {{ getQuote(s)?.price_change_percentage_24h ? (getQuote(s)?.price_change_percentage_24h >= 0 ? '+' : '') + (getQuote(s)?.price_change_percentage_24h | number:'1.2-2') + '%' : '—' }}
              </div>
            </div>
            <div class="card-body">
              <div class="name">{{ s.name || s.display }}</div>
              <div class="pair">{{ s.pair }}</div>
              <div class="price-section">
                <div class="price-label">Prezzo</div>
                <div class="price">{{ getQuote(s)?.price ? '$' + (getQuote(s)?.price | number:'1.2-6') : '—' }}</div>
              </div>
              <div class="stats" *ngIf="getQuote(s)">
                <div class="stat-item" *ngIf="getQuote(s)?.high_24h">
                  <span class="stat-label">24h High</span>
                  <span class="stat-value">{{ getQuote(s)?.high_24h | number:'1.2-6' }}</span>
                </div>
                <div class="stat-item" *ngIf="getQuote(s)?.low_24h">
                  <span class="stat-label">24h Low</span>
                  <span class="stat-value">{{ getQuote(s)?.low_24h | number:'1.2-6' }}</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; padding:0; margin:0; font-family: Inter, system-ui, Arial; color:#0f172a; background:#f8fafc; min-height:100vh; }
    .container { max-width:1200px; margin:0 auto; padding:1rem; }
    
    /* Converter Section */
    .converter-section { margin-bottom:2rem; }
    .converter-section h2 { font-size:1.5rem; margin:0 0 1rem 0; color:#1e293b; }
    
    .converter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .status-badge.live {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-badge.cached {
      background: #fef3c7;
      color: #92400e;
    }
    
    .update-time {
      font-size: 0.75rem;
      opacity: 0.8;
    }
    
    .converter-card {
      background:#ffffff;
      border-radius:16px;
      padding:2rem;
      box-shadow:0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
      border:1px solid #e2e8f0;
      display:grid;
      grid-template-columns:1fr auto 1fr;
      gap:1.5rem;
      align-items:end;
    }
    
    .convert-button {
      grid-column: 1 / -1;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .convert-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .convert-button:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .convert-button:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }
    
    @media (max-width: 768px) {
      .converter-card {
        grid-template-columns:1fr;
      }
      .converter-arrow {
        transform:rotate(90deg);
        margin:0.5rem 0;
      }
    }
    
    .input-group {
      display:flex;
      flex-direction:column;
      gap:0.5rem;
    }
    
    .input-group label {
      font-size:0.875rem;
      font-weight:600;
      color:#475569;
      text-transform:uppercase;
      letter-spacing:0.5px;
    }
    
    .input-group input,
    .input-group select {
      padding:0.75rem 1rem;
      border:2px solid #e2e8f0;
      border-radius:8px;
      font-size:1rem;
      font-family:inherit;
      transition:all 0.2s;
      background:#ffffff;
    }
    
    .input-group input:focus,
    .input-group select:focus {
      outline:none;
      border-color:#6366f1;
      box-shadow:0 0 0 3px rgba(99,102,241,0.1);
    }
    
    .converter-arrow {
      font-size:2rem;
      color:#94a3b8;
      text-align:center;
      padding-bottom:0.5rem;
      cursor:pointer;
      transition:all 0.3s ease;
      user-select:none;
    }
    
    .converter-arrow:hover {
      color:#6366f1;
      transform:scale(1.2);
    }
    
    .arrow-icon {
      display:inline-block;
    }
    
    .conversion-result {
      grid-column:1 / -1;
      margin-top:1rem;
      padding:1.5rem;
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      border-radius:12px;
      text-align:center;
      color:#ffffff;
    }
    
    .result-label {
      font-size:0.875rem;
      opacity:0.9;
      text-transform:uppercase;
      letter-spacing:1px;
      margin-bottom:0.5rem;
    }
    
    .result-value {
      font-size:2.5rem;
      font-weight:700;
      margin-bottom:0.5rem;
    }
    
    .result-rate {
      font-size:0.875rem;
      opacity:0.8;
    }
    
    /* Cards Grid */
    .loading { padding:2rem; text-align:center; color:#64748b; font-size:1.1rem; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; margin-top:1rem; }
    
    .card {
      display:flex;
      flex-direction:column;
      padding:0;
      border-radius:16px;
      background:#ffffff;
      text-decoration:none;
      color:inherit;
      box-shadow:0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      transition:all 0.3s ease;
      border:1px solid #e2e8f0;
      overflow:hidden;
    }
    
    .card:hover {
      transform:translateY(-6px);
      box-shadow:0 20px 40px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.06);
      border-color:#cbd5e1;
    }
    
    .card-header {
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:16px 20px;
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      border-bottom:1px solid rgba(255,255,255,0.1);
    }
    
    .symbol-badge {
      font-weight:700;
      font-size:1.25rem;
      color:#ffffff;
      letter-spacing:0.5px;
    }
    
    .change-badge {
      padding:6px 12px;
      border-radius:20px;
      font-weight:600;
      font-size:0.85rem;
      background:rgba(255,255,255,0.2);
      color:#ffffff;
    }
    
    .change-badge.positive {
      background:rgba(16,185,129,0.2);
      color:#d1fae5;
    }
    
    .change-badge.negative {
      background:rgba(239,68,68,0.2);
      color:#fecaca;
    }
    
    .card-body {
      padding:20px;
      display:flex;
      flex-direction:column;
      gap:12px;
    }
    
    .name {
      font-size:0.95rem;
      color:#475569;
      font-weight:500;
      margin:0;
    }
    
    .pair {
      font-size:0.8rem;
      color:#94a3b8;
      margin-top:-8px;
    }
    
    .price-section {
      margin-top:8px;
      padding-top:12px;
      border-top:1px solid #f1f5f9;
    }
    
    .price-label {
      font-size:0.75rem;
      color:#94a3b8;
      text-transform:uppercase;
      letter-spacing:0.5px;
      margin-bottom:4px;
    }
    
    .price {
      font-weight:700;
      font-size:1.5rem;
      color:#0f172a;
      line-height:1.2;
    }
    
    .stats {
      display:flex;
      gap:12px;
      margin-top:8px;
      padding-top:12px;
      border-top:1px solid #f1f5f9;
    }
    
    .stat-item {
      flex:1;
      display:flex;
      flex-direction:column;
      gap:4px;
      padding:8px;
      background:#f8fafc;
      border-radius:8px;
    }
    
    .stat-label {
      font-size:0.7rem;
      color:#94a3b8;
      text-transform:uppercase;
      letter-spacing:0.5px;
    }
    
    .stat-value {
      font-size:0.9rem;
      font-weight:600;
      color:#475569;
    }
  `]
})
export class CryptoList implements OnInit, OnDestroy {
  symbols: Array<{ display: string, pair: string, name?: string, symbolForRoute: string, id?: string, symbol?: string }> = [];
  quotes: Record<string, any> = {};
  loading = true;
  private pollId: any;
  private lastValidQuotes: Record<string, any> = {}; // Cache ultima valutazione valida
  private cacheTimestamp: number = 0; // Timestamp dei dati in cache

  // Converter properties
  converterAmount: number = 1;
  selectedFrom: string = '';
  selectedTo: string = '';
  conversionResult: number | null = null;
  exchangeRate: number | null = null;
  usingCachedData: boolean = false;
  lastUpdateTime: string = '';

  // Exchange rates (USD base)
  private forexRates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 149.50,
    'CNY': 7.24,
    'CHF': 0.88,
    'AUD': 1.53,
    'CAD': 1.38
  };

  constructor(private svc: CryptoService) {}

  ngOnInit(): void {
    // Carica ultima valutazione salvata immediatamente
    const savedData = this.loadQuotesFromStorage();
    if (savedData) {
      this.lastValidQuotes = savedData.quotes;
      this.quotes = savedData.quotes;
      this.cacheTimestamp = savedData.timestamp;
      this.usingCachedData = true;
      this.updateCacheTimeDisplay();
    }
    
    // Carica anche i symbols dalla cache subito per mostrare le cards immediatamente
    const cachedSymbols = this.loadSymbolsFromStorage();
    if (cachedSymbols && cachedSymbols.length > 0) {
      this.symbols = cachedSymbols;
      console.log('Pre-caricati', cachedSymbols.length, 'symbols dalla cache');
    }
    
    this.loadSymbols().catch(console.error);
    // Aggiornamento in tempo reale: ogni 500ms
    this.pollId = setInterval(() => this.refreshQuotes().catch(console.error), 500);
    this.loadForexRates();
  }

  ngOnDestroy(): void {
    clearInterval(this.pollId);
  }

  private async loadSymbols() {
    try {
      const data = await this.svc.getSymbols();
      // data from CoinGecko: array of {symbol, name, id}
      const list = (data || []).map((it: any) => {
        const sym = it.symbol || it.id || '';
        const name = it.name || sym;
        const pair = `${sym}/USD`;
        return { 
          display: sym.toUpperCase(), 
          pair, 
          name, 
          symbolForRoute: encodeURIComponent(pair),
          id: it.id,
          symbol: sym.toUpperCase()
        };
      });
      
      if (list.length > 0) {
        this.symbols = list;
        // Salva i symbols in cache
        this.saveSymbolsToStorage(list);
      } else {
        // Se l'API non restituisce dati, carica dalla cache
        const cachedSymbols = this.loadSymbolsFromStorage();
        if (cachedSymbols && cachedSymbols.length > 0) {
          this.symbols = cachedSymbols;
          console.log('Caricati', cachedSymbols.length, 'symbols dalla cache');
        }
      }
      
      // Prima carica i quotes
      await this.refreshQuotes();
      
      // Poi imposta i valori default
      if (!this.selectedFrom && this.symbols.length > 0) {
        this.selectedFrom = 'FOREX:USD';
        // Cerca Bitcoin come default
        const btc = this.symbols.find(s => s.id === 'bitcoin');
        this.selectedTo = btc ? 'CRYPTO:bitcoin' : 'CRYPTO:' + this.symbols[0].id;
        
        // Calcola immediatamente la conversione
        setTimeout(() => {
          this.calculateConversion();
        }, 100);
      }
    } catch (error) {
      console.error('Errore nel caricamento symbols:', error);
      // In caso di errore, prova a caricare dalla cache
      const cachedSymbols = this.loadSymbolsFromStorage();
      if (cachedSymbols && cachedSymbols.length > 0) {
        this.symbols = cachedSymbols;
        console.log('Caricati', cachedSymbols.length, 'symbols dalla cache dopo errore');
        await this.refreshQuotes();
      }
    } finally {
      this.loading = false;
    }
  }

  private async refreshQuotes() {
    if (!this.symbols.length) return;
    const pairs = this.symbols.map(s => s.pair).join(',');
    
    try {
      const arr = await this.svc.getQuotes(pairs);
      
      // Inizia con i dati in cache (se esistono)
      const map: Record<string, any> = { ...this.lastValidQuotes };
      let validQuotesCount = 0;
      
      if (arr && arr.length > 0) {
        // Aggiorna solo i dati ricevuti dall'API
        for (const q of arr) {
          if (!q || !q.price) continue;
          
          validQuotesCount++;
          
          // Mappa con tutte le chiavi possibili
          if (q.id) map[q.id] = q;
          if (q.pair) map[q.pair] = q;
          if (q.symbol) {
            map[q.symbol] = q;
            map[q.symbol.toUpperCase()] = q;
            map[q.symbol.toUpperCase() + '/USD'] = q;
          }
          
          // Trova il symbol corrispondente e mappa anche con il suo ID
          const matchingSymbol = this.symbols.find(s => 
            s.id === q.id || 
            s.pair === q.pair || 
            s.symbol === q.symbol?.toUpperCase() ||
            s.display === q.pair
          );
          
          if (matchingSymbol) {
            if (matchingSymbol.id) map[matchingSymbol.id] = q;
            if (matchingSymbol.pair) map[matchingSymbol.pair] = q;
            if (matchingSymbol.symbol) map[matchingSymbol.symbol] = q;
          }
        }
      }
      
      // Se abbiamo dati (nuovi o dalla cache)
      if (validQuotesCount > 0 || Object.keys(map).length > 0) {
        this.quotes = map;
        
        // Salva solo se abbiamo ricevuto nuovi dati
        if (validQuotesCount > 0) {
          this.lastValidQuotes = { ...map };
          this.saveQuotesToStorage(map);
          this.cacheTimestamp = Date.now();
          this.usingCachedData = false;
          this.lastUpdateTime = new Date().toLocaleTimeString('it-IT');
        } else {
          this.usingCachedData = true;
          this.updateCacheTimeDisplay();
        }
        
        // Ricalcola conversione se necessario
        if (this.selectedFrom && this.selectedTo && this.converterAmount > 0) {
          this.calculateConversion();
        }
      } else {
        console.warn('Nessun dato disponibile (né API né cache)');
        this.useCachedQuotes();
      }
    } catch (error) {
      console.warn('Errore nel recupero quotes:', error);
      this.useCachedQuotes();
    }
  }
  
  private useCachedQuotes() {
    if (Object.keys(this.lastValidQuotes).length > 0) {
      this.quotes = { ...this.lastValidQuotes };
      this.usingCachedData = true;
      this.updateCacheTimeDisplay();
    } else {
      const savedData = this.loadQuotesFromStorage();
      if (savedData) {
        this.quotes = savedData.quotes;
        this.lastValidQuotes = savedData.quotes;
        this.cacheTimestamp = savedData.timestamp;
        this.usingCachedData = true;
        this.updateCacheTimeDisplay();
      }
    }
  }

  private saveQuotesToStorage(quotes: Record<string, any>) {
    try {
      const data = {
        quotes: quotes,
        timestamp: Date.now()
      };
      localStorage.setItem('crypto_last_quotes', JSON.stringify(data));
    } catch (error) {
      console.warn('Errore nel salvataggio quotes in localStorage:', error);
    }
  }

  private loadQuotesFromStorage(): { quotes: Record<string, any>, timestamp: number } | null {
    try {
      const saved = localStorage.getItem('crypto_last_quotes');
      if (saved) {
        const data = JSON.parse(saved);
        const age = Date.now() - data.timestamp;
        const ageInHours = Math.round(age / 1000 / 60 / 60);
        
        // Mostra sempre l'ultimo prezzo disponibile, anche se vecchio
        console.log('Caricati quotes da localStorage (età:', ageInHours, 'ore)');
        return {
          quotes: data.quotes,
          timestamp: data.timestamp
        };
      }
    } catch (error) {
      console.warn('Errore nel caricamento quotes da localStorage:', error);
    }
    return null;
  }

  private updateCacheTimeDisplay() {
    if (!this.cacheTimestamp) return;
    
    const age = Date.now() - this.cacheTimestamp;
    const ageInMinutes = Math.round(age / 1000 / 60);
    const ageInHours = Math.round(age / 1000 / 60 / 60);
    const ageInDays = Math.round(age / 1000 / 60 / 60 / 24);
    
    if (ageInMinutes < 60) {
      this.lastUpdateTime = `${ageInMinutes} min fa`;
    } else if (ageInHours < 24) {
      this.lastUpdateTime = `${ageInHours} ore fa`;
    } else {
      this.lastUpdateTime = `${ageInDays} giorni fa`;
    }
  }

  private saveSymbolsToStorage(symbols: any[]) {
    try {
      localStorage.setItem('crypto_symbols', JSON.stringify(symbols));
    } catch (error) {
      console.warn('Errore nel salvataggio symbols:', error);
    }
  }

  private loadSymbolsFromStorage(): any[] | null {
    try {
      const saved = localStorage.getItem('crypto_symbols');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Errore nel caricamento symbols:', error);
    }
    return null;
  }

  private async loadForexRates() {
    try {
      // Fetch real forex rates (optional - using fixed rates as fallback)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        this.forexRates = {
          'USD': 1,
          'EUR': data.rates.EUR || 0.92,
          'GBP': data.rates.GBP || 0.79,
          'JPY': data.rates.JPY || 149.50,
          'CNY': data.rates.CNY || 7.24,
          'CHF': data.rates.CHF || 0.88,
          'AUD': data.rates.AUD || 1.53,
          'CAD': data.rates.CAD || 1.38
        };
      }
    } catch (error) {
      console.warn('Using fallback forex rates', error);
    }
  }

  getDisplayName(selection: string): string {
    if (!selection) return '';
    const parts = selection.split(':');
    if (parts[0] === 'FOREX') {
      return parts[1];
    } else {
      // Find the crypto name by ID
      const cryptoId = parts[1];
      const crypto = this.symbols.find(s => s.id === cryptoId);
      return crypto?.symbol || crypto?.display?.split('/')[0] || parts[1];
    }
  }

  swapCurrencies() {
    const temp = this.selectedFrom;
    this.selectedFrom = this.selectedTo;
    this.selectedTo = temp;
    this.calculateConversion();
  }

  calculateConversion() {
    if (!this.selectedFrom || !this.selectedTo || !this.converterAmount || this.converterAmount <= 0) {
      this.conversionResult = null;
      this.exchangeRate = null;
      return;
    }

    const fromParts = this.selectedFrom.split(':');
    const toParts = this.selectedTo.split(':');
    const fromType = fromParts[0];
    const fromValue = fromParts[1];
    const toType = toParts[0];
    const toValue = toParts[1];

    // Ottieni valore in USD
    let valueInUSD = 0;

    if (fromType === 'CRYPTO') {
      const cryptoQuote = this.findQuote(fromValue);
      if (!cryptoQuote?.price) {
        console.warn('Quote non trovato per:', fromValue, 'Disponibili:', Object.keys(this.quotes));
        return;
      }
      valueInUSD = cryptoQuote.price * this.converterAmount;
    } else {
      const forexRate = this.forexRates[fromValue] || 1;
      valueInUSD = this.converterAmount / forexRate;
    }

    // Converti da USD a target
    let result = 0;
    let rate = 0;

    if (toType === 'CRYPTO') {
      const cryptoQuote = this.findQuote(toValue);
      if (!cryptoQuote?.price) {
        console.warn('Quote non trovato per:', toValue);
        return;
      }
      result = valueInUSD / cryptoQuote.price;
      
      if (fromType === 'CRYPTO') {
        const fromQuote = this.findQuote(fromValue);
        rate = fromQuote.price / cryptoQuote.price;
      } else {
        const forexRate = this.forexRates[fromValue] || 1;
        rate = forexRate / cryptoQuote.price;
      }
    } else {
      const forexRate = this.forexRates[toValue] || 1;
      result = valueInUSD * forexRate;
      
      if (fromType === 'CRYPTO') {
        const fromQuote = this.findQuote(fromValue);
        rate = fromQuote.price * forexRate;
      } else {
        const fromForexRate = this.forexRates[fromValue] || 1;
        rate = forexRate / fromForexRate;
      }
    }

    this.conversionResult = result;
    this.exchangeRate = rate;
  }
  
  getQuote(symbol: any): any {
    return this.findQuote(symbol.id || symbol.pair || symbol.symbol);
  }
  
  private findQuote(identifier: string): any {
    // Prova lookup diretto
    if (this.quotes[identifier]) {
      return this.quotes[identifier];
    }
    
    // Prova con varianti
    const variants = [
      identifier,
      identifier.toLowerCase(),
      identifier.toUpperCase(),
      identifier + '/USD',
      identifier.toUpperCase() + '/USD'
    ];
    
    for (const variant of variants) {
      if (this.quotes[variant]) {
        return this.quotes[variant];
      }
    }
    
    // Cerca tra i symbols
    const symbol = this.symbols.find(s => 
      s.id === identifier || 
      s.pair === identifier || 
      s.symbol === identifier ||
      s.display === identifier
    );
    
    if (symbol && symbol.id) {
      return this.quotes[symbol.id] || 
             this.quotes[symbol.pair] || 
             this.quotes[symbol.symbol + '/USD'];
    }
    
    return null;
  }
}
