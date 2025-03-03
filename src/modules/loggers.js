const log = args => {
    if (typeof args === 'string') args = { message: args };
    else if (args.highlight) args.message = `\x1b[1m${args.message}\x1b[0m`;

    console.log(new Date().toLocaleString('es-AR'), '|', args.message);
};

const logError = args => {
    if (args instanceof Error) args = { error: args };

    console.error(new Date().toLocaleString('es-AR'), '|', `\x1b[31m${args.error.message}\x1b[0m`);
    console.error(new Date().toLocaleString('es-AR'), '|', `\x1b[31m${args.error.stack}\x1b[0m`);

    if (!args.hasOwnProperty('exit') || args.exit) process.exit();
};

const expressRequestTarget = Object.freeze({
    restfulApi: 'RESTful API',
    frontEnd: 'front end'
 });

const logExpressRequest = target => (req, res, next) => {
    log(`Express request (${target}): ${req.protocol} ${req.method} ${req.originalUrl}`);
    next();
};

module.exports = {
    log: log,
    logError: logError,
    expressRequestTarget: expressRequestTarget,
    logExpressRequest: logExpressRequest
};
