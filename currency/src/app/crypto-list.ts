import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CryptoService } from './crypto.service';

@Component({
  selector: 'crypto-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <header>
        <h1>Crypto Live</h1>
        <p class="sub">Quotazioni in tempo reale — clicca per il grafico</p>
      </header>

      <main>
        <div *ngIf="loading" class="loading">Caricamento...</div>

        <div class="grid">
          <a
            class="card"
            *ngFor="let s of symbols"
            [routerLink]="['/detail', s.symbolForRoute]"
          >
            <div class="left">
              <div class="symbol">{{ s.display }}</div>
              <div class="name">{{ s.name || s.display }}</div>
            </div>
            <div class="right">
              <div class="price">{{ quotes[s.pair]?.price ?? '—' }}</div>
              <div class="change" [class.positive]="quotes[s.pair]?.percent_change_24h >= 0"
                   [class.negative]="quotes[s.pair]?.percent_change_24h < 0">
                {{ quotes[s.pair]?.percent_change_24h ? (quotes[s.pair]?.percent_change_24h | number:'1.2-2') + '%' : '' }}
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; padding:1rem; font-family: Inter, system-ui, Arial; color:#0f172a; }
    .container { max-width:1100px; margin:0 auto; }
    header { display:flex; align-items:flex-end; gap:1rem; }
    h1 { margin:0; font-size:1.75rem; }
    .sub { margin:0; color:#475569; }
    .loading { padding:2rem; color:#64748b; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; margin-top:16px; }
    .card { display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:10px; background:linear-gradient(180deg,#ffffff,#fbfbfd); text-decoration:none; color:inherit; box-shadow:0 6px 18px rgba(2,6,23,0.06); transition:transform .12s, box-shadow .12s; }
    .card:hover{ transform:translateY(-4px); box-shadow:0 10px 30px rgba(2,6,23,0.08); }
    .symbol { font-weight:700; font-size:1.05rem; }
    .name { font-size:0.85rem; color:#64748b; }
    .price { font-weight:700; font-size:1.05rem; text-align:right; }
    .change { font-size:0.85rem; text-align:right; margin-top:4px; }
    .positive { color:#059669; }
    .negative { color:#dc2626; }
  `]
})
export class CryptoList implements OnInit, OnDestroy {
  symbols: Array<{ display: string, pair: string, name?: string, symbolForRoute: string }> = [];
  quotes: Record<string, any> = {};
  loading = true;
  private pollId: any;

  constructor(private svc: CryptoService) {}

  ngOnInit(): void {
    this.loadSymbols().catch(console.error);
    this.pollId = setInterval(() => this.refreshQuotes().catch(console.error), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollId);
  }

  private async loadSymbols() {
    try {
      const data = await this.svc.getSymbols();
      // data might be array of {symbol, name} or simple strings. Normalize.
      const list = (data || []).slice(0, 60).map((it: any) => {
        const sym = typeof it === 'string' ? it : (it.symbol || it.code || '');
        const name = typeof it === 'object' ? (it.name || undefined) : undefined;
        // ensure pair format like BTC/USD
        const pair = sym.includes('/') ? sym : (sym ? `${sym}/USD` : '');
        return { display: sym || pair, pair, name, symbolForRoute: encodeURIComponent(pair) };
      }).filter((x: any) => x.pair);
      this.symbols = list;
      await this.refreshQuotes();
    } finally {
      this.loading = false;
    }
  }

  private async refreshQuotes() {
    if (!this.symbols.length) return;
    const pairs = this.symbols.map(s => s.pair).join(',');
    const arr = await this.svc.getQuotes(pairs);
    // arr is array of quote objects with 'symbol' or 'pair' property; normalize by pair key
    const map: Record<string, any> = {};
    for (const q of arr || []) {
      const key = q.symbol ?? q.pair ?? q.id ?? '';
      map[key] = q;
    }
    // also support keys with slash vs no slash
    this.quotes = map;
  }
}
