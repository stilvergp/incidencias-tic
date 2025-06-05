import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {createClient, SupabaseClient} from "@supabase/supabase-js";

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseConfig.projectURl,
      environment.supabaseConfig.apiKey
    );
  }

  /**
   * Sube una imagen en formato Base64 a Supabase Storage y devuelve la URL pública.
   * @param {string} path - Ruta completa donde se almacenará la imagen.
   * @param {string} imageUrl - Imagen en formato Base64.
   * @returns {Promise<string>} Promesa que se resuelve con la URL pública de la imagen.
   * @throws {Error} Lanza un error si la subida falla.
   */
  async uploadImage(path: string, imageUrl: string): Promise<string> {
    const blob = this.dataUrlToBlob(imageUrl!);
    const file = new File([blob], path.split('/')[1], {
      type: blob.type,
    });

    const uploadResult = await this.supabase.storage
      .from(environment.supabaseConfig.bucket)
      .upload(path, file, {upsert: true});
    if (uploadResult.error) {
      throw uploadResult.error;
    }
    const urlInfo = await this.supabase.storage
      .from(environment.supabaseConfig.bucket)
      .getPublicUrl(path);
    return urlInfo.data.publicUrl;
  }

  /**
   * Convierte una cadena en formato Base64 a un Blob.
   * @private
   * @param {string} dataUrl - Imagen codificada en Base64.
   * @returns {Blob} El objeto Blob resultante.
   */
  private dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], {type: mime});
  }

  /**
   * Extrae la ruta de un archivo en Supabase Storage a partir de su URL pública.
   * @param {string} publicUrl - URL pública del archivo.
   * @returns {string | null} Ruta interna del archivo o null si no es válida.
   */
  getFilePath(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);

      const publicPrefix = '/storage/v1/object/public/' + environment.supabaseConfig.bucket + '/';
      const startIndex = url.pathname.indexOf(publicPrefix);

      if (startIndex === -1) {
        throw new Error(
          'La URL no es válida o no pertenece a Supabase Storage.'
        );
      }

      return url.pathname.substring(startIndex + publicPrefix.length);
    } catch (error) {
      console.error('Error al extraer el path del archivo:', error);
      return null;
    }
  }

  /**
   * Elimina un archivo de Supabase Storage dado su ruta interna.
   * @param {string} filePath - Ruta interna del archivo a eliminar.
   * @returns {Promise<boolean>} Promesa que se resuelve con true si la eliminación fue exitosa, false si falló.
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const {error} = await this.supabase.storage
        .from(environment.supabaseConfig.bucket)
        .remove([filePath]);

      if (error) {
        console.error('Error al eliminar el archivo:', error);
        return false;
      }

      console.log(`Archivo eliminado: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error inesperado al intentar eliminar el archivo:', error);
      return false;
    }
  }
}
