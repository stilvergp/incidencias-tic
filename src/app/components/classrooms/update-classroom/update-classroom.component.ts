import {Component, inject, Input, OnInit} from '@angular/core';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {IonButton, IonContent} from "@ionic/angular/standalone";
import {NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {UtilsService} from "../../../services/utils.service";
import {FirebaseService} from "../../../services/firebase.service";
import {addIcons} from "ionicons";
import {alertCircleOutline, checkmarkOutline} from "ionicons/icons";

@Component({
  selector: 'app-update-classroom',
  templateUrl: './update-classroom.component.html',
  styleUrls: ['./update-classroom.component.scss'],
  imports: [
    HeaderComponent,
    IonButton,
    IonContent,
    NgIf,
    ReactiveFormsModule,
    CustomInputComponent
  ]
})
export class UpdateClassroomComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  @Input() classroom: any;

  form = new FormGroup({
    id: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]),
    location: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)])
  });

  /**
   * Inicializa el componente, añade íconos y precarga el formulario si se pasa un aula existente.
   */
  ngOnInit() {
    addIcons({checkmarkOutline, alertCircleOutline});
    if (this.classroom) {
      this.form.patchValue(this.classroom);
    }
  }

  /**
   * Envía los cambios del formulario si es válido y actualiza el aula.
   * @returns {Promise<void>}
   */
  async submit(): Promise<void> {
    if (this.form.invalid) return;

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      const updatedClassroom = {...this.form.value};
      delete updatedClassroom.id;

      const path = `classrooms/${this.classroom.id}`;
      await this.firebaseService.updateDocument(path, updatedClassroom);

      this.utilsService.dismissModal({success: true});
      this.utilsService.presentToast({
        message: 'Aula actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-outline'
      });
    } catch (error: any) {
      this.utilsService.presentToast({
        message: error.message || 'Error al actualizar el aula',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }
}
