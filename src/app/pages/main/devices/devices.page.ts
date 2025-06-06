import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner
} from '@ionic/angular/standalone';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {Device} from "../../../models/device.model";
import {debounceTime, Subject, Subscription} from "rxjs";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {User} from "../../../models/user.model";
import {addIcons} from "ionicons";
import {addOutline, search, trashOutline} from "ionicons/icons";
import {Classroom} from "../../../models/classroom.model";
import {UpdateDeviceComponent} from "../../../components/devices/update-device/update-device.component";
import {RouterLink} from "@angular/router";
import {AddDeviceComponent} from "../../../components/devices/add-device/add-device.component";

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonRefresher, IonRefresherContent, IonLabel, IonSelect, IonSelectOption, IonButton, IonIcon, IonInput, IonCard, IonCardContent, IonCardHeader, IonSkeletonText, IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent, IonCardTitle, RouterLink, IonFab, IonFabButton]
})
export class DevicesPage implements OnDestroy, OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  user: User;
  loading = false;
  selectedClassroomId: string = '';
  selectedClassroom!: Classroom;
  classrooms: Classroom[] = [];
  devices: Device[] = [];
  devicesSubscription?: Subscription;
  visibleCount = 5;
  loadStep = 5;
  statusFilter: Device['status'] | '' = '';
  orderByFilter: string = '';
  searchValue: string = '';
  canLoadMore: boolean = true;
  searchSubject = new Subject<string>();

  constructor() {
    this.user = this.utilsService.getLocalStoredUser() as User;
    this.searchSubject.pipe(debounceTime(700)).subscribe((value) => {
      if (value.length === 0 || value.length >= 3) {
        this.getDevices();
      }
    });

    addIcons({search, addOutline, trashOutline});
  }

  /**
   * Método que se ejecuta al inicializar el componente.
   * Llama a `getClassrooms` para cargar la lista de aulas.
   */
  ngOnInit() {
    this.getClassrooms();
  }

  /**
   * Método que se ejecuta al destruir el componente.
   * Cancela la suscripción a la colección de dispositivos si existe.
   */
  ngOnDestroy() {
    if (this.devicesSubscription) {
      this.devicesSubscription.unsubscribe();
    }
  }

  /**
   * Obtiene la lista de aulas desde Firebase.
   * Si hay aulas disponibles, selecciona una por defecto y carga sus dispositivos.
   */
  getClassrooms() {
    this.loading = true;
    const path = 'classrooms';

    this.firebaseService.getCollectionData(path).subscribe({
      next: (data: Classroom[]) => {
        this.classrooms = data;

        if (this.classrooms.length > 0) {
          this.selectedClassroomId = this.selectedClassroomId || this.classrooms[0].id;
          this.getDevices();
        }

        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

  /**
   * Carga los dispositivos del aula seleccionada desde Firebase.
   * Aplica filtros por estado, orden y búsqueda si están puestos.
   */
  async getDevices() {
    this.loading = true;

    this.selectedClassroom = this.classrooms.find(c => c.id === this.selectedClassroomId)!;

    if (this.devicesSubscription) {
      this.devicesSubscription.unsubscribe();
    }
    const path = `classrooms/${this.selectedClassroomId}/devices`;
    this.devicesSubscription = this.firebaseService.getCollectionData(path).subscribe({
      next: (data: Device[]) => {
        let filteredDevices = data;

        if (this.statusFilter) {
          filteredDevices = filteredDevices.filter(device => device.status === this.statusFilter);
        }

        if (this.orderByFilter === 'type') {
          filteredDevices.sort((a, b) => a.type.localeCompare(b.type));
        } else if (this.orderByFilter === 'brand') {
          filteredDevices.sort((a, b) => a.brand.localeCompare(b.brand));
        }

        filteredDevices = filteredDevices.filter(device => this.filterBySearch(device));

        this.devices = filteredDevices.slice(0, this.visibleCount);
        this.canLoadMore = filteredDevices.length > this.visibleCount;

        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

  /**
   * Abre un modal para actualizar un dispositivo.
   * Si se actualiza correctamente, recarga la lista de dispositivos.
   *
   * @param {Device} device - Dispositivo que se desea actualizar.
   */
  async updateDevice(device: Device) {
    let success = await this.utilsService.presentModal({
      component: UpdateDeviceComponent,
      cssClass: 'update-device',
      componentProps: {device}
    });
    if (success) {
      this.getDevices();
    }
  }

  /**
   * Ejecuta la recarga manual de dispositivos.
   * Reinicia el contador de visibilidad y recarga los dispositivos.
   *
   * @param {any} event - Evento del refresco.
   */
  doRefresh(event: any) {
    this.visibleCount = this.loadStep;
    this.getDevices().then(() => event.target.complete());
  }

  /**
   * Actualiza el valor de búsqueda introducido por el usuario.
   *
   * @param {string} value - Texto de búsqueda.
   */
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  /**
   * Filtra un dispositivo según el valor de búsqueda.
   *
   * @param {Device} device - Dispositivo a evaluar.
   * @returns {boolean} `true` si coincide con la búsqueda, `false` en caso contrario.
   */
  filterBySearch(device: Device): boolean {
    if (!this.searchValue) return true;
    return device.type.toLowerCase().includes(this.searchValue.toLowerCase()) ||
      device.serial_number.toLowerCase().includes(this.searchValue.toLowerCase()) ||
      device.brand.toLowerCase().includes(this.searchValue.toLowerCase());
  }

  /**
   * Carga más dispositivos, aumentando el número visible.
   *
   * @param {any} event - Evento de paginación.
   */
  loadMoreDevices(event: any) {
    this.visibleCount += this.loadStep;
    this.getDevices().then(() => {
      event.target.complete();
    });
  }

  /**
   * Devuelve la etiqueta de texto legible del estado del dispositivo.
   *
   * @param {Device['status']} status - Estado del dispositivo.
   * @returns {string} Estado del dispositivo.
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
   * Devuelve el color asociado a un estado de dispositivo.
   *
   * @param {Device['status']} status - Estado del dispositivo.
   * @returns {string} Color.
   */
  getStatusColor(status: Device['status']): string {
    switch (status) {
      case 'WORKING':
        return '#10b981';
      case 'OUT_OF_SERVICE':
        return '#ef4444';
    }
  }

  /**
   * Abre un modal para añadir un nuevo dispositivo.
   * Si se añade correctamente, recarga la lista de dispositivos.
   */
  async addDevice() {
    let success = await this.utilsService.presentModal({
      component: AddDeviceComponent,
      cssClass: 'add-modal',
    });

    if (success) {
      this.getDevices();
    }
  }

  /**
   * Elimina un dispositivo en Firebase.
   * Muestra un mensaje de éxito o error mediante un toast.
   *
   * @param {Device} device - Dispositivo a eliminar.
   */
  deleteDevice(device: Device) {
    this.firebaseService.deleteDocument(`classrooms/${this.selectedClassroom.id}/devices/${device.id}`)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Dispositivo borrado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-outline'
        });
      })
      .catch(error => {
        this.utilsService.presentToast({
          message: error.message || 'Error al borrar el dispositivo',
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      });
  }
}
