import { createRow, listRows, listTables } from "@/lib/apps-api";

export function createAppDataSource(appId) {
  const tableIds = {};

  async function tableId(name) {
    if (tableIds[name]) return tableIds[name];
    const tables = await listTables(appId);
    const found = (Array.isArray(tables) ? tables : []).find((table) => table.name === name);
    if (!found) throw new Error(`Tabel "${name}" tidak ada di app ini.`);
    tableIds[name] = found.id;
    return found.id;
  }

  return {
    async loadTable(name) {
      const id = await tableId(name);
      const rows = await listRows(appId, id);
      return (Array.isArray(rows) ? rows : []).map((row) => row.data);
    },
    async submitRow(name, values) {
      const id = await tableId(name);
      const row = await createRow(appId, id, values ?? {});
      return row.data;
    },
  };
}
