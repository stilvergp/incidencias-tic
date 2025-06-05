import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {IonButton, IonCheckbox, IonContent, IonIcon, IonItem, IonLabel} from '@ionic/angular/standalone';
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {addIcons} from "ionicons";
import {
  alertCircleOutline,
  alertOutline, checkmarkOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosed,
  mailOutline,
  personAddOutline,
  personOutline
} from "ionicons/icons";
import {User} from "../../../models/user.model";

@Component({
  selector: 'app-create-privileged-user',
  templateUrl: './create-privileged-user.page.html',
  styleUrls: ['./create-privileged-user.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, CustomInputComponent, HeaderComponent, IonButton, IonIcon, ReactiveFormsModule, IonItem, IonLabel, IonCheckbox]
})
export class CreatePrivilegedUserPage {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    name: new FormControl('', [Validators.required, Validators.minLength(6)]),
    tic_role: new FormControl(0),
    admin_role: new FormControl(0),
    uid: new FormControl('')
  });

  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  constructor() {
    addIcons({mailOutline, lockClosed, alertCircleOutline, eyeOutline, eyeOffOutline, personOutline, personAddOutline, checkmarkOutline});
  }

  /**
   * Envía el formulario de registro de usuario.
   * Si el formulario es válido, muestra un loader, crea un nuevo usuario en Firebase Auth,
   * actualiza el UID en el formulario y llama a `setUserInfo` para guardar los datos en la base de datos.
   *
   * @returns {Promise<void>} Promesa que se resuelve cuando todo el proceso de registro ha finalizado.
   */
  async submit(): Promise<void> {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      this.firebaseService.signUp(this.form.value as User)
        .then((res) => {
        let uid = res.user!.uid;
        this.form.controls.uid.setValue(uid);
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
   * Guarda los datos del usuario en la base de datos de Firebase.
   * Elimina el campo `password` antes de guardar. Si tiene éxito, limpia el formulario.
   *
   * @param {string} uid - Identificador único del usuario en Firebase Auth.
   * @returns {Promise<void>} Promesa que se resuelve tras guardar los datos del usuario.
   */
  async setUserInfo(uid: string): Promise<void> {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      let path = `users/${uid}`;
      delete this.form.value.password;

      this.firebaseService.addDocument(path, this.form.value)
        .then(() => {
          this.form.reset();
        })
        .catch(() => {
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

  /**
   * Alterna manualmente el valor de un campo checkbox dentro del formulario reactivo.
   *
   * @param {Event} event - Evento del clic en el checkbox.
   * @param {string} controlName - Nombre del control del formulario a modificar.
   */
  toggleCheckbox(event: Event, controlName: string) {
    event.preventDefault();
    const control = this.form.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }
}
