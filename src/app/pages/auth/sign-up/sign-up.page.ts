import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {IonButton, IonContent, IonIcon} from '@ionic/angular/standalone';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {User} from "../../../models/user.model";
import {
  alertOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosed,
  mailOutline,
  personAddOutline,
  personOutline
} from "ionicons/icons";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {addIcons} from "ionicons";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, CustomInputComponent, IonButton, IonIcon, ReactiveFormsModule]
})
export class SignUpPage {
  signUpForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    name: new FormControl('', [Validators.required, Validators.minLength(6)]),
    tic_role: new FormControl(false),
    admin_role: new FormControl(false),
    uid: new FormControl('')
  });

  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  constructor() {
    addIcons({mailOutline, lockClosed, alertOutline, eyeOutline, eyeOffOutline, personOutline, personAddOutline});
  }

  /**
   * Registra un nuevo usuario si el formulario es válido.
   * Muestra un loader, crea el usuario con Firebase, actualiza su nombre y guarda el UID en el formulario.
   * Luego llama a `setUserInfo` para guardar los datos del usuario en Firestore.
   */
  async submit() {
    if (this.signUpForm.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();
      this.firebaseService
        .signUp(this.signUpForm.value as User)
        .then(async (res) => {
          this.firebaseService.updateUser(this.signUpForm.value.name!)
          let uid = res.user!.uid;
          this.signUpForm.controls.uid.setValue(uid);
          this.setUserInfo(uid);
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

  /**
   * Guarda los datos del nuevo usuario en Firestore y redirige según su rol.
   * Elimina la contraseña antes de guardar y muestra un toast según el resultado.
   *
   * @param {string} uid - UID del usuario recién registrado.
   */
  async setUserInfo(uid: string) {
    if (this.signUpForm.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      let path = `users/${uid}`;
      delete this.signUpForm.value.password;

      this.firebaseService
        .setDocument(path, this.signUpForm.value)
        .then((res) => {
          this.utilsService.saveInLocalStorage('user', this.signUpForm.value);
          this.signUpForm.reset();
          const user = this.utilsService.getFromLocalStorage('user');
          this.utilsService.routerLink(user.tic_role === 1 ? 'main/incidencias' : 'main/mis-incidencias');
        })
        .catch((error) => {
          this.utilsService.presentToast({
            message: 'Error al crear usuario',
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
}
