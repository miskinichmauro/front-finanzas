import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FriendsService } from '../../core/services/friends.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { FriendDto, PendingFriendRequestDto, SentFriendRequestDto, UserDto, UserRole } from '../../core/models';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss'
})
export class FriendsComponent implements OnInit {
  private readonly friendsService = inject(FriendsService);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  friends = signal<FriendDto[]>([]);
  pendingRequests = signal<PendingFriendRequestDto[]>([]);
  sentRequests = signal<SentFriendRequestDto[]>([]);
  allUsers = signal<UserDto[]>([]);
  loading = signal(false);

  searchText = signal('');
  friendSearchText = signal('');

  private get currentUserId(): string {
    return this.authService.currentUser()?.userId ?? '';
  }

  availableUsers = computed(() => {
    const myId = this.currentUserId;
    const friendIds = new Set(this.friends().map(f => f.friendUserId));
    const pendingAddresseeIds = new Set(this.pendingRequests().map(p => p.fromUserId));
    const sentAddresseeIds = new Set(this.sentRequests().map(s => s.toUserId));
    const filter = this.searchText().toLowerCase();

    return this.allUsers().filter(u =>
      u.id !== myId &&
      u.role !== UserRole.Admin &&
      !friendIds.has(u.id) &&
      !pendingAddresseeIds.has(u.id) &&
      !sentAddresseeIds.has(u.id) &&
      (!filter || u.name.toLowerCase().includes(filter) || u.email.toLowerCase().includes(filter))
    );
  });

  filteredFriends = computed(() => {
    const filter = this.friendSearchText().toLowerCase();
    return !filter
      ? this.friends()
      : this.friends().filter(f =>
          f.friendName.toLowerCase().includes(filter) ||
          f.friendEmail.toLowerCase().includes(filter)
        );
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    let pending = 3;
    const done = () => { if (--pending === 0) this.loading.set(false); };

    this.friendsService.getMyFriends().subscribe({ next: d => { this.friends.set(d); done(); }, error: done });
    this.friendsService.getPendingRequests().subscribe({ next: d => { this.pendingRequests.set(d); done(); }, error: done });
    this.friendsService.getSentRequests().subscribe({ next: d => { this.sentRequests.set(d); done(); }, error: done });
    this.usersService.getAll().subscribe({ next: d => this.allUsers.set(d) });
  }

  sendRequest(user: UserDto): void {
    this.friendsService.sendRequest(user.id).subscribe({
      next: sent => {
        this.sentRequests.update(s => [...s, sent]);
        this.snackBar.open(`Solicitud enviada a ${user.name}`, 'Cerrar', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al enviar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  acceptRequest(req: PendingFriendRequestDto): void {
    this.friendsService.acceptRequest(req.requestId).subscribe({
      next: () => {
        this.pendingRequests.update(p => p.filter(r => r.requestId !== req.requestId));
        this.friends.update(f => [...f, {
          requestId: req.requestId,
          friendUserId: req.fromUserId,
          friendName: req.fromUserName,
          friendEmail: req.fromUserEmail,
          since: new Date().toISOString()
        }]);
        this.snackBar.open(`Ahora sos amigo de ${req.fromUserName}`, 'Cerrar', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al aceptar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  declineRequest(req: PendingFriendRequestDto): void {
    this.friendsService.remove(req.requestId).subscribe({
      next: () => {
        this.pendingRequests.update(p => p.filter(r => r.requestId !== req.requestId));
        this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  cancelSent(req: SentFriendRequestDto): void {
    this.friendsService.remove(req.requestId).subscribe({
      next: () => {
        this.sentRequests.update(s => s.filter(r => r.requestId !== req.requestId));
        this.snackBar.open('Solicitud cancelada', 'Cerrar', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al cancelar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  removeFriend(friend: FriendDto): void {
    this.friendsService.remove(friend.requestId).subscribe({
      next: () => {
        this.friends.update(f => f.filter(fr => fr.requestId !== friend.requestId));
        this.snackBar.open('Amigo eliminado', 'Cerrar', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al eliminar amigo', 'Cerrar', { duration: 3000 })
    });
  }

  userInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
