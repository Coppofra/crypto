import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CryptoService } from './crypto.service';

@Component({
  selector: 'crypto-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail">
      <a routerLink="/" class="back">← Indietro</a>
      <h2>{{ pair }}</h2>
      <div class="meta">
        <div class="price">{{ lastPrice ? (lastPrice | number:'1.2-6') : '—' }}</div>
        <div class="time">{{ lastTime }}</div>
      </div>
      <canvas #canvas width="800" height="320" class="chart"></canvas>
    </div>
  `,
  styles: [`
    :host{ display:block; padding:1rem; font-family:Inter,system-ui,Arial; color:#0f172a; }
    .detail { max-width:1000px; margin:0 auto; }
    .back { text-decoration:none; color:#334155; display:inline-block; margin-bottom:8px; }
    h2 { margin:6px 0 0 0; }
    .meta { display:flex; gap:12px; align-items:center; color:#475569; margin-bottom:8px; }
    .price { font-weight:700; font-size:1.25rem; color:#0f172a; }
    .chart { width:100%; max-width:100%; border-radius:10px; background:linear-gradient(180deg,#fbfdff,#ffffff); box-shadow:0 8px 24px rgba(2,6,23,0.06); }
  `]
})
export class CryptoDetail implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  pair = '';
  lastPrice: number | null = null;
  lastTime = '';
  private timer: any;
  private points: number[] = [];

  constructor(private route: ActivatedRoute, private svc: CryptoService) {}

  ngOnInit(): void {
    this.pair = decodeURIComponent(this.route.snapshot.paramMap.get('symbol') || '');
    this.start();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private start() {
    this.fetchAndDraw().catch(console.error);
    this.timer = setInterval(() => this.fetchAndDraw().catch(console.error), 1000);
  }

  private async fetchAndDraw() {
    if (!this.pair) return;
    const q = await this.svc.getQuote(this.pair);
    if (!q) return;
    const price = q.price ?? q.last ?? q.value ?? null;
    if (price == null) return;
    this.lastPrice = price;
    this.lastTime = new Date().toLocaleTimeString();
    this.points.push(+price);
    if (this.points.length > 120) this.points.shift();
    this.drawChart();
  }

  private drawChart() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0,0,w,h);

    if (this.points.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('Raccolta dati...', 12, 20);
      return;
    }

    const max = Math.max(...this.points);
    const min = Math.min(...this.points);
    const range = (max - min) || 1;
    const len = this.points.length;
    const step = w / (len - 1);

    // area gradient
    const grd = ctx.createLinearGradient(0,0,0,h);
    grd.addColorStop(0, 'rgba(99,102,241,0.15)');
    grd.addColorStop(1, 'rgba(99,102,241,0)');

    // draw area
    ctx.beginPath();
    for (let i=0;i<len;i++){
      const x = i * step;
      const y = h - ((this.points[i]-min)/range) * (h - 20) - 10;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0,h); ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();

    // draw line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#6366F1';
    for (let i=0;i<len;i++){
      const x = i * step;
      const y = h - ((this.points[i]-min)/range) * (h - 20) - 10;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // draw latest price
    ctx.fillStyle = '#0f172a';
    ctx.font = '14px Inter, Arial';
    ctx.fillText(this.lastPrice!.toString(), 10, 18);
  }
}
