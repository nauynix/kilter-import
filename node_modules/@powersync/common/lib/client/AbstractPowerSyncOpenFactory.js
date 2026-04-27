import Logger from 'js-logger';
export class AbstractPowerSyncDatabaseOpenFactory {
    options;
    constructor(options) {
        this.options = options;
        options.logger = options.logger ?? Logger.get(`PowerSync ${this.options.dbFilename}`);
    }
    /**
     * Schema used for the local database.
     */
    get schema() {
        return this.options.schema;
    }
    generateOptions() {
        return {
            database: this.openDB(),
            ...this.options
        };
    }
    getInstance() {
        const options = this.generateOptions();
        return this.generateInstance(options);
    }
}
//# sourceMappingURL=AbstractPowerSyncOpenFactory.js.map