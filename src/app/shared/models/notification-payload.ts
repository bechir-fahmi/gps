export interface NotificationPayload {
  id: number;
  attributes: Record<string, any>;
  calendarId: number;
  always: boolean;
  type: string;
  commandId: number;
  notificators: string;
}
