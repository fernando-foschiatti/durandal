const uuid = require('uuid');

const { vixenworks: vixenworksConfiguration } = require('./configuration');
const { errors: restfulApiErrors } = require('./restful-api/restful-api');

const requestTarget = Object.freeze({
    frontEnd: 0,
    restfulApi: 1
});

const type = Object.freeze({
    login: 1,
    month: {
        name: 2,
        number: 3
    },
    number: 4,
    password: 5,
    text: {
        freeForm: 6,
        regular: 7
    },
    timestamp: 8,
    uuid: 9,
    year: 10
});

const validateIntegerFromStringCharacters = stringCharacters => {
    let firstNonZeroDigitFound = false;
    for (const stringCharacter of stringCharacters) {
        if (stringCharacter < '0' || stringCharacter > '9') throw new Error();
        else if (stringCharacter === '0' && !firstNonZeroDigitFound) throw new Error();
        else firstNonZeroDigitFound = true;
    }
};

const singleValidate = (type_, value) => {
    switch (type_) {
        case type.uuid:
            if (!uuid.validate(value)) throw new Error();
            break;
    }
};

const validate = args => (req, res, next) => {
    try {
        const validated = {};

        // params
        for (let [ name, validation ] of Object.entries(args.params || {})) {
            let value = req.params[name];
            switch (validation.type || validation) {
                case type.month.name:
                    value = [...new Array(12).keys()].map(month => new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date(1, month))).indexOf(value.toLowerCase());
                    if (value === -1) throw new Error();
                    break;
                case type.month.number:
                    if ([...value].length > 2) throw new Error();
                    validateIntegerFromStringCharacters([...value]);
                    value = Number.parseInt(value, 10) - 1;
                    if (value > 11) throw new Error();
                    break;
                case type.number:
                    if ([...value].length > 5) throw new Error();
                    validateIntegerFromStringCharacters([...value]);
                    value = Number.parseInt(value, 10);
                    if (value > 65535) throw new Error();
                    break;
                case type.uuid:
                    singleValidate(type.uuid, value);
                    break;
                case type.year:
                    if ([...value].length !== 4) throw new Error();
                    validateIntegerFromStringCharacters([...value]);
                    value = Number.parseInt(value, 10);
                    break;
            }
            validated[name] = value;
        }

        // body
        for (let [ name, validation ] of Object.entries(args.body || {})) {
            if (req.method === 'PATCH' && !Object.hasOwn(req.body, name)) continue;
            let value = req.body[name];
            if (!validation.multiple) {
                switch (validation.type || validation) {
                    case type.login:
                        if (typeof value !== 'string' || [...value.trim()].length < vixenworksConfiguration['User authentication']['Login minimum length'] || [...value.trim()].length > 64) throw new Error();
                        break;
                    case type.number:
                        if (typeof value !== 'number' || value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) throw new Error();
                        if (validation.range && (value < validation.range[0] || value > validation.range[1])) throw new Error();
                        break;
                    case type.password:
                        if (typeof value !== 'string' || [...value].length < vixenworksConfiguration['User authentication']['Password minimum length'] || [...value].length > 255) throw new Error();
                    case type.text.freeForm:
                        value = value.trim();
                        if ([...value].length > 65535) throw new Error();
                        if (validation.notEmpty && !value) throw new Error();
                        break;
                    case type.text.regular:
                        if (typeof value !== 'string' || [...value.trim()].length > 255) throw new Error();
                        if (validation.values && !validation.values.includes(value)) throw new Error();
                        value = value.trim();
                        break;
                    case type.timestamp:
                        if (typeof value !== 'string') throw new Error();
                        const parsed = Date.parse(value);
                        if (isNaN(parsed) || parsed < new Date('1000-01-01T00:00:00.000Z') || parsed > new Date('9999-12-31T23:59:59.999Z')) throw new Error();
                        value = new Date(value);
                        value.setUTCSeconds(0, 0);
                        break;
                }
            } else {
                if (!Array.isArray(value)) throw new Error();
                if (validation.notEmpty && !value.length) throw new Error();
                const upperCaseValues = value.map(value_ => value_.toUpperCase());
                if (upperCaseValues.filter((element, index) => upperCaseValues.indexOf(element) !== index).length) throw new Error();
                value.forEach(value_ => singleValidate(validation.type, value_));
            }
            validated[name] = value;
        }
        req.validated = validated;
        next();
    } catch (error) {
        if (args.requestTarget === requestTarget.frontEnd) res.render('vixenworks/not-found', args.notFound);
        else res.status(args.res?.status || 400).json({ data: null, error: args.res?.error || restfulApiErrors.vixenworks.wrongParameters });
    }
};

module.exports = {
    requestTarget: requestTarget,
    type: type,
    validate: validate
};
