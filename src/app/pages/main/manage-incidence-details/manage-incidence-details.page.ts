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
import {Incidence} from "../../../models/incidence.model";
import {Classroom} from "../../../models/classroom.model";
import {Device} from "../../../models/device.model";
import {Comment} from "../../../models/comment.model";
import {User} from "../../../models/user.model";
import {addIcons} from "ionicons";
import {alertCircleOutline, laptopOutline, schoolOutline} from "ionicons/icons";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-manage-incidence-details',
  templateUrl: './manage-incidence-details.page.html',
  styleUrls: ['./manage-incidence-details.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonImg, IonSkeletonText]
})
export class ManageIncidenceDetailsPage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  incidence: Incidence = {} as Incidence;
  classroom: Classroom = {} as Classroom;
  device: Device = {} as Device;
  user: User = {} as User;
  isLoading: boolean = true;
  comments: Comment[] = [];

  constructor(private route: ActivatedRoute) {
    addIcons({schoolOutline, laptopOutline, alertCircleOutline});
  }

  /**
   * Inicializa el componente.
   * Obtiene el usuario local y carga la incidencia según el parámetro de la ruta.
   */
  ngOnInit() {
    this.user = this.utilsService.getLocalStoredUser() as User;
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.getIncidence(id);
    });
  }

  /**
   * Obtiene la incidencia su aula, dispositivo y comentarios asociados.
   * @param id ID de la incidencia.
   */
  getIncidence(id: string) {
    this.isLoading = true;
    const path = `incidences/${id}`;
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
    const commentsPath = `incidences/${id}/comments`;
    this.firebaseService.getCollectionData(commentsPath).subscribe({
      next: (comments: any) => {
        this.comments = comments;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  /**
   * Obtiene el dispositivo por ID dentro del aula actual.
   * @param id ID del dispositivo.
   */
  async getDevice(id: string) {
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
   * Obtiene el aula por ID.
   * @param id ID del aula.
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
   * Obtiene etiqueta legible para el estado de una incidencia.
   * @param status Estado de la incidencia.
   * @returns Etiqueta.
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
   * Obtiene el color asociado al estado de una incidencia.
   * @param status Estado de la incidencia.
   * @returns Color.
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
