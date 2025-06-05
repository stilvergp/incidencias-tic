import {Component, inject, Input, OnInit} from '@angular/core';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea
} from "@ionic/angular/standalone";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {Classroom} from "../../../models/classroom.model";
import {Device} from "../../../models/device.model";
import {User} from "../../../models/user.model";
import {addIcons} from "ionicons";
import {addCircleOutline, alertCircleOutline, checkmarkOutline, imageOutline} from "ionicons/icons";
import {Comment} from "../../../models/comment.model";

@Component({
  selector: 'app-manage-incidence',
  templateUrl: './manage-incidence.component.html',
  styleUrls: ['./manage-incidence.component.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    IonItem,
    IonLabel,
    IonText,
    IonSelectOption,
    IonSelect,
    IonTextarea,
    ReactiveFormsModule,
    IonList,
    IonButton,
    NgIf,
    NgForOf
  ]
})
export class ManageIncidenceComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  @Input() incidence: any;

  classroom: Classroom = {} as Classroom;
  device: Device = {} as Device;
  user = {} as User;
  comments: Comment[] = [];

  form = new FormGroup({
    status: new FormControl('OPEN', Validators.required),
    diagnose: new FormControl('', [Validators.minLength(5), Validators.maxLength(500)]),
    comments: new FormControl('', [Validators.minLength(5), Validators.maxLength(500)]),
    isClosed: new FormControl(false)
  });

  constructor() {
    addIcons({imageOutline, addCircleOutline, checkmarkOutline, alertCircleOutline});
  }

  /**
   * Se ejecuta al iniciar el componente.
   * Carga los datos del usuario desde localStorage y los de la incidencia actual.
   */
  ngOnInit() {
    this.user = this.utilsService.getFromLocalStorage('user');
    this.loadIncidenceData();
  }

  /**
   * Carga los datos de la incidencia, también obtiene el aula y el dispositivo asociados.
   */
  async loadIncidenceData() {
    this.form.patchValue({
      status: this.incidence.status || 'OPEN',
      diagnose: this.incidence.diagnose || '',
      isClosed: this.incidence.isClosed || false,
    });
    this.form.controls.status.setValue('IN_PROGRESS');
    await this.getClassroom(this.incidence.classroomId);
    await this.getDevice(this.incidence.deviceId);

    const commentsPath = `incidences/${this.incidence.id}/comments`;
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
   * Obtiene los datos del aula según el ID de la incidencia.
   *
   * @param {string} classroomId - ID del aula relacionada con la incidencia.
   */
  async getClassroom(classroomId: string) {
    const path = `classrooms/${classroomId}`;
    this.firebaseService.getDocument(path)
      .then((classroom: any) => {
        this.classroom = classroom;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Obtiene los datos del dispositivo afectado en la incidencia.
   *
   * @param {string} deviceId - ID del dispositivo relacionado con la incidencia.
   */
  async getDevice(deviceId: string) {
    const path = `classrooms/${this.incidence.classroomId}/devices/${deviceId}`;
    this.firebaseService.getDocument(path)
      .then((device: any) => {
        this.device = device;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Envía los cambios realizados en la incidencia si el formulario es válido.
   * Actualiza tanto la ruta del usuario como la general. Añade un comentario si se ha escrito.
   * También actualiza el estado a 'RESOLVED' si se ha completado un diagnóstico.
   */
  async submit() {
    if (this.form.invalid) return;
    const loading = await this.utilsService.loading();
    await loading.present();

    const incidencePath = `users/${this.incidence.reportedByUserId}/incidences/${this.incidence.id}`;
    const generalPath = `incidences/${this.incidence.id}`;
    const incidenceData = {...this.form.value};
    const newComment = this.form.value.comments?.trim();
    const diagnose = this.form.value.diagnose?.trim();

    if (diagnose) {
      this.form.controls.status.setValue('RESOLVED');
      incidenceData.status = 'RESOLVED';
      this.form.controls.isClosed.setValue(true);
      incidenceData.isClosed = true;
    }

    try {
      await Promise.all([
        this.firebaseService.updateDocument(incidencePath, incidenceData),
        this.firebaseService.updateDocument(generalPath, {
          ...incidenceData,
          userId: this.user.uid
        })
      ]);

      if (newComment) {
        const commentData = {
          userId: this.user.uid,
          message: newComment,
          createdAt: new Date(),
        };
        const userCommentsPath = `users/${this.user.uid}/incidences/${this.incidence.id}/comments`;
        const generalCommentsPath = `incidences/${this.incidence.id}/comments`;
        await Promise.all([
          this.firebaseService.addDocument(userCommentsPath, commentData),
          this.firebaseService.addDocument(generalCommentsPath, commentData)
        ]);
      }
      this.utilsService.dismissModal({success: true});
      this.utilsService.presentToast({
        message: 'Incidencia actualizada exitosamente',
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
