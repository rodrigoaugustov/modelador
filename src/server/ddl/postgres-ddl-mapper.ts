export function mapProjectToPostgresTables(snapshot: any) {
  return snapshot.model.tables.map((table: any) => ({
    tableName: table.physicalName ?? table.logicalName,
    columns: (table.attributes ?? []).map((attribute: any) => ({
      name: attribute.physicalName ?? attribute.logicalName,
      dataType: attribute.dataType,
      isNullable: attribute.isNull,
      isPrimaryKey: attribute.isPrimaryKey,
    })),
  }))
}
