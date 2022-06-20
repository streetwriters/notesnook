export function getTableNodeTypes(schema) {
    if (schema.cached.tableNodeTypes) {
        return schema.cached.tableNodeTypes;
    }
    var roles = {};
    Object.keys(schema.nodes).forEach(function (type) {
        var nodeType = schema.nodes[type];
        if (nodeType.spec.tableRole) {
            roles[nodeType.spec.tableRole] = nodeType;
        }
    });
    schema.cached.tableNodeTypes = roles;
    return roles;
}
