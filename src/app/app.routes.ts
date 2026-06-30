import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'usuarios',
        title: 'Usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'categorias',
        title: 'Categorías',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'comercios',
        title: 'Comercios',
        loadComponent: () => import('./features/commerces/commerces.component').then(m => m.CommercesComponent)
      },
      {
        path: 'medios-de-pago',
        title: 'Medios de pago',
        loadComponent: () => import('./features/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent)
      },
      {
        path: 'gastos-fijos',
        title: 'Gastos fijos',
        loadComponent: () => import('./features/fixed-expenses/fixed-expenses.component').then(m => m.FixedExpensesComponent)
      },
      {
        path: 'ingresos',
        title: 'Ingresos',
        loadComponent: () => import('./features/incomes/incomes.component').then(m => m.IncomesComponent)
      },
      {
        path: 'gastos',
        title: 'Gastos',
        loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'pagos-pendientes',
        title: 'Pagos y Cobros Pendientes',
        loadComponent: () => import('./features/pending-payments/pending-payments.component').then(m => m.PendingPaymentsComponent)
      },
      {
        path: 'grupos-reparto',
        title: 'Grupos de Reparto',
        loadComponent: () => import('./features/sharing-groups/sharing-groups.component').then(m => m.SharingGroupsComponent)
      },
      {
        path: 'compromisos-compartidos',
        title: 'Compromisos Compartidos',
        loadComponent: () => import('./features/shared-commitments/shared-commitments.component').then(m => m.SharedCommitmentsComponent)
      },
      {
        path: 'calculadora-reparto',
        title: 'Calculadora de Reparto',
        loadComponent: () => import('./features/split-calculator/split-calculator.component').then(m => m.SplitCalculatorComponent)
      },
      {
        path: 'prestamos',
        title: 'Préstamos',
        loadComponent: () => import('./features/loans/loans.component').then(m => m.LoansComponent)
      },
      {
        path: 'xml-a-excel',
        title: 'XML a Excel',
        loadComponent: () => import('./features/xml-converter/xml-converter.component').then(m => m.XmlConverterComponent)
      },
      {
        path: 'amigos',
        title: 'Amigos',
        loadComponent: () => import('./features/friends/friends.component').then(m => m.FriendsComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
