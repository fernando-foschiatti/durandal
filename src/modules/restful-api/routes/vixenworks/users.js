const express = require('express');
const jwt = require('jsonwebtoken');

const expressValidator = require('../../../express-validator');
const { logError } = require('../../../loggers');
const model = require('../../../model/model');
const { errors, jwtKey } = require('../../restful-api');

const router = express.Router();
router.use(express.json());

// Login
router.post('/login', expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    body: {
        login: expressValidator.type.login,
        password: expressValidator.type.password
    },
    res: {
        status: 401,
        error: errors.vixenworks.unauthorized
    }
}), (req, res) => {
    model.vixenworks.users.returnProfileNameByLoginPassword(req.validated.login, req.validated.password)
    .then(profileName => {
        if (!profileName) throw new Error(errors.vixenworks.unauthorized.message);

        return new Promise((resolve, reject) => {
            jwt.sign({ login: req.validated.login, profile: { name: profileName } }, jwtKey, (err, token) => {
                if (err) reject(err);

                resolve(token);
            });
        });
    })
    .then(token => { res.status(200).json({ data: { jwt: token }, error: null }); })
    .catch(error => {
        if (error.message === errors.vixenworks.unauthorized.message) {
            res.status(401).json({ data: null, error: errors.vixenworks.unauthorized });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.vixenworks.user.errorLoggingIn });
        }
    });
});

module.exports = {
    router: router
};
