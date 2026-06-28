import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
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
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'comercios',
        loadComponent: () => import('./features/commerces/commerces.component').then(m => m.CommercesComponent)
      },
      {
        path: 'medios-de-pago',
        loadComponent: () => import('./features/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent)
      },
      {
        path: 'gastos-fijos',
        loadComponent: () => import('./features/fixed-expenses/fixed-expenses.component').then(m => m.FixedExpensesComponent)
      },
      {
        path: 'ingresos',
        loadComponent: () => import('./features/incomes/incomes.component').then(m => m.IncomesComponent)
      },
      {
        path: 'transacciones',
        loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'pagos-pendientes',
        loadComponent: () => import('./features/pending-payments/pending-payments.component').then(m => m.PendingPaymentsComponent)
      },
      {
        path: 'grupos-reparto',
        loadComponent: () => import('./features/sharing-groups/sharing-groups.component').then(m => m.SharingGroupsComponent)
      },
      {
        path: 'compromisos-compartidos',
        loadComponent: () => import('./features/shared-commitments/shared-commitments.component').then(m => m.SharedCommitmentsComponent)
      },
      {
        path: 'calculadora-reparto',
        loadComponent: () => import('./features/split-calculator/split-calculator.component').then(m => m.SplitCalculatorComponent)
      },
      {
        path: 'prestamos',
        loadComponent: () => import('./features/loans/loans.component').then(m => m.LoansComponent)
      },
      {
        path: 'xml-a-excel',
        loadComponent: () => import('./features/xml-converter/xml-converter.component').then(m => m.XmlConverterComponent)
      },
      {
        path: 'amigos',
        loadComponent: () => import('./features/friends/friends.component').then(m => m.FriendsComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
