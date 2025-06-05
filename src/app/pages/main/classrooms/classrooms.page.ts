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
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonSpinner
} from '@ionic/angular/standalone';
import {HeaderComponent} from "../../../shared/components/header/header.component";
import {FirebaseService} from "../../../services/firebase.service";
import {UtilsService} from "../../../services/utils.service";
import {Classroom} from "../../../models/classroom.model";
import {debounceTime, Subject, Subscription} from "rxjs";
import {addIcons} from "ionicons";
import {addOutline, search, trashOutline} from "ionicons/icons";
import {UpdateClassroomComponent} from "../../../components/classrooms/update-classroom/update-classroom.component";
import {AddClassroomComponent} from "../../../components/classrooms/add-classroom/add-classroom.component";

@Component({
  selector: 'app-classrooms',
  templateUrl: './classrooms.page.html',
  styleUrls: ['./classrooms.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonInput, IonCard, IonCardContent, IonCardHeader, IonSkeletonText, IonSpinner, IonFab, IonFabButton, IonCardTitle, IonInfiniteScroll, IonInfiniteScrollContent]
})
export class ClassroomsPage implements OnDestroy, OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  loading = false;
  classrooms: Classroom[] = [];
  classroomsSubscription?: Subscription;
  visibleCount = 5;
  loadStep = 5;
  searchValue: string = '';
  canLoadMore: boolean = true;
  searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(700)).subscribe((value) => {
      if (value.length === 0 || value.length >= 3) {
        this.getClassrooms();
      }
    });
    addIcons({search, addOutline, trashOutline});
  }

  /**
   * Método que se ejecuta al inicializar el componente, llama a la función para obtener las aulas desde Firebase.
   */
  ngOnInit() {
    this.getClassrooms();
  }

  /**
   * Método que se ejecuta al destruir el componente, cancela la suscripción a la colección de aulas si existe.
   */
  ngOnDestroy() {
    if (this.classroomsSubscription) {
      this.classroomsSubscription.unsubscribe();
    }
  }

  /**
   * Obtiene la lista de aulas desde Firebase.
   * Filtra por texto de búsqueda, aplica paginación y actualiza el estado del componente.
   *
   * @returns {Promise<void>} Promesa que se resuelve una vez que los datos han sido procesados.
   */
  async getClassrooms(): Promise<void> {
    this.loading = true;
    const path = 'classrooms';

    if (this.classroomsSubscription) {
      this.classroomsSubscription.unsubscribe();
    }
    this.firebaseService.getCollectionData(path).subscribe({
      next: (data: Classroom[]) => {
        let filteredClassrooms = data;

        filteredClassrooms = filteredClassrooms.filter(classroom => this.filterBySearch(classroom));
        this.classrooms = filteredClassrooms.slice(0, this.visibleCount);
        this.canLoadMore = filteredClassrooms.length > this.visibleCount;
        this.loading = false;
      },
      error: error => {
        console.error(error);
        this.loading = false;
      }
    });
  }

  /**
   * Muestra un modal para editar los datos de un aula.
   * Si el usuario guarda cambios, recarga la lista de aulas.
   *
   * @param {Classroom} classroom - Aula que se desea actualizar.
   * @returns {Promise<void>} Promesa que se resuelve tras intentar actualizar el aula.
   */
  async updateClassroom(classroom: Classroom): Promise<void> {
    let success = await this.utilsService.presentModal({
      component: UpdateClassroomComponent,
      cssClass: 'update-device',
      componentProps: {classroom}
    });
    if (success) {
      this.getClassrooms();
    }
  }

  /**
   * Reinicia la cantidad visible de aulas y recarga la lista desde Firebase.
   *
   * @param {any} event - Evento de refresco del componente.
   */
  doRefresh(event: any) {
    this.visibleCount = this.loadStep;
    this.getClassrooms().then(() => event.target.complete());
  }

  /**
   * Actualiza el valor del texto de búsqueda y lo emite por el observable.
   *
   * @param {string} value - Texto ingresado por el usuario.
   */
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  /**
   * Aplica un filtro al aula en función del término de búsqueda.
   *
   * @param {Classroom} classroom - Aula a evaluar.
   * @returns {boolean} `true` si el aula coincide con el texto de búsqueda, `false` si no.
   */
  filterBySearch(classroom: Classroom): boolean {
    if (!this.searchValue) return true;
    return classroom.name.toLowerCase().includes(this.searchValue.toLowerCase()) ||
      classroom.location.toLowerCase().includes(this.searchValue.toLowerCase());
  }

  /**
   * Aumenta la cantidad visible de aulas y recarga la lista desde Firebase.
   *
   * @param {any} event - Evento del scroll infinito.
   */
  loadMoreDevices(event: any) {
    this.visibleCount += this.loadStep;
    this.getClassrooms().then(() => {
      event.target.complete();
    });
  }

  /**
   * Abre un modal para añadir un aula nueva. Si se añade correctamente, recarga la lista.
   *
   * @returns {Promise<void>} Promesa que se resuelve tras intentar añadir el aula.
   */
  async addClassroom(): Promise<void> {
    let success = await this.utilsService.presentModal({
      component: AddClassroomComponent,
      cssClass: 'add-modal',
    });
    if (success) {
      this.getClassrooms();
    }
  }

  /**
   * Elimina un aula de la base de datos y muestra un mensaje de éxito o error.
   *
   * @param {Classroom} classroom - Aula que se desea eliminar.
   */
  deleteClassroom(classroom: Classroom) {
    this.firebaseService.deleteDocument(`classrooms/${classroom.id}`)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Aula borrada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-outline'
        });
      })
      .catch(error => {
        this.utilsService.presentToast({
          message: error.message || 'Error al borrar el aula',
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      });
  }
}
