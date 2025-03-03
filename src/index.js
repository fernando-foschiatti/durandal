const dataAccess = require('./modules/data-access/data-access');
const frontEnd = require('./modules/front-end/front-end');
const { log } = require('./modules/loggers');
const restfulApi = require('./modules/restful-api/restful-api');

log('Initializing...');
dataAccess.initialize()
.then(() => {
    restfulApi.initialize();
    frontEnd.initialize();
    log({ message: 'Initialization complete.', highlight: true });
    log({ message: '------------------------', highlight: true });
    process.on('SIGINT', () => {
        log({ message: '-------------', highlight: true });
        log('Finalizing...');
        dataAccess.finalize()
        .then(() => {
            log({ message: 'Finalized.', highlight: true });
            process.exit();
        });
    });
});
