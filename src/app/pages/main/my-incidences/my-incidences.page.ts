import {Component, inject, OnDestroy} from '@angular/core';
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
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner
} from '@ionic/angular/standalone';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {addOutline, search, trashOutline} from "ionicons/icons";
import {UtilsService} from "../../../services/utils.service";
import {FirebaseService} from "../../../services/firebase.service";
import {debounceTime, Subject, Subscription} from "rxjs";
import {User} from "../../../models/user.model";
import {Incidence} from "../../../models/incidence.model";
import {UpdateIncidenceComponent} from "../../../components/incidences/update-incidence/update-incidence.component";
import {AddIncidenceComponent} from "../../../components/incidences/add-incidence/add-incidence.component";
import {QueryOptions} from "../../../services/query-options.interface";

@Component({
  selector: 'app-mis-incidencias',
  templateUrl: './my-incidences.page.html',
  styleUrls: ['./my-incidences.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonSegmentButton, IonSegment, IonButton, RouterLink, IonFab, IonFabButton, IonIcon, IonCardHeader, IonCard, IonCardTitle, IonCardContent, IonRefresherContent, IonRefresher, IonSpinner, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonLabel, IonSelect, IonSelectOption]
})
export class MyIncidencesPage implements OnDestroy {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  incidences: Incidence[] = [];
  segment: 'open' | 'closed' = 'open';
  loading: boolean = false;
  incidencesSubscription?: Subscription;
  user: User;
  resumen = {
    open: 0,
    closed: 0
  };
  visibleCount = 5;
  loadStep = 5;
  searchValue: string = '';
  statusFilter: Incidence['status'] | '' = '';
  lastVisible: any = null;
  canLoadMore: boolean = true;
  searchSubject = new Subject<string>();

  /**
   * Constructor del componente.
   * Inicializa el usuario local, suscribe el campo de búsqueda a un observable con debounceTime
   * para filtrar incidencias, añade iconos y obtiene el conteo inicial de incidencias.
   */
  constructor() {
    this.user = this.utilsService.getLocalStoredUser() as User;
    this.searchSubject.pipe(
      debounceTime(700)
    ).subscribe((value) => {
      if (value.length === 0 || value.length >= 3) {
        this.getIncidences();
      }
    });
    addIcons({search, addOutline, trashOutline});
    this.getIncidencesCount();
  }

  /**
   * Obtiene las incidencias del usuario actual según los filtros activos.
   * Carga los datos desde Firebase y actualiza las variables relacionadas.
   */
  getIncidences() {
    this.loading = true;
    const path: string = `users/${this.user.uid}/incidences`;

    const whereFilters: QueryOptions['where'] = [
      {field: 'reportedByUserId', op: '==', value: this.user.uid},
      {field: 'isClosed', op: '==', value: this.segment === 'closed'}
    ];

    if (this.statusFilter) {
      whereFilters.push({field: 'status', op: '==', value: this.statusFilter});
    }

    const options: QueryOptions = {
      where: whereFilters,
      orderBy: {field: 'createdAt', direction: 'desc'},
      limit: this.loadStep
    };

    if (this.incidencesSubscription) {
      this.incidencesSubscription.unsubscribe();
    }
    this.incidencesSubscription = this.firebaseService.getCollectionData(path, options).subscribe({
      next: (data: Incidence[]) => {
        this.incidences = data.filter(inc => this.filterBySearch(inc));
        this.lastVisible = data.length > 0 ? data[data.length - 1].createdAt : null;
        this.canLoadMore = data.length === this.loadStep;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener los datos: ', err);
        this.loading = false;
      }
    });
  }

  /**
   * Obtiene el conteo de incidencias abiertas y cerradas para el usuario actual en Firebase.
   * @returns {Promise<void>} Una promesa que indica cuando la operación ha finalizado.
   */
  async getIncidencesCount(): Promise<void> {
    this.resumen.open = await this.firebaseService.countDocuments(`users/${this.user.uid}/incidences`, {
      where: [{field: 'isClosed', op: '==', value: false}]
    });
    this.resumen.closed = await this.firebaseService.countDocuments(`users/${this.user.uid}/incidences`, {
      where: [{field: 'isClosed', op: '==', value: true}]
    });
  }

  /**
   * Método del ciclo de Ionic que se ejecuta cuando la vista entra en pantalla.
   * Llama a getIncidences para recargar las incidencias.
   * @private
   */
  private ionViewWillEnter() {
    this.getIncidences();
  }

  /**
   * Muestra un modal para actualizar una incidencia.
   * Si se realiza correctamente, vuelve a cargar las incidencias.
   * @param {Incidence} incidence - Incidencia que se desea actualizar.
   * @returns {Promise<void>} Una promesa que indica cuando la operación ha finalizado.
   */
  async updateIncidence(incidence: Incidence): Promise<void> {
    let success = await this.utilsService.presentModal({
      component: UpdateIncidenceComponent,
      cssClass: 'update-modal',
      componentProps: {incidence}
    });

    if (success) {
      this.getIncidences();
      this.getIncidencesCount();
    }
  }

  /**
   * Muestra un modal para añadir una nueva incidencia.
   * Si se realiza correctamente, vuelve a cargar las incidencias.
   * @returns {Promise<void>} Una promesa que indica cuando la operación ha finalizado.
   */
  async addIncidence(): Promise<void> {
    let success = await this.utilsService.presentModal({
      component: AddIncidenceComponent,
      cssClass: 'add-modal',
    });

    if (success) {
      this.getIncidences();
      this.getIncidencesCount();
    }
  }

  /**
   * Método que se ejecuta al destruir el componente.
   * Cancela la suscripción a incidencias si existe.
   */
  ngOnDestroy() {
    if (this.incidencesSubscription) {
      this.incidencesSubscription.unsubscribe();
    }
  }

  /**
   * Cambia el segmento (abiertas o cerradas) y recarga las incidencias.
   * @param {any} value - Valor del segmento seleccionado ('open' o 'closed').
   */
  setSegment(value: any) {
    if (value === 'open' || value === 'closed') {
      this.segment = value;
      this.visibleCount = this.loadStep;
      this.getIncidences();
    }
  }

  /**
   * Método de refresco.
   * Vuelve a cargar las incidencias desde Firebase y finaliza la animación de refresco.
   * @param {any} event - Evento de refresco de la vista.
   */
  doRefresh(event: any) {
    const path: string = `users/${this.user.uid}/incidences`;

    const whereFilters: QueryOptions['where'] = [
      {field: 'reportedByUserId', op: '==', value: this.user.uid},
      {field: 'isClosed', op: '==', value: this.segment === 'closed'}
    ];

    if (this.statusFilter) {
      whereFilters.push({field: 'status', op: '==', value: this.statusFilter});
    }

    const options: QueryOptions = {
      where: whereFilters,
      orderBy: {field: 'createdAt', direction: 'desc'},
      limit: this.loadStep
    };

    if (this.incidencesSubscription) {
      this.incidencesSubscription.unsubscribe();
    }

    this.incidencesSubscription = this.firebaseService.getCollectionData(path, options).subscribe({
      next: (data: Incidence[]) => {
        this.incidences = data.filter(inc => this.filterBySearch(inc));
        this.lastVisible = data.length > 0 ? data[data.length - 1].createdAt : null;
        this.canLoadMore = data.length === this.loadStep;
        event.target.complete();
      },
      error: err => {
        console.error('Error al obtener incidencias:', err);
        event.target.complete();
      }
    });
  }

  /**
   * Obtiene la etiqueta legible para un estado de incidencia.
   * @param {Incidence['status']} status - Estado de la incidencia ('OPEN', 'IN_PROGRESS', 'RESOLVED').
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
   * Devuelve el color asociado a un estado de incidencia.
   * @param {Incidence['status']} status - Estado de la incidencia.
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

  /**
   * Actualiza el campo de búsqueda y emite el valor para filtrar las incidencias.
   * @param {string} value - Valor actual del input de búsqueda.
   */
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  /**
   * Filtra una incidencia según el texto ingresado en la búsqueda.
   * @param {Incidence} incidence - Incidencia a filtrar.
   * @returns {boolean} Verdadero si coincide con la búsqueda, falso en caso contrario.
   */
  filterBySearch(incidence: Incidence): boolean {
    if (!this.searchValue) return true;
    return incidence.title.toLowerCase().includes(this.searchValue.toLowerCase());
  }

  /**
   * Carga más incidencias paginadas desde Firebase, agregándolas a la lista actual.
   * @param {any} event - Evento de scroll.
   */
  loadMoreIncidences(event: any) {
    const path = 'incidences';
    const whereFilters: QueryOptions['where'] = [
      {field: 'reportedByUserId', op: '==', value: this.user.uid},
      {field: 'isClosed', op: '==', value: this.segment === 'closed'}
    ];

    if (this.statusFilter) {
      whereFilters.push({field: 'status', op: '==', value: this.statusFilter});
    }

    const options: QueryOptions = {
      where: whereFilters,
      orderBy: {field: 'createdAt', direction: 'desc'},
      startAfter: this.lastVisible,
      limit: this.loadStep
    };
    this.firebaseService.getCollectionData(path, options).subscribe({
      next: (data: Incidence[]) => {
        const moreData = data.filter(inc => this.filterBySearch(inc));
        this.incidences.push(...moreData);
        this.lastVisible = data.length > 0 ? data[data.length - 1].createdAt : this.lastVisible;
        this.canLoadMore = data.length === this.loadStep;
        event.target.complete();
      },
      error: err => {
        console.error('Error al cargar más incidencias:', err);
        event.target.complete();
      }
    });
  }

  /**
   * Elimina una incidencia de Firebase y muestra un mensaje al usuario.
   * @param {Incidence} incidence - Incidencia a eliminar.
   */
  deleteIncidence(incidence: Incidence) {
    this.firebaseService.deleteDocument(`users/${this.user.uid}/incidences/${incidence.id}`)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Incidencia borrada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-outline'
        });
        this.getIncidencesCount();
      })
      .catch(error => {
        this.utilsService.presentToast({
          message: error.message || 'Error al borrar la incidencia',
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      });
  }
}
