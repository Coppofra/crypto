import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CryptoService } from './crypto.service';

@Component({
  selector: 'crypto-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-container">
      <div class="header-section">
        <a routerLink="/" class="back-btn">
          <span class="back-arrow">←</span> Torna alla lista
        </a>
        <div class="crypto-header">
          <h1>{{ cryptoName }}</h1>
          <div class="pair-badge">{{ pair }}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Prezzo Attuale</div>
          <div class="stat-value primary">{{ lastPrice ? ('$' + (lastPrice | number:'1.2-6')) : '—' }}</div>
          <div class="stat-change" [class.positive]="priceChange >= 0" [class.negative]="priceChange < 0">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange | number:'1.2-2' }}%
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Massimo 24h</div>
          <div class="stat-value">{{ high24h ? ('$' + (high24h | number:'1.2-6')) : '—' }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Minimo 24h</div>
          <div class="stat-value">{{ low24h ? ('$' + (low24h | number:'1.2-6')) : '—' }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Ultimo Aggiornamento</div>
          <div class="stat-value small">{{ lastTime }}</div>
        </div>
      </div>

      <div class="chart-container">
        <div class="chart-header">
          <h2>📈 Grafico in Tempo Reale</h2>
          <div class="chart-info">{{ points.length }} punti dati</div>
        </div>
        <canvas #canvas width="1200" height="400" class="chart"></canvas>
      </div>
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      padding: 0;
      margin: 0;
      font-family: Inter, system-ui, Arial; 
      color: #0f172a; 
      background: #f8fafc; 
      min-height: 100vh;
    }
    
    .detail-container { 
      max-width: 1400px; 
      margin: 0 auto;
      padding: 1rem;
    }
    
    .header-section {
      margin-bottom: 2rem;
    }
    
    .back-btn { 
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none; 
      color: #64748b;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      transition: color 0.2s;
    }
    
    .back-btn:hover {
      color: #334155;
    }
    
    .back-arrow {
      font-size: 1.2rem;
    }
    
    .crypto-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    h1 { 
      margin: 0; 
      font-size: 2.5rem; 
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .pair-badge {
      padding: 0.5rem 1rem;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    
    .stat-value.primary {
      font-size: 2.25rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-value.small {
      font-size: 1.1rem;
      font-weight: 500;
      color: #475569;
    }
    
    .stat-change {
      font-size: 0.95rem;
      font-weight: 600;
    }
    
    .stat-change.positive {
      color: #059669;
    }
    
    .stat-change.negative {
      color: #dc2626;
    }
    
    .chart-container {
      background: #ffffff;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #1e293b;
    }
    
    .chart-info {
      font-size: 0.875rem;
      color: #64748b;
      padding: 0.5rem 1rem;
      background: #f1f5f9;
      border-radius: 20px;
    }
    
    .chart { 
      width: 100%; 
      max-width: 100%; 
      border-radius: 12px; 
      background: linear-gradient(180deg, #fafbfc, #ffffff);
    }
  `]
})
export class CryptoDetail implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  pair = '';
  cryptoName = '';
  lastPrice: number | null = null;
  lastTime = '';
  priceChange = 0;
  high24h: number | null = null;
  low24h: number | null = null;
  private timer: any;
  points: number[] = [];
  private timestamps: Date[] = [];

  constructor(private route: ActivatedRoute, private svc: CryptoService) {}

  ngOnInit(): void {
    this.pair = decodeURIComponent(this.route.snapshot.paramMap.get('symbol') || '');
    this.cryptoName = this.pair.split('/')[0];
    this.start();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private start() {
    this.fetchAndDraw().catch(console.error);
    this.timer = setInterval(() => this.fetchAndDraw().catch(console.error), 500);
  }

  private async fetchAndDraw() {
    if (!this.pair) return;
    const q = await this.svc.getQuote(this.pair);
    if (!q) return;
    
    const price = q.price ?? q.last ?? q.value ?? null;
    if (price == null) return;
    
    this.lastPrice = price;
    this.lastTime = new Date().toLocaleTimeString('it-IT');
    this.priceChange = q.percent_change_24h ?? 0;
    this.high24h = q.bid ?? q.high_24h ?? null;
    this.low24h = q.ask ?? q.low_24h ?? null;
    
    this.points.push(+price);
    this.timestamps.push(new Date());
    
    if (this.points.length > 120) {
      this.points.shift();
      this.timestamps.shift();
    }
    
    this.drawChart();
  }

  private drawChart() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 40, right: 80, bottom: 40, left: 60 };
    
    ctx.clearRect(0, 0, w, h);

    if (this.points.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📊 Raccolta dati in tempo reale...', w / 2, h / 2);
      return;
    }

    const max = Math.max(...this.points);
    const min = Math.min(...this.points);
    const range = (max - min) || 1;
    const len = this.points.length;
    const chartWidth = w - padding.left - padding.right;
    const chartHeight = h - padding.top - padding.bottom;
    const step = chartWidth / (len - 1);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = max - (range / 5) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, Arial';
      ctx.textAlign = 'right';
      ctx.fillText('$' + value.toFixed(2), padding.left - 10, y + 4);
    }

    // Area gradient
    const grd = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    grd.addColorStop(0, 'rgba(99,102,241,0.2)');
    grd.addColorStop(1, 'rgba(99,102,241,0)');

    // Draw area
    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight - ((this.points[i] - min) / range) * chartHeight;
      if (i === 0) ctx.moveTo(x, y); 
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + (len - 1) * step, h - padding.bottom);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6366f1';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < len; i++) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight - ((this.points[i] - min) / range) * chartHeight;
      if (i === 0) ctx.moveTo(x, y); 
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw points
    for (let i = 0; i < len; i += 10) {
      const x = padding.left + i * step;
      const y = padding.top + chartHeight - ((this.points[i] - min) / range) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
    }

    // Latest price indicator
    const lastX = padding.left + (len - 1) * step;
    const lastY = padding.top + chartHeight - ((this.points[len - 1] - min) / range) * chartHeight;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Price label
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 14px Inter, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('$' + this.lastPrice!.toFixed(6), lastX + 10, lastY + 5);
  }
}
