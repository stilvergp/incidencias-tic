import firebase from "firebase/compat";
import WhereFilterOp = firebase.firestore.WhereFilterOp;

export interface QueryOptions {
  where?: { field: string; op: WhereFilterOp; value: any }[];
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  startAfter?: any;
  limit?: number;
}
