const { readFileSync } = require('fs');

const { log } = require('../loggers');

let type;

const initialize = () => {
    log('Initializing data access...');
    log('Reading and parsing configuration file...');
    const configuration = JSON.parse(readFileSync('conf/data-access.json'));
    log({ message: `${configuration.Type} data access type found.`, highlight: true });
    module.exports.normalizedTypeName = configuration.Type.toLowerCase();
    type = require(`./types/${this.normalizedTypeName}`);
    Object.keys(type).forEach(typePropertyName => {
        if (![ 'initialize', 'finalize' ].includes(typePropertyName)) module.exports[typePropertyName] = type[typePropertyName];
    });
    return type.initialize(configuration.Details)
    .then(() => { log({ message: 'Data access initialization complete.', highlight: true }); });
};

const finalize = () => {
    log('Finalizing data access...');
    return type.finalize()
    .then(() => { log({ message: 'Data access finalized.', highlight: true }); });
};

module.exports.finalize = finalize;
module.exports.initialize = initialize;
