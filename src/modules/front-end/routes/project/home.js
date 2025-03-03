const express = require('express');

const { project } = require('../../../configuration');
const { authorization } = require('../../front-end');

const router = express.Router();

router.get('', authorization, (req, res) => {
    res.render('project/home', {
        title: `${project.Name} - Inicio`
    });
});

module.exports = {
    router: router
};
