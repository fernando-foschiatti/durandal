const { readFileSync } = require('fs');

module.exports = {
    vixenworks: JSON.parse(readFileSync('conf/vixenworks.json')),
    project: JSON.parse(readFileSync('conf/project.json')),
    instance: JSON.parse(readFileSync('conf/instance.json'))
};
