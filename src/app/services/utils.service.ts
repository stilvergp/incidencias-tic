import {inject, Injectable} from '@angular/core';
import {Router, UrlTree} from '@angular/router';
import {
  LoadingController,
  ModalController,
  ModalOptions,
  ToastController,
  ToastOptions,
} from '@ionic/angular/standalone';

import {User} from "../models/user.model";
import {Camera, CameraResultType, CameraSource, Photo} from "@capacitor/camera";

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  loadingController = inject(LoadingController);
  toastController = inject(ToastController);
  router = inject(Router);
  modalController = inject(ModalController);

  /**
   * Crea un indicador de carga de tipo 'crescent'.
   * @returns {Promise<HTMLIonLoadingElement>} Promesa que se resuelve con el elemento del indicador de carga.
   */
  loading(): Promise<HTMLIonLoadingElement> {
    return this.loadingController.create({spinner: 'crescent'});
  }

  /**
   * Muestra un mensaje toast con las opciones especificadas.
   * @param {ToastOptions} [toastOptions] - Opciones para configurar el toast (mensaje, duración, color, etc.).
   * @returns {Promise<void>}
   */
  async presentToast(toastOptions?: ToastOptions | undefined): Promise<void> {
    const toast = await this.toastController.create(toastOptions);
    toast.present();
  }

  /**
   * Convierte una URL en un árbol de rutas de Angular.
   * @param {string} url - URL a convertir.
   * @returns {UrlTree} El árbol de rutas generado.
   */
  urlTree(url: string): UrlTree {
    return this.router.parseUrl(url);
  }

  /**
   * Navega a la URL especificada utilizando el router de Angular.
   * @param {string} url - URL de destino.
   * @returns {Promise<boolean>} Promesa que indica si la navegación fue exitosa.
   */
  routerLink(url: string): Promise<boolean> {
    return this.router.navigateByUrl(url);
  }

  /**
   * Guarda un valor en el almacenamiento local.
   * @param {string} key - Clave del dato.
   * @param {*} value - Valor a almacenar.
   */
  saveInLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Recupera un valor del almacenamiento local.
   * @param {string} key - Clave del dato.
   * @returns {*} Valor almacenado o null si no existe.
   */
  getFromLocalStorage(key: string): any {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : value;
  }

  /**
   * Muestra un modal con las opciones proporcionadas y devuelve los datos tras cerrarse.
   * @param {ModalOptions} modalOptions - Opciones para el modal (componente, cssClass, etc.).
   * @returns {Promise<any>} Datos devueltos por el modal o null si no se devuelve nada.
   */
  async presentModal(modalOptions: ModalOptions): Promise<any> {
    const modal = await this.modalController.create(modalOptions);

    await modal.present();

    const {data} = await modal.onWillDismiss();

    return data ?? null;
  }

  /**
   * Abre un cuadro de diálogo para capturar o seleccionar una foto.
   * @param {string} promptLabelHeader - Título del cuadro de diálogo.
   * @returns {Promise<Photo>} Promesa que se resuelve con los datos de la foto (en formato Base64).
   */
  async takePicture(promptLabelHeader: string): Promise<Photo> {
    return await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      promptLabelHeader,
      promptLabelPhoto: 'Subir imagen',
      promptLabelPicture: 'Tomar foto'
    });
  }

  /**
   * Cierra el modal activo y devuelve opcionalmente datos al componente que lo abrió.
   * @param {any} [data] - Datos opcionales a devolver.
   * @returns {Promise<boolean>} Promesa que indica si el cierre fue exitoso.
   */
  dismissModal(data?: any): Promise<boolean> {
    return this.modalController.dismiss(data);
  }

  /**
   * Obtiene el usuario actualmente almacenado en el localStorage.
   * @returns {User | null} El objeto del usuario o null si no existe.
   */
  getLocalStoredUser(): User | null {
    return this.getFromLocalStorage('user');
  }

  constructor() {
  }
}
