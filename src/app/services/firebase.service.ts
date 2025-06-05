import {inject, Injectable} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  UserCredential
} from '@angular/fire/auth';
import {User} from '../models/user.model';
import {
  addDoc,
  collection,
  collectionData, deleteDoc,
  doc,
  Firestore,
  getCountFromServer,
  getDoc,
  limit,
  orderBy,
  query,
  QueryConstraint,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {Observable} from "rxjs";
import {QueryOptions} from './query-options.interface';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  auth = inject(Auth);
  firestore = inject(Firestore);

  /**
   * Inicia sesión con correo y contraseña usando Firebase Authentication.
   * @param {User} user - Objeto que contiene el email y la contraseña.
   * @returns {Promise<UserCredential>} Promesa que se resuelve con las credenciales del usuario.
   */
  signIn(user: User): Promise<UserCredential> {
    return signInWithEmailAndPassword(
      this.auth, user.email, user.password
    );
  }

  /**
   * Registra un nuevo usuario con correo y contraseña en Firebase Authentication.
   * @param {User} user - Objeto que contiene el email y la contraseña.
   * @returns {Promise<UserCredential>} Promesa que se resuelve con las credenciales del nuevo usuario.
   */
  signUp(user: User): Promise<UserCredential> {
    return createUserWithEmailAndPassword(
      this.auth,
      user.email,
      user.password
    );
  }

  /**
   * Cierra la sesión del usuario actual y elimina sus datos locales.
   * @returns {Promise<void>} Promesa que indica cuando la operación ha finalizado.
   */
  async signOut(): Promise<void> {
    await this.auth.signOut();
    localStorage.removeItem('user');
  }

  /**
   * Actualiza el nombre visible del usuario actual.
   * @param {string} displayName - Nombre a mostrar para el usuario.
   * @returns {Promise<void>} Promesa que indica cuando la operación ha finalizado.
   */
  async updateUser(displayName: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (user) {
      await updateProfile(user, {displayName: displayName});
    }
  }

  /**
   * Añade un nuevo documento a la colección especificada en Firestore.
   * @param {string} path - Ruta de la colección.
   * @param {any} data - Datos del documento.
   * @returns {Promise<DocumentReference>} Promesa que se resuelve con la referencia al documento creado.
   */
  addDocument(path: string, data: any) {
    return addDoc(collection(this.firestore, path), data);
  }

  /**
   * Obtiene los datos de un documento específico en Firestore.
   * @param {string} path - Ruta completa del documento.
   * @returns {Promise<any>} Promesa que se resuelve con los datos del documento.
   */
  async getDocument(path: string): Promise<any> {
    const docSnap = await getDoc(doc(this.firestore, path));
    return docSnap.data();
  }

  /**
   * Crea o reemplaza un documento en la ruta especificada de Firestore.
   * @param {string} path - Ruta completa del documento.
   * @param {any} data - Datos a establecer en el documento.
   * @returns {Promise<void>} Promesa que indica cuando la operación ha finalizado.
   */
  setDocument(path: string, data: any): Promise<void> {
    return setDoc(doc(this.firestore, path), data);
  }

  /**
   * Actualiza un documento existente en Firestore.
   * @param {string} path - Ruta completa del documento.
   * @param {any} data - Datos a actualizar.
   * @returns {Promise<void>} Promesa que indica cuando la operación ha finalizado.
   */
  updateDocument(path: string, data: any): Promise<void> {
    return updateDoc(doc(this.firestore, path), data);
  }

  /**
   * Elimina un documento de Firestore.
   * @param {string} path - Ruta completa del documento.
   * @returns {Promise<void>} Promesa que indica cuando la operación ha finalizado.
   */
  deleteDocument(path: string): Promise<void> {
    return deleteDoc(doc(this.firestore, path));
  }

  /**
   * Construye los filtros QueryConstraints para las consultas a Firestore, como where, orderBy, startAfter y limit.
   * @param {QueryOptions} [options] - Opciones de consulta.
   * @returns {QueryConstraint[]} Array de restricciones de la consulta.
   */
  buildQueryConstraints(options?: QueryOptions): QueryConstraint[] {
    const queryConstraints: QueryConstraint[] = [];

    if (options?.where) {
      for (const w of options.where) {
        queryConstraints.push(where(w.field, w.op, w.value));
      }
    }
    if (options?.orderBy) {
      queryConstraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
    }
    if (options?.startAfter !== undefined) {
      queryConstraints.push(startAfter(options.startAfter));
    }
    if (options?.limit) {
      queryConstraints.push(limit(options.limit));
    }
    return queryConstraints;
  }

  /**
   * Obtiene los datos de una colección de Firestore, aplicando las restricciones indicadas.
   * @param {string} path - Ruta de la colección.
   * @param {QueryOptions} [options] - Opciones de consulta.
   * @returns {Observable<any[]>} Observable con los datos de la colección incluyendo el campo 'id'.
   */
  getCollectionData(path: string, options?: QueryOptions): Observable<any[]> {
    const ref = collection(this.firestore, path);
    const collectionQuery = this.buildQueryConstraints(options);
    return collectionQuery ? collectionData(query(ref, ...collectionQuery), {idField: 'id'}) : collectionData(ref, {idField: 'id'});
  }

  /**
   * Verifica si hay un usuario autenticado actualmente.
   * @returns {Promise<boolean>} Promesa que se resuelve con true si hay un usuario autenticado, false en caso contrario.
   */
  async isAuthenticated(): Promise<boolean> {
    return await new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve(true)
        } else {
          resolve(false)
        }
      });
    });
  }

  /**
   * Envía un correo electrónico para restablecer la contraseña de un usuario.
   * @param {string} email - Correo electrónico del usuario.
   * @returns {Promise<void>} Promesa que indica cuando la operación ha finalizado.
   */
  sendRecoveryEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Cuenta el número de documentos en una colección que cumplen las restricciones dadas.
   * @param {string} path - Ruta de la colección.
   * @param {QueryOptions} [options] - Opciones de consulta.
   * @returns {Promise<number>} Promesa que se resuelve con el número de documentos encontrados.
   */
  async countDocuments(path: string, options?: QueryOptions): Promise<number> {
    const ref = collection(this.firestore, path);
    const constraints = this.buildQueryConstraints(options);
    const q = query(ref, ...constraints);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }
}
