import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-row-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './row-actions.component.html',
  styleUrl: './row-actions.component.scss'
})
export class RowActionsComponent {
  @Input() showLeave = false;
  @Input() showEdit = true;
  @Input() showDelete = true;

  @Input() leaveTooltip = 'Salir';
  @Input() editTooltip = 'Editar';
  @Input() deleteTooltip = 'Eliminar';

  @Input() leaveIcon = 'logout';
  @Input() editIcon = 'edit';
  @Input() deleteIcon = 'delete';

  @Output() leaveAction = new EventEmitter<void>();
  @Output() editAction = new EventEmitter<void>();
  @Output() deleteAction = new EventEmitter<void>();
}
