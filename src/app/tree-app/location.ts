export interface ILocation {
  id: number;
  parentId: number;
  Name: string;
  Description: string;
  Area: number;
  Population: number;
  TimeZone: string;
  allowDrop?: boolean;
}
