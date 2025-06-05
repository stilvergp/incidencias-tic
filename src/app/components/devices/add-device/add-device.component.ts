import {Component, inject, OnInit} from '@angular/core';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {IonButton, IonContent, IonIcon, IonItem, IonLabel, IonSelect, IonSelectOption} from "@ionic/angular/standalone";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {User} from "../../../models/user.model";
import {Classroom} from "../../../models/classroom.model";
import {SupabaseService} from "../../../services/supabase.service";
import {UtilsService} from "../../../services/utils.service";
import {FirebaseService} from "../../../services/firebase.service";
import {addIcons} from "ionicons";
import {alertCircleOutline, checkmarkOutline, imageOutline} from "ionicons/icons";

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    ReactiveFormsModule,
    IonIcon,
    IonButton,
    NgIf,
    CustomInputComponent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    NgForOf
  ]
})
export class AddDeviceComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);

  classrooms: Classroom[] = [];
  user = {} as User;

  form = new FormGroup({
    image: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    status: new FormControl('WORKING', [Validators.required]),
    serial_number: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]),
    brand: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]),
    classroomId: new FormControl('', [Validators.required]),
  });

  constructor() {
    addIcons({imageOutline, checkmarkOutline, alertCircleOutline});
  }

  /**
   * Carga el usuario desde almacenamiento local y llama al método que recupera las aulas.
   */
  ngOnInit() {
    this.user = this.utilsService.getFromLocalStorage('user');
    this.getClassrooms();
  }

  /**
   * Envía el formulario y añade un nuevo equipo si es válido.
   * @returns {Promise<void>}
   */
  async submit(): Promise<void> {
    if (this.form.valid) {
      await this.addDevice();
    }
  }

  /**
   * Añade un nuevo equipo a Firebase y sube su imagen a Supabase.
   * Muestra mensajes de carga, éxito o error.
   * @returns {Promise<void>}
   */
  async addDevice(): Promise<void> {
    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      const imagePath = `${this.user.uid}/${Date.now()}`;
      const imageUrl = await this.supabaseService.uploadImage(imagePath, this.form.value.image!);
      this.form.controls.image.setValue(imageUrl);

      const data = {
        ...this.form.value,
        id: '',
      };

      const path = `classrooms/${data.classroomId}/devices`;
      await this.firebaseService.addDocument(path, data);
      this.utilsService.dismissModal({success: true});
      this.utilsService.presentToast({
        message: 'Equipo añadido exitosamente',
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

  /**
   * Captura una imagen desde la cámara del dispositivo o desde el almacenamiento del mismo y la guarda en el formulario.
   * @returns {Promise<void>}
   */
  async takeImage(): Promise<void> {
    const dataUrl = (
      await this.utilsService.takePicture('Imagen del equipo')
    ).dataUrl;
    if (dataUrl) {
      this.form.controls.image.setValue(dataUrl);
    }
  }

  /**
   * Obtiene la lista de aulas desde Firebase y la asigna al componente.
   */
  getClassrooms() {
    const path = 'classrooms';
    let sub = this.firebaseService.getCollectionData(path).subscribe({
      next: (data) => {
        this.classrooms = data;
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        sub.unsubscribe();
      }
    });
  }
}
