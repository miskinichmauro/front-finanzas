import { Component, signal, inject, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isHandset = signal(false);

  navGroups = [
    {
      label: 'General',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
      ]
    },
    {
      label: 'Finanzas',
      items: [
        { label: 'Ingresos', icon: 'trending_up', route: '/ingresos' },
        { label: 'Gastos del Período', icon: 'receipt_long', route: '/gastos-periodo' },
        { label: 'Transacciones', icon: 'swap_horiz', route: '/transacciones' }
      ]
    },
    {
      label: 'Configuración',
      items: [
        { label: 'Usuarios', icon: 'people', route: '/usuarios' },
        { label: 'Categorías', icon: 'category', route: '/categorias' },
        { label: 'Comercios', icon: 'store', route: '/comercios' },
        { label: 'Medios de Pago', icon: 'payment', route: '/medios-de-pago' },
        { label: 'Gastos Fijos', icon: 'repeat', route: '/gastos-fijos' }
      ]
    },
    {
      label: 'Gastos Compartidos',
      items: [
        { label: 'Grupos de Reparto', icon: 'group', route: '/grupos-reparto' },
        { label: 'Compromisos Compartidos', icon: 'handshake', route: '/compromisos-compartidos' },
        { label: 'Calculadora de Reparto', icon: 'calculate', route: '/calculadora-reparto' }
      ]
    }
  ];

  constructor() {
    const breakpointObserver = inject(BreakpointObserver);
    breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isHandset.set(result.matches);
      });
  }

  toggleSidenav(): void {
    this.sidenav?.toggle();
  }
}
