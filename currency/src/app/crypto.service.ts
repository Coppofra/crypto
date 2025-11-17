import { Injectable } from '@angular/core';
import { MarketAPI, MarketConfig } from '../market';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private useLocalAPI = MarketConfig.features.useLocalAPI;

  async getSymbols(): Promise<any[]> {
    try {
      if (this.useLocalAPI) {
        // Use local API server
        const response = await MarketAPI.getCurrencyList('json');
        if (response.success && response.data) {
          return response.data.map((coin: any) => ({
            symbol: coin.symbol,
            name: coin.name,
            id: coin.id
          }));
        }
      }
    } catch (error) {
      console.warn('Local API failed, falling back to external API', error);
    }

    // Fallback to external API
    const res = await fetch(`${MarketConfig.external.base}${MarketConfig.external.endpoints.markets}?vs_currency=usd&order=market_cap_desc&per_page=60&page=1&sparkline=false`);
    if (!res.ok) throw new Error('Errore fetching symbols');
    const data = await res.json();
    return data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      id: coin.id
    }));
  }

  async getQuotes(pairs: string): Promise<any[]> {
    try {
      if (this.useLocalAPI) {
        // Use local API server
        const response = await MarketAPI.getCurrencyList('json');
        if (response.success && response.data) {
          return response.data.map((coin: any) => ({
            symbol: coin.pair,
            pair: coin.pair,
            price: coin.price,
            bid: coin.high_24h,
            ask: coin.low_24h,
            percent_change_24h: coin.price_change_percentage_24h
          }));
        }
      }
    } catch (error) {
      console.warn('Local API failed for quotes, falling back to external API', error);
    }

    // Fallback to external API
    const symbols = pairs.split(',').map(p => p.split('/')[0].toLowerCase());
    const ids = symbols.join(',');
    
    const res = await fetch(`${MarketConfig.external.base}${MarketConfig.external.endpoints.simplePrice}?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`);
    if (!res.ok) {
      const marketsRes = await fetch(`${MarketConfig.external.base}${MarketConfig.external.endpoints.markets}?vs_currency=usd&order=market_cap_desc&per_page=60&page=1&sparkline=false`);
      const markets = await marketsRes.json();
      return markets.map((coin: any) => ({
        symbol: `${coin.symbol.toUpperCase()}/USD`,
        pair: `${coin.symbol.toUpperCase()}/USD`,
        price: coin.current_price,
        bid: coin.current_price * 0.999,
        ask: coin.current_price * 1.001,
        percent_change_24h: coin.price_change_percentage_24h
      }));
    }
    
    const data = await res.json();
    return Object.keys(data).map(id => ({
      symbol: `${id.toUpperCase()}/USD`,
      pair: `${id.toUpperCase()}/USD`,
      price: data[id].usd,
      bid: data[id].usd * 0.999,
      ask: data[id].usd * 1.001,
      percent_change_24h: data[id].usd_24h_change
    }));
  }

  async getQuote(pair: string): Promise<any> {
    const arr = await this.getQuotes(pair);
    return arr?.[0] ?? null;
  }
}
