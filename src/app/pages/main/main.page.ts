import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {addIcons} from "ionicons";
import {buildOutline, homeOutline, laptopOutline, logOutOutline, personAddOutline, schoolOutline} from "ionicons/icons";
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet
} from "@ionic/angular/standalone";
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {HeaderComponent} from "../../shared/components/header/header.component";
import {UtilsService} from "../../services/utils.service";
import {FirebaseService} from "../../services/firebase.service";
import {User} from "../../models/user.model";

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonMenuToggle, IonContent, IonIcon, IonItem, IonLabel, IonRouterOutlet, IonMenu, RouterLink, RouterLinkActive, HeaderComponent, IonFooter]
})
export class MainPage {
  router = inject(Router);
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  pages = [
    {
      title: 'Mis incidencias',
      url: 'mis-incidencias',
      icon: 'home-outline'
    },
  ];

  user: User;

  /**
   * Constructor del componente.
   * Inicializa la navegación del menu lateral según el rol del usuario actual.
   * Añade los iconos y configura las páginas disponibles para el usuario.
   */
  constructor() {
    addIcons({logOutOutline, homeOutline, buildOutline, laptopOutline, schoolOutline, personAddOutline});
    this.user = this.utilsService.getLocalStoredUser()!;
    if (this.user.tic_role) {
      this.pages.push({
        title: 'Gestionar incidencias',
        url: 'incidencias',
        icon: 'build-outline'
      });
    }
    if (this.user.admin_role) {
      this.pages.push({
        title: 'Inventario de equipos',
        url: 'inventario',
        icon: 'laptop-outline'
      });
      this.pages.push({
        title: 'Gestión de aulas',
        url: 'aulas',
        icon: 'school-outline'
      });
      this.pages.push({
        title: 'Añadir usuario con privilegios',
        url: 'create-privileged-user',
        icon: 'person-add-outline'
      });
    }
  }

  /**
   * Cierra la sesión del usuario actual y redirige a la página de inicio de sesión.
   */
  signOut() {
    this.firebaseService.signOut().then(() => {
      this.utilsService.routerLink("/auth");
    });
  }
}
