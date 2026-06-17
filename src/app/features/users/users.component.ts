import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { UsersService } from '../../core/services/users.service';
import { UserDto } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'isActive', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<UserDto>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.usersService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(UserFormDialogComponent, { data: null, width: '400px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(user: UserDto): void {
    const ref = this.dialog.open(UserFormDialogComponent, { data: user, width: '400px' });
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
