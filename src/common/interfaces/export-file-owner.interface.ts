import { IFileOwner } from './file-owner.interface';

export class ExportFileOwner implements IFileOwner {
  constructor(
    private entityName: string,
    private entityId: string,
  ) {}

  getId(): string {
    return this.entityId;
  }

  getName(): string {
    return this.entityName;
  }
}
