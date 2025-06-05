import {CommonModule} from '@angular/common';
import {Component, inject, Input} from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {closeCircleOutline} from 'ionicons/icons';
import {UtilsService} from "../../../services/utils.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonBackButton,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonHeader,
    CommonModule,
    IonMenuButton
  ],
})
export class HeaderComponent {
  @Input({required: true}) title!: string;
  @Input() backButtonURL: string | null = null;
  @Input() isModal: boolean = false;
  @Input() showMenuButton: boolean = false;

  utilsService = inject(UtilsService);

  constructor() {
    addIcons({closeCircleOutline});
  }

  dismissModal() {
    this.utilsService.dismissModal();
  }
}
