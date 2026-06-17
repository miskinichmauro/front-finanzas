import { Component, signal, inject, computed, ViewChild } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
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
        { label: 'Ingresos',          icon: 'trending_up',  route: '/ingresos' },
        { label: 'Gastos del Período', icon: 'receipt_long', route: '/gastos-periodo' },
        { label: 'Transacciones',     icon: 'swap_horiz',   route: '/transacciones' }
      ]
    },
    {
      label: 'Configuración',
      items: [
        { label: 'Usuarios',     icon: 'people',   route: '/usuarios' },
        { label: 'Categorías',   icon: 'category', route: '/categorias' },
        { label: 'Comercios',    icon: 'store',    route: '/comercios' },
        { label: 'Medios de Pago', icon: 'payment', route: '/medios-de-pago' },
        { label: 'Gastos Fijos', icon: 'repeat',   route: '/gastos-fijos' }
      ]
    },
    {
      label: 'Gastos Compartidos',
      items: [
        { label: 'Grupos de Reparto',       icon: 'group',     route: '/grupos-reparto' },
        { label: 'Compromisos Compartidos', icon: 'handshake', route: '/compromisos-compartidos' },
        { label: 'Calculadora de Reparto',  icon: 'calculate', route: '/calculadora-reparto' }
      ]
    }
  ];

  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  userName    = computed(() => this.auth.currentUser()?.userName ?? '');
  userRole    = computed(() => this.auth.currentUser()?.role     ?? '');
  userInitial = computed(() => this.userName().charAt(0).toUpperCase());

  logout(): void { this.auth.logout(); }

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  currentPageTitle = computed(() => {
    const url = this.currentUrl();
    for (const group of this.navGroups) {
      for (const item of group.items) {
        if (url.startsWith(item.route)) return item.label;
      }
    }
    return 'Finanzas';
  });

  constructor() {
    inject(BreakpointObserver).observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe(result => this.isHandset.set(result.matches));
  }
}
