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
import {User} from "../../../models/user.model";
import {debounceTime, Subject, Subscription} from "rxjs";
import {Incidence} from "../../../models/incidence.model";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {addIcons} from "ionicons";
import {search, trashOutline} from "ionicons/icons";
import {RouterLink} from "@angular/router";
import {QueryOptions} from "../../../services/query-options.interface";
import {ManageIncidenceComponent} from "../../../components/incidences/manage-incidence/manage-incidence.component";

@Component({
  selector: 'app-incidences',
  templateUrl: './incidences.page.html',
  styleUrls: ['./incidences.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonRefresher, IonRefresherContent, IonButton, IonCard, IonCardContent, IonCardHeader, IonSkeletonText, IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonSelect, IonSelectOption, IonInput, IonIcon, IonCardTitle, RouterLink, IonInfiniteScroll, IonInfiniteScrollContent]
})
export class IncidencesPage implements OnDestroy {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  user: User;
  loading: boolean = false;
  incidences: Incidence[] = [];
  incidencesSubscription?: Subscription;
  segment: 'open' | 'closed' = 'open';
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
   * Recupera el usuario actual, configura el observable de búsqueda con debounce y carga datos iniciales.
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
    addIcons({search, trashOutline});
    this.getIncidencesCount();
  }

  /**
   * Método de Ionic que se ejecuta al entrar en la vista.
   * Carga las incidencias visibles.
   */
  private ionViewWillEnter() {
    this.getIncidences();
  }

  /**
   * Obtiene la lista de incidencias filtradas y ordenadas desde Firebase.
   */
  getIncidences() {
    this.loading = true;
    const path = 'incidences';

    const whereFilters: QueryOptions['where'] = [
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
      error: err => {
        console.error('Error al obtener incidencias:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Obtiene el número total de incidencias abiertas y cerradas.
   */
  async getIncidencesCount() {
    this.resumen.open = await this.firebaseService.countDocuments('incidences', {
      where: [{field: 'isClosed', op: '==', value: false}]
    });
    this.resumen.closed = await this.firebaseService.countDocuments('incidences', {
      where: [{field: 'isClosed', op: '==', value: true}]
    });
  }

  /**
   * Cambia el segmento actual (abiertas o cerradas) y recarga las incidencias.
   * @param {string} value - 'open' o 'closed'
   */
  setSegment(value: any) {
    if (value === 'open' || value === 'closed') {
      this.segment = value;
      this.visibleCount = this.loadStep;
      this.getIncidences();
    }
  }

  /**
   * Limpia la suscripción al salir del componente.
   */
  ngOnDestroy() {
    if (this.incidencesSubscription) {
      this.incidencesSubscription.unsubscribe();
    }
  }

  /**
   * Refresca manualmente las incidencias.
   * @param event Evento de refresco.
   */
  doRefresh(event: any) {
    const path = 'incidences';

    const whereFilters: QueryOptions['where'] = [
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
   * Devuelve una etiqueta de texto legible para el estado de la incidencia.
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
   * Devuelve el color asociado al estado de la incidencia.
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

  /**
   * Evento que se ejecuta al cambiar el texto del buscador.
   * @param value Texto de búsqueda.
   */
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  /**
   * Filtra incidencias por coincidencia en el título.
   * @param incidence Incidencia a evaluar.
   * @returns Verdadero si coincide con la búsqueda.
   */
  filterBySearch(incidence: Incidence): boolean {
    if (!this.searchValue) return true;
    return incidence.title.toLowerCase().includes(this.searchValue.toLowerCase());
  }

  /**
   * Carga más incidencias al hacer scroll.
   * @param event Evento de scroll.
   */
  loadMoreIncidences(event: any) {
    const path = 'incidences';
    const whereFilters: QueryOptions['where'] = [
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
   * Abre un modal para gestionar una incidencia. Recarga si se guarda.
   * @param incidence Incidencia a gestionar.
   */
  async manageIncidence(incidence: Incidence) {
    let success = await this.utilsService.presentModal({
      component: ManageIncidenceComponent,
      cssClass: 'manage-modal',
      componentProps: {incidence}
    });
    if (success) {
      this.getIncidences();
      this.getIncidencesCount();
    }
  }

  /**
   * Elimina una incidencia tanto del usuario como del listado general.
   * @param incidence Incidencia a eliminar.
   */
  deleteIncidence(incidence: Incidence) {
    const userPath = `users/${incidence.reportedByUserId}/incidences/${incidence.id}`;
    const generalPath = `incidences/${incidence.id}`;
    Promise.all([
      this.firebaseService.deleteDocument(userPath),
      this.firebaseService.deleteDocument(generalPath)
    ])
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
