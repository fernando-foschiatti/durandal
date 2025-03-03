const cookieParser = require('cookie-parser');
const express = require('express');
const expressSession = require('express-session');
const { readFileSync } = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');
const path = require('path');

const { instance, project } = require('../configuration');
const { log, logError, expressRequestTarget, logExpressRequest } = require('../loggers');
const model = require('../model/model');
const restfulApi = require('../restful-api/restful-api');

const initialize = () => {
    log('Initializing front end...');

    log('Reading and parsing configuration file...');
    const configuration = { ...JSON.parse(readFileSync('conf/front-end/conf.json')), Required: JSON.parse(readFileSync('conf/front-end/required.json')) };
    const basePath = configuration['Base path'];
    const restfulApiUrl = configuration['RESTful API URL'];
    const port = configuration.Port || 443;

    // Express initialization
    const app = express();
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);

    // Logging
    if (!configuration.hasOwnProperty('Log requests?') || configuration['Log requests?'])
        app.use(logExpressRequest(expressRequestTarget.frontEnd));

    // Session
    const projectNormalizedName = project.Name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sessionSecret = configuration['Session secret'] || process.env[`VIXENWORKS_${projectNormalizedName}_${instance.Name.replace(/[^A-Z0-9]/g, '_')}_FRONT_END_SESSION_SECRET`.toUpperCase()];
    app.use(expressSession({
        cookie: {
            path: basePath,
            secure: true
        },
        name: projectNormalizedName,
        resave: false,
        saveUninitialized: false,
        secret: sessionSecret
    }));

    // Local variables
    app.use((req, res, next) => {
        // -- Application
        if (!app.locals.basePath) {
            app.locals.basePath = basePath;
            app.locals.required = {
                css: {
                    project: configuration.Required.CSS ? configuration.Required.CSS.Project || [] : [],
                    vixenworks: configuration.Required.CSS ? configuration.Required.CSS.Vixenworks || [] : []
                },
                js: {
                    project: configuration.Required.JavaScript ? configuration.Required.JavaScript.Project || [] : [],
                    vixenworks: configuration.Required.JavaScript ? configuration.Required.JavaScript.Vixenworks || [] : []
                }
            };
            app.locals.restfulApiUrl = {
                project: `${restfulApiUrl}${projectNormalizedName}/`,
                vixenworks: `${restfulApiUrl}vixenworks/`
            };
            app.locals.title = 'Vixenworks';
        }
        // -- Request
        res.locals.user = req.session?.user;
        next();
    });

    // Templating
    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views'));

    // Authorization
    module.exports.authorization = (req, res, next) => {
        if (!res.locals.user) {
            res.render('vixenworks/login', {
                title: `${project.Name} - Iniciar sesión`,
                css: { vixenworks: [ 'form', 'modal' ] },
                js: { vixenworks: [ 'form', 'login', 'modal' ] }
            });
        }
        else next();
    };

    // Static files
    app.use(basePath, express.static(path.join(__dirname, 'static')));
    app.use(basePath, express.static(path.join(__dirname, '..', '..', '..', 'res', 'front-end', 'static-files')));
    app.use(basePath, express.static(path.join(__dirname, '..', '..', '..', 'dep')));
    app.use(`${basePath}files/project/`, module.exports.authorization, express.static(path.join(__dirname, '..', '..', '..', 'res', 'files', 'project')));

    // Register session
    app.use(cookieParser());
    app.get(`${basePath}vixenworks/register-session`, (req, res) => {
        let userProfile;

        new Promise((resolve, reject) => {
            if (res.locals.user) reject();

            resolve();
        })
        .then(() => new Promise((resolve, reject) => {
            jwt.verify(req.cookies.jwt, restfulApi.jwtKey, (err, decoded) => {
                if (err) reject();

                resolve(decoded);
            });
        }))
        .then(decodedToken => {
            userProfile = decodedToken.profile.name;

            return model.vixenworks.users.returnNameByLogin(decodedToken.login);
        })
        .then(userName => {
            if (!userName) reject();

            req.session.user = { name: userName, permissions: restfulApi.profilesAndPermissions[userProfile] };
            res.redirect(req.query.requestedurl);
        })
        .catch(() => {
            res.status(401).render('vixenworks/error', { title: 'Unauthorized', message: 'Unauthorized.' });
        });
    });

    // Logout
    app.get(`${basePath}vixenworks/logout`, (req, res) => {
        try {
            if (!res.locals.user) throw new Error();

            req.session.regenerate(err => {
                if (err) throw err;

                res.locals.user = null;
                res.render('vixenworks/logout', {
                    title: `Vixenworks - Logout`,
                    js: { vixenworks: [ 'logout' ] }
                });
            });
        } catch (error) {
            res.status(401).render('vixenworks/error', { title: 'Unauthorized', message: 'Unauthorized.' });
        }
    });

    // Routes
    // -- Project
    // ---- Home
    app.use(`${basePath}`, require('./routes/project/home').router);

    // ---- Accounting
    // ------ Input VAT
    app.use(`${basePath}contabilidad/iva-compras`, require('./routes/project/accounting-input-vat').router);

    // ---- Purchase
    // ------ Details
    app.use(`${basePath}compra`, require('./routes/project/purchase').router);

    // ---- Purchases
    app.use(`${basePath}compras`, require('./routes/project/purchases').router);

    // Not found
    app.use((req, res) => {
        res.status(404).render('vixenworks/error', { title: 'Not found', message: 'Not found.' });
    });

    // Unhandled errors
    app.use((err, req, res, next) => {
        logError({ error: err, exit: false });
        res.status(500).render('vixenworks/error', { title: 'Error', message: 'Error.' });
    });

    // HTTPS server
    https.createServer({ key: readFileSync('res/https/key.pem'), cert: readFileSync('res/https/cert.pem') }, app).listen(port);
    log({ message: `Front end listening for requests at port ${port} and base path ${configuration['Base path']}.`, highlight: true });
    log({ message: 'Front end initialization complete.', highlight: true });
};

module.exports = {
    initialize: initialize
};
