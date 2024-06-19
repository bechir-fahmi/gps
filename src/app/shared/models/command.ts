export interface Command {
  id?: number;
  deviceId: number;
  description?: string;
  type: string;
  attributes?: { };
}
