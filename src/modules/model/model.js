const { readdirSync } = require('fs');

module.exports = {
    project: {},
    vixenworks: {}
};

for (const scope of [ 'project', 'vixenworks' ]) {
    readdirSync(`src/modules/model/${scope}/`).forEach(fileName => {
        const model = require(`./${scope}/${fileName}`);
        module.exports[scope][`${model.name_ || fileName.slice(0, -3)}`] = model;
    });
}
