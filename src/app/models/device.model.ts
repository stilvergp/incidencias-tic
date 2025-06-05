export interface Device {
  id: string;
  image: string;
  type: 'PC' | 'Portátil' | 'Proyector' | 'Teclado' | 'Ratón' | 'Otro';
  status: 'WORKING' | 'OUT_OF_SERVICE';
  serial_number: string;
  brand: string;
  classroomId: string;
}
