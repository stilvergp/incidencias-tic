import {Component, inject, Input, OnInit} from '@angular/core';
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {SupabaseService} from "../../../services/supabase.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {User} from "../../../models/user.model";
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea
} from "@ionic/angular/standalone";
import {NgForOf, NgIf} from "@angular/common";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {Observable} from "rxjs";
import {addIcons} from "ionicons";
import {addCircleOutline, checkmarkOutline, imageOutline} from "ionicons/icons";
import {Device} from "../../../models/device.model";
import {Classroom} from "../../../models/classroom.model";

@Component({
  selector: 'app-update-incidence',
  templateUrl: './update-incidence.component.html',
  styleUrls: ['./update-incidence.component.scss'],
  imports: [
    ReactiveFormsModule,
    HeaderComponent,
    IonContent,
    IonIcon,
    NgIf,
    IonButton,
    CustomInputComponent,
    IonItem,
    IonTextarea,
    IonLabel,
    IonSelect,
    IonSelectOption,
    NgForOf
  ],
})
export class UpdateIncidenceComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);

  @Input() incidence: any;

  classrooms: Classroom[] = [];
  devices: Device[] = [];
  user = {} as User;
  originalImage = '';

  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    description: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]),
    status: new FormControl('OPEN'),
    createdAt: new FormControl(''),
    image: new FormControl('', [Validators.required]),
    classroomId: new FormControl('', [Validators.required]),
    reportedByUserId: new FormControl('', [Validators.required]),
    deviceId: new FormControl({value: '', disabled: true}, [Validators.required]),
    diagnose: new FormControl(''),
    isClosed: new FormControl(false),
    id: new FormControl(''),
  });

  constructor() {
    addIcons({imageOutline, addCircleOutline, checkmarkOutline});
  }

  /**
   * Inicializa el componente: obtiene el usuario, rellena el ID en el formulario,
   * carga los datos de la incidencia y las aulas disponibles.
   */
  ngOnInit() {
    this.user = this.utilsService.getFromLocalStorage('user');
    this.form.get('reportedByUserId')?.setValue(this.user.uid);
    this.loadIncidenceData();
    this.getClassrooms();
  }

  /**
   * Carga los datos de la incidencia en el formulario y habilita la selección de dispositivos.
   */
  loadIncidenceData() {
    if (!this.incidence) return;
    this.form.patchValue(this.incidence);
    this.originalImage = this.incidence.image;

    this.getDevices(this.incidence.classroomId).subscribe((devices) => {
      this.devices = devices;
      this.form.get('deviceId')?.enable();
    });
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
   * Valida el formulario y lanza la actualización de la incidencia si es válido.
   */
  submit() {
    if (this.form.valid) {
      this.updateIncidence();
    }
  }

  /**
   * Actualiza la incidencia en Firebase y Supabase.
   * Si la imagen fue cambiada, elimina la anterior y sube la nueva.
   */
  async updateIncidence() {
    const loading = await this.utilsService.loading();
    await loading.present();

    const userPath = `users/${this.user.uid}/incidences/${this.incidence.id}`;
    const generalPath = `incidences/${this.incidence.id}`;

    if (this.form.value.image !== this.originalImage) {
      const imageDataUrl = this.form.value.image;

      const oldImagePath = await this.supabaseService.getFilePath(this.originalImage);
      await this.supabaseService.deleteFile(oldImagePath!);
      const imagePath = `${this.user.uid}/${Date.now()}`;
      const imageUrl = await this.supabaseService.uploadImage(imagePath, imageDataUrl!);
      this.form.controls.image.setValue(imageUrl);
    }

    delete this.form.value.id;

    const updatedData = {...this.form.value};

    Promise.all([
      this.firebaseService.updateDocument(userPath, updatedData),
      this.firebaseService.updateDocument(generalPath, {
        ...updatedData,
        userId: this.user.uid
      })
    ])
      .then(async () => {
        this.utilsService.dismissModal({success: true});
        this.utilsService.presentToast({
          message: 'Incidencia actualizada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-outline',
        });
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
   * Obtiene la lista de aulas desde Firebase y la guarda en la propiedad `classrooms`.
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

  /**
   * Obtiene los dispositivos asociados a un aula concreta.
   *
   * @param {string} classroomId - ID del aula para buscar sus dispositivos.
   * @returns {Observable<any[]>} Observable con los dispositivos.
   */
  getDevices(classroomId: string): Observable<any[]> {
    const path = `classrooms/${classroomId}/devices`;
    return this.firebaseService.getCollectionData(path);
  }

  /**
   * Maneja el cambio de aula en el formulario.
   * Reinicia y desactiva el selector de dispositivo hasta que se cargan los nuevos dispositivos.
   *
   * @param {string} classroomId - ID del aula seleccionada.
   */
  onClassroomChange(classroomId: string) {
    this.form.controls.deviceId.reset();
    this.form.controls.deviceId.disable();

    this.getDevices(classroomId).subscribe({
      next: (devices) => {
        this.devices = devices;
        if (this.devices.length > 0) {
          this.form.controls.deviceId.enable();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
}
