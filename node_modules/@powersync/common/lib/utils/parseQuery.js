export const parseQuery = (query, parameters) => {
    let sqlStatement;
    if (typeof query == 'string') {
        sqlStatement = query;
    }
    else {
        const hasAdditionalParameters = parameters.length > 0;
        if (hasAdditionalParameters) {
            throw new Error('You cannot pass parameters to a compiled query.');
        }
        const compiled = query.compile();
        sqlStatement = compiled.sql;
        parameters = compiled.parameters;
    }
    return { sqlStatement, parameters: parameters };
};
//# sourceMappingURL=parseQuery.js.map