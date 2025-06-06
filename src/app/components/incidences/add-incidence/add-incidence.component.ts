import {Component, inject, OnInit} from '@angular/core';
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {SupabaseService} from "../../../services/supabase.service";
import {User} from "../../../models/user.model";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
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
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {CustomInputComponent} from "../../../shared/components/custom-input/custom-input.component";
import {Classroom} from "../../../models/classroom.model";
import {Device} from "../../../models/device.model";
import {addIcons} from "ionicons";
import {addCircleOutline, alertCircleOutline, checkmarkOutline, imageOutline} from "ionicons/icons";
import {Observable} from "rxjs";

@Component({
  selector: 'app-add-incidence',
  templateUrl: './add-incidence.component.html',
  styleUrls: ['./add-incidence.component.scss'],
  imports: [
    IonButton,
    IonIcon,
    NgIf,
    ReactiveFormsModule,
    HeaderComponent,
    IonContent,
    CustomInputComponent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    NgForOf,
    IonTextarea
  ]
})
export class AddIncidenceComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);

  classrooms: Classroom[] = [];
  devices: Device[] = [];

  user = {} as User;

  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    description: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]),
    status: new FormControl('OPEN'),
    createdAt: new FormControl(Date.now()),
    image: new FormControl('', [Validators.required]),
    classroomId: new FormControl('', [Validators.required]),
    reportedByUserId: new FormControl('', [Validators.required]),
    deviceId: new FormControl({value: '', disabled: true}, [Validators.required]),
    diagnose: new FormControl('',),
    isClosed: new FormControl(false),
    id: new FormControl(''),
  });

  constructor() {
    addIcons({imageOutline, addCircleOutline, checkmarkOutline, alertCircleOutline});
  }

  /**
   * Método que se ejecuta al iniciar el componente.
   * Obtiene el usuario desde localStorage y carga las aulas disponibles y también asigna el ID del usuario al campo `reportedByUserId` del formulario.
   */
  ngOnInit() {
    this.user = this.utilsService.getFromLocalStorage('user');
    this.form.get("reportedByUserId")?.setValue(this.user.uid);
    this.getClassrooms();
  }

  /**
   * Captura una imagen desde la cámara del dispositivo o desde el almacenamiento del mismo y la guarda en el formulario.
   * @returns {Promise<void>}
   */
  async takeImage(): Promise<void> {
    const dataUrl = (
      await this.utilsService.takePicture('Imagen de la incidencia')
    ).dataUrl;
    if (dataUrl) {
      this.form.controls.image.setValue(dataUrl);
    }
  }

  /**
   * Envía el formulario si es válido, creando una nueva incidencia.
   */
  submit() {
    if (this.form.valid) {
      this.createIncidence();
    }
  }

  /**
   * Crea una incidencia nueva y la guarda en Firebase bajo dos rutas:
   * una privada del usuario y otra general. También sube la imagen a Supabase
   * y añade un comentario inicial si lo hubiera.
   *
   * @returns {Promise<void>}
   */
  async createIncidence(): Promise<void> {
    const loading = await this.utilsService.loading();
    await loading.present();

    const userPath = `users/${this.user.uid}/incidences`;
    const imageDataUrl = this.form.value.image;
    const imagePath = `${this.user.uid}/${Date.now()}`;
    const imageUrl = await this.supabaseService.uploadImage(imagePath, imageDataUrl!);
    this.form.controls.image.setValue(imageUrl);
    delete this.form.value.id;

    const incidenceData = {...this.form.value};

    try {
      const incidenceRef = await this.firebaseService.addDocument(userPath, incidenceData);
      const incidenceId = incidenceRef.id;

      const generalPath = `incidences/${incidenceId}`;
      await this.firebaseService.setDocument(generalPath, {
        ...incidenceData,
        userId: this.user.uid
      });

      this.utilsService.dismissModal({success: true});
      this.utilsService.presentToast({
        message: 'Incidencia añadida exitosamente',
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
   * Obtiene el listado de aulas desde Firebase y lo guarda en la propiedad `classrooms`.
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

  /**
   * Obtiene los dispositivos de un aula específica desde Firebase.
   *
   * @param {string} classroomId - ID del aula de la cual obtener los dispositivos.
   * @returns {Observable<any[]>} - Observable con los dispositivos encontrados.
   */
  getDevices(classroomId: string): Observable<any[]> {
    const path = `classrooms/${classroomId}/devices`;
    return this.firebaseService.getCollectionData(path);
  }

  /**
   * Se ejecuta cuando se cambia el aula seleccionada en el formulario.
   * Reinicia el campo de dispositivos y carga los dispositivos del aula seleccionada.
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
      }
    });
  }
}
