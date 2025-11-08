import Database from '@database/database';
import ModuleEventBus from '@utils/events/module-event-bus';

export default class GlobalDescribe {
    private static cache: Record<string, TableDescribe> = {};

    /**
     * When the server starts, cache the describes for all tables.
     * We use the event bus to tell the main module when we are ready for service.
     */
    static {
        ModuleEventBus.signalInit(this);
        ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, async (event) => {
            if (event.detail.module !== Database) {
                return;
            }
            try {
                const result = await Database.query('SHOW TABLES;');
                const promises: Array<Promise<void>> = [];
                result.forEach((tableObject) => {
                    const tableName = tableObject[`Tables_in_${process.env.MYSQL_DATABASE}`];
                    promises.push(
                        Database.query('DESCRIBE ??;', [tableName]).then((fieldDescribes) => {
                            GlobalDescribe.cache[tableName] = new TableDescribe(
                                tableName,
                                fieldDescribes.map((fd) => new FieldDescribe(fd))
                            );
                        })
                    );
                });
                await Promise.all(promises);
                ModuleEventBus.signalReady(this);
            } catch (error) {
                console.error('Global Descrie Error:', error);
                ModuleEventBus.signalError(this, error as Error);
            }
        });
    }

    /**
     * @description Get the field descriptors for a table
     * @param table Table to describe
     * @returns Resolves the table describe instance
     */
    public static get(table: string): TableDescribe {
        if (table in this.cache) {
            return this.cache[table];
        }
        throw new Error(`Object does not exist: ${table}`);
    }
}

export class TableDescribe {
    public table: string;
    public fields: Array<FieldDescribe>;
    public fieldMap: Record<string, FieldDescribe>;

    constructor(table: string, fields: Array<FieldDescribe>) {
        this.table = table;
        this.fields = fields;
        this.fieldMap = this.fields.reduce(
            (fieldMap, fieldDescribe) => {
                fieldMap[fieldDescribe.name] = fieldDescribe;
                return fieldMap;
            },
            {} as Record<string, FieldDescribe>
        );
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
