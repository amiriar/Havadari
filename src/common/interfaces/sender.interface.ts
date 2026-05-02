export interface ISender {
  send(recipient: string, message: string, isFlash?: boolean): Promise<string>;
}
