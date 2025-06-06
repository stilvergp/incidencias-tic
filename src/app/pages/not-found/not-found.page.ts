import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonButton, IonContent} from "@ionic/angular/standalone";
import {UtilsService} from "../../services/utils.service";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton]
})
export class NotFoundPage {
  utilsService = inject(UtilsService);

  /**
   * Navega a la pantalla principal según el rol del usuario almacenado localmente.
   * Si no hay usuario almacenado, redirige a la página de autenticación.
   */
  goToHome() {
    const user = this.utilsService.getLocalStoredUser();
    if (user) {
      this.utilsService.routerLink(user.tic_role ? 'main/incidencias' : 'main/mis-incidencias');
    } else {
      this.utilsService.routerLink('auth');
    }
  }
}
