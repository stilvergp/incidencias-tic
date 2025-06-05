import {Component, inject} from '@angular/core';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {IonButton, IonContent} from "@ionic/angular/standalone";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {addIcons} from "ionicons";
import {alertCircleOutline, checkmarkOutline} from "ionicons/icons";
import {UtilsService} from "../../../services/utils.service";
import {FirebaseService} from "../../../services/firebase.service";

@Component({
  selector: 'app-add-classroom',
  templateUrl: './add-classroom.component.html',
  styleUrls: ['./add-classroom.component.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    ReactiveFormsModule,
    NgIf,
    IonButton,
    CustomInputComponent
  ]
})
export class AddClassroomComponent {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]),
    location: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]),
  });

  constructor() {
    addIcons({checkmarkOutline, alertCircleOutline});
  }

  /**
   * Envía el formulario si es válido y llama al método que añade un aula.
   * @returns {Promise<void>}
   */
  async submit(): Promise<void> {
    if (this.form.valid) {
      await this.addClassroom();
    }
  }

  /**
   * Añade una nueva aula a la base de datos de Firebase.
   * Muestra mensajes de éxito o error según corresponda.
   * @returns {Promise<void>}
   */
  async addClassroom(): Promise<void> {
    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      const data = {
        ...this.form.value,
      };

      await this.firebaseService.addDocument('classrooms', data);
      this.utilsService.dismissModal({success: true});
      this.utilsService.presentToast({
        message: 'Aula añadida exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-outline',
      });
    } catch (error: any) {
      this.utilsService.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    } finally {
      loading.dismiss();
    }
  }

}
