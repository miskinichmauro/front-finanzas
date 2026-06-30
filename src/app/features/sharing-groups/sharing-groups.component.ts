import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RowActionsComponent } from '../../shared/components/row-actions/row-actions.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SharingGroupFormDialogComponent } from './sharing-group-form-dialog.component';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { AuthService } from '../../core/services/auth.service';
import { SharingGroupDto } from '../../core/models';

@Component({
  selector: 'app-sharing-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent,
    RowActionsComponent
  ],
  templateUrl: './sharing-groups.component.html'
})
export class SharingGroupsComponent implements OnInit {
  private sharingGroupsService = inject(SharingGroupsService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'members', 'isActive', 'actions'];
  loading = signal(false);
  dataSource = new MatTableDataSource<SharingGroupDto>([]);
  searchText = '';

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.sharingGroupsService.getAll(true).subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar grupos', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  isCurrentUserMember(group: SharingGroupDto): boolean {
    const currentUserId = this.authService.currentUser()?.userId;
    return !!currentUserId && group.members.some(member => member.userId === currentUserId);
  }

  canLeaveGroup(group: SharingGroupDto): boolean {
    return this.isCurrentUserMember(group) && group.members.length > 1;
  }

  getMemberNames(group: SharingGroupDto): string {
    return group.members.map(m => m.userName).join(', ') || '—';
  }

  openCreate(): void {
    const ref = this.dialog.open(SharingGroupFormDialogComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(item: SharingGroupDto): void {
    const ref = this.dialog.open(SharingGroupFormDialogComponent, { data: item, width: '480px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openDelete(item: SharingGroupDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Grupo', message: `¿Eliminar el grupo "${item.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sharingGroupsService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Grupo eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  openLeaveGroup(item: SharingGroupDto): void {
    const currentUserId = this.authService.currentUser()?.userId;
    if (!currentUserId || !this.isCurrentUserMember(item)) return;

    if (item.members.length <= 1) {
      this.snackBar.open('No podés salir de un grupo sin dejar al menos un miembro', 'Cerrar', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Salir del Grupo', message: `¿Salir del grupo "${item.name}"?` }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      const remainingUserIds = item.members
        .filter(member => member.userId !== currentUserId)
        .map(member => member.userId);

      this.sharingGroupsService.updateMembers(item.id, { userIds: remainingUserIds }).subscribe({
        next: () => {
          this.snackBar.open('Saliste del grupo', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: () => this.snackBar.open('Error al salir del grupo', 'Cerrar', { duration: 3000 })
      });
    });
  }
}
