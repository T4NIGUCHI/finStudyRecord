// src/domain/record.ts
export interface RecordFormValues {
    title: string;
    time:string;
  }
  
  export class Record {
    constructor(public id: string, public title: string, public time: number) {}
  }
  