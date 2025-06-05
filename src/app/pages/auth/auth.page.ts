import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import {CustomInputComponent} from "../../shared/components/custom-input/custom-input.component";
import {IonButton, IonContent, IonIcon} from "@ionic/angular/standalone";
import {addIcons} from "ionicons";
import {
  alertCircleOutline,
  alertOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosed,
  logInOutline,
  mailOutline,
  personAddOutline, personCircleOutline
} from "ionicons/icons";
import {RouterLink} from "@angular/router";
import {HeaderComponent} from "../../shared/components/header/header.component";
import {User} from "../../models/user.model";
import {FirebaseService} from "../../services/firebase.service";
import {UtilsService} from "../../services/utils.service";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    CustomInputComponent,
    IonContent,
    IonButton,
    IonIcon,
    RouterLink,
    HeaderComponent
  ]
})
export class AuthPage {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  constructor() {
    addIcons({
      mailOutline,
      lockClosed,
      alertOutline,
      eyeOutline,
      eyeOffOutline,
      logInOutline,
      personAddOutline,
      personCircleOutline,
      alertCircleOutline
    })
  }

  /**
   * Inicia el proceso de inicio de sesión del usuario.
   * Muestra un loader, intenta autenticar con Firebase y, si es exitoso, obtiene la info del usuario.
   * Si falla, muestra un toast de error.
   */
  async submit() {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.firebaseService
      .signIn(this.form.value as User)
      .then((res) => {
        this.getUserInfo(res.user.uid);
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  /**
   * Obtiene los datos del usuario desde Firestore a partir del UID.
   * Guarda los datos en localStorage, redirige según el rol y muestra un toast de bienvenida.
   *
   * @param {string} uid - UID del usuario autenticado.
   */
  async getUserInfo(uid: string) {
    const loading = await this.utilsService.loading();
    await loading.present();

    let path = `users/${uid}`;

    this.firebaseService
      .getDocument(path)
      .then((userData: any) => {
        const user: User = userData;
        this.utilsService.saveInLocalStorage('user', user);
        this.utilsService.presentToast({
          message: `Sesión iniciada como ${user.name}`,
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'person-circle-outline',
        });
        this.form.reset();
        const storedUser = this.utilsService.getFromLocalStorage('user');
        this.utilsService.routerLink(storedUser.tic_role === 1 ? 'main/incidencias' : 'main/mis-incidencias');
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: 'Error, correo o contraseña equivocados',
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }

}
