import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {IonButton, IonContent, IonIcon} from '@ionic/angular/standalone';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {addIcons} from "ionicons";
import {
  alertCircleOutline,
  alertOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  logInOutline,
  mailOutline,
  mailUnreadOutline,
  personAddOutline,
  sendOutline
} from "ionicons/icons";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, CustomInputComponent, IonButton, IonIcon, ReactiveFormsModule]
})
export class ForgotPasswordPage {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      alertOutline,
      eyeOutline,
      eyeOffOutline,
      logInOutline,
      personAddOutline,
      alertCircleOutline,
      mailUnreadOutline,
      sendOutline,
    })
  }

  /**
   * Envía un correo de recuperación de contraseña al email proporcionado.
   * Muestra un loader mientras se realiza la operación.
   * Si se envía correctamente, se muestra un toast de éxito, se reinicia el formulario
   * y se redirige al login. Si falla, muestra un toast de error.
   */
  async submit() {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.firebaseService
      .sendRecoveryEmail(this.form.value.email!)
      .then((res) => {
        this.utilsService.presentToast({
          message: "Correo enviado correctamente. Revise su bandeja de entrada.",
          duration: 1500,
          color: 'primary',
          position: 'middle',
          icon: 'mail-unread-outline',
        });
        this.form.reset();
        this.utilsService.routerLink("/auth");
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
}
