import Database from '@database/database';

export default class GlobalDescribe {
    private static cache: Record<string, TableDescribe> = {};

    /**
     * @description Get the field descriptors for a table
     * @param table Table to describe
     * @returns Resolves the table describe instance
     */
    public static async get(table: string): Promise<TableDescribe> {
        if (table in this.cache) {
            console.log('using cached describe for', table);
            return this.cache[table];
        }
        const fieldDescribes = await Database.query('DESCRIBE ??;', [table]);
        const tableDescribe = new TableDescribe(
            table,
            fieldDescribes.map((fd) => new FieldDescribe(fd))
        );
        this.cache[table] = tableDescribe;
        return tableDescribe;
    }
}

export class TableDescribe {
    public table: string;
    public fields: Array<FieldDescribe>;

    constructor(table: string, fields: Array<FieldDescribe>) {
        this.table = table;
        this.fields = fields;
    }
}

export class FieldDescribe {
    name: string;
    type: string;
    nillable: boolean;

    constructor(describeRow: Record<string, any>) {
        this.name = describeRow.Field;
        this.type = describeRow.Type;
        this.nillable = describeRow.Null === 'YES';
    }
}
