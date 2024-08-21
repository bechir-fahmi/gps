export interface Device {
  id: number;
  attributes: any;
  groupId: number;
  calendarId?: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string| null;
  positionId: number;
  phone: string | null;
  model: string | null;
  contact: string | null;
  category: string | null;
  disabled: boolean;
  expirationTime?: string | null;
}
