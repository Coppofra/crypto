import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private API_KEY = 'YOUR_API_KEY'; // <--- sostituisci qui
  private BASE = 'https://api.1forge.com';

  async getSymbols(): Promise<any[]> {
    const res = await fetch(`${this.BASE}/symbols?api_key=${this.API_KEY}`);
    if (!res.ok) throw new Error('Errore fetching symbols');
    return res.json();
  }

  async getQuotes(pairs: string): Promise<any[]> {
    const res = await fetch(`${this.BASE}/quotes?pairs=${encodeURIComponent(pairs)}&api_key=${this.API_KEY}`);
    if (!res.ok) throw new Error('Errore fetching quotes');
    return res.json();
  }

  async getQuote(pair: string): Promise<any> {
    const arr = await this.getQuotes(pair);
    return arr?.[0] ?? null;
  }
}
