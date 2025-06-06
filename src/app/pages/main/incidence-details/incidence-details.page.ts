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
import {Incidence} from "../../../models/incidence.model";
import {Classroom} from "../../../models/classroom.model";
import {Device} from "../../../models/device.model";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user.model";
import {UtilsService} from "../../../services/utils.service";
import {FirebaseService} from "../../../services/firebase.service";
import {addIcons} from "ionicons";
import {alertCircleOutline, laptopOutline, schoolOutline} from "ionicons/icons";

@Component({
  selector: 'app-incidence-details',
  templateUrl: './incidence-details.page.html',
  styleUrls: ['./incidence-details.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonIcon, IonSkeletonText]
})
export class IncidenceDetailsPage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  incidence: Incidence = {} as Incidence;
  classroom: Classroom = {} as Classroom;
  device: Device = {} as Device;
  user: User = {} as User;
  isLoading: boolean = true;

  constructor(private route: ActivatedRoute) {
    addIcons({schoolOutline, laptopOutline, alertCircleOutline});
  }

  /**
   * Método de inicialización del componente.
   * Obtiene el usuario almacenado localmente y carga la incidencia según el ID de la ruta.
   */
  ngOnInit() {
    this.user = this.utilsService.getLocalStoredUser() as User;
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.getIncidence(id);
    });
  }

  /**
   * Obtiene la incidencia y sus comentarios desde Firebase.
   * También carga los datos del aula y dispositivo relacionados.
   *
   * @param {string} id - ID de la incidencia a obtener.
   */
  getIncidence(id: string) {
    this.isLoading = true;
    const path = `users/${this.user.uid}/incidences/${id}`;
    this.firebaseService.getDocument(path)
      .then((incidence: any) => {
        this.incidence = incidence;
        this.getClassroom(this.incidence.classroomId)
          .then(() => {
            this.getDevice(this.incidence.deviceId).then(() => {
              this.isLoading = false;
            });
          });
      })
      .catch((error) => {
        console.error(error);
        this.isLoading = false;
      });
  }

  /**
   * Obtiene el dispositivo relacionado con la incidencia desde Firebase.
   *
   * @param {string} id - ID del dispositivo.
   * @returns {Promise<void>}
   */
  async getDevice(id: string): Promise<void> {
    const path = `classrooms/${this.classroom.id}/devices/${id}`;
    return this.firebaseService.getDocument(path)
      .then((device: any) => {
        this.device = device;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Obtiene el aula relacionada con la incidencia desde Firebase.
   *
   * @param {string} id - ID del aula.
   * @returns {Promise<void>}
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
   * Devuelve una etiqueta de texto legible para el estado de la incidencia.
   *
   * @param {Incidence['status']} status - Estado actual de la incidencia.
   * @returns {string} Etiqueta.
   */
  getStatusLabel(status: Incidence['status']): string {
    switch (status) {
      case 'OPEN':
        return 'Abierta';
      case 'IN_PROGRESS':
        return 'En revisión';
      case 'RESOLVED':
        return 'Resuelta';
    }
  }

  /**
   * Devuelve un color asociado al estado de la incidencia.
   *
   * @param {Incidence['status']} status - Estado actual de la incidencia.
   * @returns {string} Color.
   */
  getStatusColor(status: Incidence['status']): string {
    switch (status) {
      case 'OPEN':
        return '#ef4444';
      case 'IN_PROGRESS':
        return '#ff9800';
      case 'RESOLVED':
        return '#10b981';
    }
  }
}
