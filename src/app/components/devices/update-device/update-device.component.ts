import {Component, inject, Input, OnInit} from '@angular/core';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption
} from "@ionic/angular/standalone";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {SupabaseService} from "../../../services/supabase.service";
import {Classroom} from "../../../models/classroom.model";
import {addIcons} from "ionicons";
import {addCircleOutline, checkmarkOutline, imageOutline} from "ionicons/icons";
import {User} from "../../../models/user.model";

@Component({
  selector: 'app-update-device',
  templateUrl: './update-device.component.html',
  styleUrls: ['./update-device.component.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    FormsModule,
    ReactiveFormsModule,
    IonIcon,
    NgIf,
    IonButton,
    IonItem,
    IonSelectOption,
    IonLabel,
    IonSelect,
    IonInput,
    NgForOf
  ]
})
export class UpdateDeviceComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);

  @Input() device: any;

  classrooms: Classroom[] = [];
  selectedClassroomId: string = '';
  originalClassroomId: string = '';
  originalImage = '';
  user = {} as User;

  form = new FormGroup({
    image: new FormControl('', Validators.required),
    type: new FormControl('', Validators.required),
    status: new FormControl('', Validators.required),
    serial_number: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]),
    brand: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]),
    isOutOfService: new FormControl(false),
    classroomId: new FormControl('', Validators.required),
    id: new FormControl('')
  });

  constructor() {
    addIcons({imageOutline, addCircleOutline, checkmarkOutline});
  }

  /**
   * Inicializa el usuario, datos del equipo y aulas disponibles.
   */
  ngOnInit() {
    this.user = this.utilsService.getFromLocalStorage('user');
    this.loadDeviceData();
    this.getClassrooms();
  }

  /**
   * Carga los datos del equipo existente en el formulario.
   */
  loadDeviceData() {
    if (!this.device) return;
    this.form.patchValue(this.device);
    this.originalImage = this.device.image;
    this.selectedClassroomId = this.device.classroomId;
    this.originalClassroomId = this.device.classroomId;
    this.form.controls.classroomId.setValue(this.device.classroomId);
  }

  /**
   * Captura una imagen desde la cámara del dispositivo o desde el almacenamiento del mismo y la guarda en el formulario.
   * @returns {Promise<void>}
   */
  async takeImage(): Promise<void> {
    const result = await this.utilsService.takePicture('Actualizar imagen');
    if (result?.dataUrl) {
      this.form.controls.image.setValue(result.dataUrl);
    }
  }

  /**
   * Envía el formulario si es válido y actualiza el equipo.
   */
  submit() {
    if (this.form.valid) {
      this.updateDevice();
    }
  }

  /**
   * Actualiza el ID del aula seleccionada en el formulario.
   * @param newClassroomId ID del aula seleccionada
   */
  onClassroomChange(newClassroomId: string) {
    this.selectedClassroomId = newClassroomId;
    this.form.controls.classroomId.setValue(newClassroomId);
  }

  /**
   * Actualiza los datos del equipo, incluyendo la imagen si ha cambiado,
   * y gestiona el cambio de aula si se ha realizado.
   * @returns {Promise<void>}
   */
  async updateDevice(): Promise<void> {
    if (this.form.invalid || !this.selectedClassroomId) return;
    const loading = await this.utilsService.loading();
    await loading.present();
    try {
      if (this.form.value.image !== this.originalImage) {
        const imageDataUrl = this.form.value.image;
        const oldImagePath = await this.supabaseService.getFilePath(this.originalImage);
        await this.supabaseService.deleteFile(oldImagePath!);
        const imagePath = `${this.user.uid}/${Date.now()}`;
        const imageUrl = await this.supabaseService.uploadImage(imagePath, imageDataUrl!);
        this.form.controls.image.setValue(imageUrl);
      }

      const updatedData = {...this.form.value};
      delete updatedData.id;

      const oldPath = `classrooms/${this.originalClassroomId}/devices/${this.device.id}`;
      const newPath = `classrooms/${this.selectedClassroomId}/devices/${this.device.id}`;

      updatedData.classroomId = this.selectedClassroomId;

      if (this.selectedClassroomId !== this.originalClassroomId) {
        await this.firebaseService.deleteDocument(oldPath);
        await this.firebaseService.setDocument(newPath, updatedData);
      } else {
        await this.firebaseService.updateDocument(newPath, updatedData);
      }
      this.utilsService.dismissModal({success: true});
      this.utilsService.presentToast({
        message: 'Equipo actualizado exitosamente',
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
   * Obtiene la lista de aulas desde Firebase.
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
      },
    });
  }
}
