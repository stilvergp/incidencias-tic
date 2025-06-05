import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonImg,
  IonSkeletonText
} from '@ionic/angular/standalone';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {Classroom} from "../../../models/classroom.model";
import {Device} from "../../../models/device.model";
import {User} from "../../../models/user.model";
import {addIcons} from "ionicons";
import {alertCircleOutline, barcodeOutline, schoolOutline} from "ionicons/icons";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-device-details',
  templateUrl: './device-details.page.html',
  styleUrls: ['./device-details.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonImg, IonSkeletonText]
})
export class DeviceDetailsPage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  classroom: Classroom = {} as Classroom;
  device: Device = {} as Device;
  user: User = {} as User;
  isLoading: boolean = true;

  constructor(private route: ActivatedRoute) {
    addIcons({barcodeOutline, schoolOutline, alertCircleOutline});
  }

  /**
   * Método que se ejecuta al iniciar el componente.
   * Obtiene el usuario almacenado localmente y extrae parámetros de ruta (classroomId y deviceId).
   * Si ambos están presentes, se llama a `getDevice` para cargar los datos del dispositivo.
   */
  ngOnInit() {
    this.user = this.utilsService.getLocalStoredUser() as User;
    this.route.params.subscribe(params => {
      const classroomId = params['classroomId'];
      const deviceId = params['deviceId'];
      if (classroomId && deviceId) {
        this.getDevice(classroomId, deviceId);
      }
    });
  }

  /**
   * Obtiene los datos de un dispositivo específico desde Firebase y los asigna a `this.device`.
   * También llama a `getClassroom` para obtener los datos del aula correspondiente.
   *
   * @param {string} classroomId - ID del aula a la que pertenece el dispositivo.
   * @param {string} deviceId - ID del dispositivo a consultar.
   * @returns {void}
   */
  getDevice(classroomId: string, deviceId: string): void {
    this.isLoading = true;
    const path = `classrooms/${classroomId}/devices/${deviceId}`;
    this.firebaseService.getDocument(path)
      .then(async (device: any) => {
        this.device = device;
        await this.getClassroom(classroomId);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error(error);
        this.isLoading = false;
      });
  }

  /**
   * Obtiene los datos de un aula específica desde Firebase y los asigna a `this.classroom`.
   *
   * @param {string} id - ID del aula a consultar.
   * @returns {Promise<void>} Promesa que se resuelve cuando los datos del aula se han cargado.
   */
  async getClassroom(id: string): Promise<void> {
    const path = `classrooms/${id}`;
    return this.firebaseService.getDocument(path)
      .then((classroom: any) => {
        this.classroom = classroom;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Devuelve una etiqueta en texto legible para el estado del dispositivo.
   *
   * @param {Device['status']} status - Estado del dispositivo ('WORKING' u 'OUT_OF_SERVICE').
   * @returns {string} Texto descriptivo del estado del dispositivo.
   */
  getStatusLabel(status: Device['status']): string {
    switch (status) {
      case 'WORKING':
        return 'Funciona';
      case 'OUT_OF_SERVICE':
        return 'Fuera de servicio';
    }
  }

  /**
   * Devuelve un color en según el estado del dispositivo.
   *
   * @param {Device['status']} status - Estado del dispositivo ('WORKING' o 'OUT_OF_SERVICE').
   * @returns {string} Color del estado del dispositivo.
   */
  getStatusColor(status: Device['status']): string {
    switch (status) {
      case 'WORKING':
        return '#10b981';
      case 'OUT_OF_SERVICE':
        return '#ef4444';
    }
  }
}
