export interface Incidence {
  id: string,
  title: string,
  description: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
  createdAt: Date,
  image: string,
  classroomId: string,
  reportedByUserId: string,
  deviceId: string,
  diagnose: string,
  isClosed: boolean,
}
