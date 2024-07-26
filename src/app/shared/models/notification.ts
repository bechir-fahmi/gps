export interface Notification {
  id: number;
  type: string;
  always: boolean;
  web: boolean;
  mail: boolean;
  sms: boolean;
  calendarId: number;
  attributes: Record<string, any>;
}
