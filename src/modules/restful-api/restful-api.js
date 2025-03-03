const express = require('express');
const { readdirSync, readFileSync } = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');
const path = require('path');

const { instance, project } = require('../configuration');
const { log, logError, expressRequestTarget, logExpressRequest } = require('../loggers');
const model = require('../model/model');

const initialize = () => {
    log('Initializing RESTful API...');

    log('Reading and parsing configuration file...');
    const configuration = JSON.parse(readFileSync('conf/restful-api/conf.json'));
    log('Reading and parsing errors file...');
    module.exports.errors = Object.freeze({
        badParameters: 'VIXENWORKS_RESTFUL_API_BAD_PARAMETERS',
        notFound: 'VIXENWORKS_RESTFUL_API_NOT_FOUND',
        project: JSON.parse(readFileSync('conf/restful-api/project-errors.json')),
        vixenworks: JSON.parse(readFileSync('conf/restful-api/vixenworks-errors.json'))
    });

    module.exports.profilesAndPermissions = {};

    module.exports.updateProfilesAndPermissions = () => {
        model.vixenworks.users.profiles.returnWithPermissions()
        .then(profilesWithPermissions => {
            for (const profile in this.profilesAndPermissions) delete this.profilesAndPermissions[profile];
            profilesWithPermissions.forEach(profileWithPermission => {
                if (!this.profilesAndPermissions[profileWithPermission.name]) this.profilesAndPermissions[profileWithPermission.name] = [];
                this.profilesAndPermissions[profileWithPermission.name].push(profileWithPermission.permission.name);
            });
        })
        .catch(error => { logError(error); });
    };

    log('Setting up profiles and permissions...');
    this.updateProfilesAndPermissions();

    // JWT key
    module.exports.jwtKey = configuration['JWT key'] || process.env[`VIXENWORKS_${project.Name}_${instance.Name}}_RESTFUL_API_JWT_KEY`.toUpperCase().replace(/[^A-Z0-9]/g, '_')];

    // Express initialization
    const app = express();
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);

    // Logging
    if (!configuration.hasOwnProperty('Log requests?') || configuration['Log requests?'])
        app.use(logExpressRequest(expressRequestTarget.restfulApi));

    // CORS
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PATCH');
        res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        next();
    });

    // Authorization
    module.exports.authorization = permission => (req, res, next) => {
        try {
            jwt.verify(req.headers.authorization.split('Bearer ')[1], this.jwtKey, (err, decoded) => {
                if (err) throw err;
                if (!this.profilesAndPermissions[decoded.profile.name]?.includes(permission)) throw new Error();

                next();
            });
        } catch (e) {
            res.status(401).json({ data: null, error: this.errors.vixenworks.unauthorized });
        }
    };

    // Routes
    log('Mounting routes...');
    for (const scope of [ 'project', 'vixenworks' ]) {
        readdirSync(`src/modules/restful-api/routes/${scope}/`).forEach(routeFileName => {
            const route = require(`./routes/${scope}/${routeFileName}`);
            const routeName = routeFileName.slice(0, -3);
            const routePath = `${configuration['Base path']}${scope === 'project' ? project.Name.toLowerCase().replace(/[^a-z0-9]/g, '-') : scope}/${route.path || routeName}`;
            app.use(routePath, route.router);
            log({ message: `Route for ${route.name || routeName} mounted at ${routePath}.`, highlight: true });
        });
    }

    // Not found
    app.use((req, res) => {
        res.status(404).json({ data: null, error: this.errors.vixenworks.notFound });
    });

    // Unhandled errors
    app.use((err, req, res, next) => {
        logError({ error: err, exit: false });
        res.status(500).json({ data: null, error: this.errors.vixenworks.unexpected });
    });

    // HTTPS server
    https.createServer({ key: readFileSync('res/https/key.pem'), cert: readFileSync('res/https/cert.pem') }, app).listen(configuration.Port);
    log({ message: `RESTful API listening for requests at port ${configuration.Port} and base path ${configuration['Base path']}.`, highlight: true });
    log({ message: 'RESTful API initialization complete.', highlight: true });
};
const files = path.join(__dirname, '..', '..', '..', 'res', 'files');
module.exports.files = {
    project: path.join(files, 'project'),
    vixenworks: path.join(files, 'vixenworks')
};

module.exports.initialize = initialize;
