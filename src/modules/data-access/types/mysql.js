const mysql = require('mysql');

const { instance, project } = require('../../configuration');
const { log, logError } = require('../../loggers');

let connection, serverMajorVersionNumber;

const initialize = configurationDetails => new Promise((resolve, reject) => {
    connection = mysql.createConnection({
        host: configurationDetails['Server host'],
        port: configurationDetails.Port || 3306,
        user: configurationDetails['User name'],
        password: configurationDetails.Password || process.env[`VIXENWORKS_${project.Name}_${instance.Name}_DATA_ACCESS_MYSQL_PASSWORD`.toUpperCase().replace(/[^A-Z0-9]/g, '_')],
        database: configurationDetails['Database name'],
        timezone: 'z'
    });
    log('Connecting to MySQL server...');
    connection.connect(err => {
        if (err) return reject(err);

        resolve();
    });
})
.then(() => {
    log('Checking for MySQL server version...');
    return returnQueryResults('SELECT VERSION()');
})
.then(serverVersion => new Promise((resolve, reject) => {
    try {
        serverMajorVersionNumber = serverVersion[0]['VERSION()'].split('.', 1)[0];
    } catch (error) {
        logError({ error: error, exit: false });
    }
    if (serverMajorVersionNumber === '5' || serverMajorVersionNumber === '8') {
        log({ message: `MySQL server major version number ${serverMajorVersionNumber} found.`, highlight: true });
    } else {
        log({ message: 'MySQL server major version number is neither 5 nor 8. Falling back to 5.', highlight: true });
        serverMajorVersionNumber = '5';
    }
    const connectionCharacterSet = serverMajorVersionNumber === '5' ? 'UTF8_GENERAL_CI' : 'UTF8MB4_GENERAL_CI';
    log(`Setting character set ${connectionCharacterSet} for MySQL connection...`);
    connection.changeUser({ charset: connectionCharacterSet }, err => {
        if (err) return reject(err);

        log({ message: 'Character set for MySQL connection was set.', highlight: true });

        resolve();
    });
}))
.catch(error => { logError(error); });

const finalize = () => new Promise((resolve, reject) => {
    log('Disconnecting from MySQL server...');
    connection.end(err => {
        if (err) return reject(err);

        log({ message: 'Disconnected from MySQL server.', highlight: true });
        resolve();
    });
}).catch(error => { logError(error); });

const returnQueryResults = query => new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
        if (error) return reject(error);

        resolve(query.trim().toLowerCase().substring(0, 6) !== 'insert' ? results : results.insertId);
    });
});

const transaction = {
    commit: () => returnQueryResults('COMMIT'),
    rollBack: () => returnQueryResults('ROLLBACK'),
    start: () => returnQueryResults('START TRANSACTION')
};

const returnEscaped = value => {
    let response = connection.escape(value);

    if (value instanceof Date) response = `${response.slice(0, -5)}'`;

    return response;
};

const uuid = {
    returnInsertFunction: () => serverMajorVersionNumber === '5' ? 'UNHEX(REPLACE(UUID(), \'-\', \'\'))' : 'UUID_TO_BIN(UUID())',
    returnSelectFunctionName: () => serverMajorVersionNumber === '5' ? 'HEX' : 'BIN_TO_UUID',
    returnWhereFunction: uuid => serverMajorVersionNumber === '5' ? `UNHEX(REPLACE('${uuid}', '-', ''))` : `UUID_TO_BIN('${uuid}')`,
    toString: uuid => serverMajorVersionNumber === '5' ? `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20)}`.toLowerCase() : uuid
};

module.exports = {
    initialize: initialize,
    finalize: finalize,

    returnQueryResults: returnQueryResults,
    transaction: transaction,

    returnEscaped:returnEscaped,
    uuid: uuid
};
