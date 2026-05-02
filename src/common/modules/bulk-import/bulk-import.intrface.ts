export interface BulkImportOptions<TDto, TEntity> {
  dtoClass: new () => TDto;
  mapDtoToEntity: (dto: TDto) => Promise<TEntity>;
  saveEntities: (entities: TEntity[]) => Promise<TEntity[]>;
}
