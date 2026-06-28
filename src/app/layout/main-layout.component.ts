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
import { ThemeService } from '../core/services/theme.service';

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
  sidenavOpen = signal(true);

  navGroups: { label: string; items: { label: string; icon: string; route: string; adminOnly?: boolean }[] }[] = [
    {
      label: 'General',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
      ]
    },
    {
      label: 'Finanzas',
      items: [
        { label: 'Ingresos',     icon: 'trending_up', route: '/ingresos' },
        { label: 'Gastos Fijos', icon: 'repeat',      route: '/gastos-fijos' },
        { label: 'Transacciones',      icon: 'swap_horiz',     route: '/transacciones' },
        { label: 'Pagos Pendientes',   icon: 'pending_actions', route: '/pagos-pendientes' },
        { label: 'Préstamos',          icon: 'account_balance', route: '/prestamos' }
      ]
    },
    {
      label: 'Configuración',
      items: [
        { label: 'Usuarios',       icon: 'people',   route: '/usuarios', adminOnly: true },
        { label: 'Categorías',     icon: 'category', route: '/categorias' },
        { label: 'Comercios',      icon: 'store',    route: '/comercios' },
        { label: 'Medios de Pago', icon: 'payment',  route: '/medios-de-pago' }
      ]
    },
    {
      label: 'Herramientas',
      items: [
        { label: 'XML a Excel', icon: 'transform', route: '/xml-a-excel' }
      ]
    },
    {
      label: 'Social',
      items: [
        { label: 'Amigos', icon: 'people', route: '/amigos' }
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
  readonly theme   = inject(ThemeService);
  readonly isAdmin = this.auth.isAdmin;

  userName    = computed(() => this.auth.currentUser()?.userName ?? '');
  userRole    = computed(() => this.auth.currentUser()?.role     ?? '');
  userInitial = computed(() => this.userName().charAt(0).toUpperCase());

  logout(): void { this.auth.logout(); }

  toggleSidenav(): void {
    this.sidenavOpen.set(!this.sidenavOpen());
    this.sidenav.toggle();
  }

  closeOnMobile(): void {
    if (this.isHandset()) {
      this.sidenavOpen.set(false);
      this.sidenav.close();
    }
  }

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
      .subscribe(result => {
        this.isHandset.set(result.matches);
        this.sidenavOpen.set(!result.matches);
      });
  }
}
