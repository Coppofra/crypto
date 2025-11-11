import { Routes } from '@angular/router';
import { CryptoList } from './crypto-list';
import { CryptoDetail } from './crypto-detail';

export const routes: Routes = [
  { path: '', component: CryptoList },
  { path: 'detail/:symbol', component: CryptoDetail },
];
