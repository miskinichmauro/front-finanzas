import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RowActionsComponent } from '../../shared/components/row-actions/row-actions.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { UserDto } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    RowActionsComponent
  ],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  readonly isAdmin = inject(AuthService).isAdmin;
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  get displayedColumns() {
    return this.isAdmin() ? ['name', 'isActive', 'actions'] : ['name', 'isActive'];
  }
  loading = signal(false);
  dataSource = new MatTableDataSource<UserDto>([]);
  searchText = '';

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loadData();
  }


  loadData(): void {
    this.loading.set(true);
    this.dataSource.data = [];
    this.usersService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreate(): void {
    const ref = this.dialog.open(UserFormDialogComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(user: UserDto): void {
    const ref = this.dialog.open(UserFormDialogComponent, { data: user, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(user: UserDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Usuario', message: `¿Eliminar al usuario "${user.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.usersService.delete(user.id).subscribe({
          next: () => {
            this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
