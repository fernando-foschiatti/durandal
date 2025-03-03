vixenworks.date = { months: [...new Array(12).keys()].map(month => new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date(1, month))) };

vixenworks.error = {
    show: (responseStatusCode, notFoundMessage) => {
        const mainDiv = document.createElement('div');
        mainDiv.classList.add('vixenworks-main', 'vixenworks-error');
        const messageP = document.createElement('p');
        let message;
        switch (responseStatusCode) {
            case vixenworks.restfulApi.responseStatusCode.unauthorized:
                message = 'No autorizado.'
                break;
            case vixenworks.restfulApi.responseStatusCode.notFound:
                message = notFoundMessage;
                break;
            default:
                message = 'Ha ocurrido un error.';
        }
        messageP.textContent = message;
        mainDiv.append(messageP);
        document.body.append(mainDiv);
    }
};

vixenworks.frontEndBasePath = document.currentScript.getAttribute('basepath');

vixenworks.icon = {
    returnImg: (type, size, tooltip, class_) => {
        const response = document.createElement('img');

        response.classList.add('vixenworks-button');
        if (class_) response.classList.add(class_);

        const { src, alt } = vixenworks.icon.returnImgSrcAndAlt(type, size);
        response.setAttribute('src', src);
        response.setAttribute('alt', alt);
        response.setAttribute('title', tooltip);

        return response;
    },
    returnImgSrcAndAlt: (type, size) => ({
        src: `${vixenworks.frontEndBasePath}img/vixenworks/icon/${size}/${type.fileName}.png`,
        alt: type.alt
    }),
    size: Object.freeze({
        small: 'small',
        large: 'large'
    }),
    type: Object.freeze({
        foldedPaper: {
            fileName: 'folded-paper',
            alt: 'Folded paper'
        },
        minusSign: {
            fileName: 'minus-sign',
            alt: 'Minus sign'
        },
        plusSign: {
            fileName: 'plus-sign',
            alt: 'Plus sign'
        }
    })
};

vixenworks.number = {
    toString: args => {
        let response = '';

        const number = args.number || args;
        const absoluteParts = Math.abs(number).toFixed(args.decimalDigits || 2).split('.');
        const reversedWholePartDigits = absoluteParts[0].split('').reverse();
        for (let i = reversedWholePartDigits.length - 1; i > -1; i--) {
            response = `${response}${reversedWholePartDigits[i]}`;
            if (i % 3 === 0 && i !== 0) response = `${response}.`;
        }
        if (!args.wholePartOnly) response = `${response},${absoluteParts[1]}`;
        if (number < 0) response = `-${response}`;

        return response;
    }
};

vixenworks.restfulApi = {
    jwt: document.cookie.split(';').find(cookie => cookie.trim().startsWith('jwt='))?.split('=')[1],
    performRequest: args => new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.onload = () => {
            const response = JSON.parse(request.response);
            if (!response.error) resolve(response.data);
            else reject(request.status);
        };
        const method = args.method || vixenworks.restfulApi.method.get;
        let route = `${vixenworks.restfulApi.url[args.scope || vixenworks.restfulApi.scope.project]}${args.route || args}`;
        if (method === vixenworks.restfulApi.method.get) route = `${route}?${new Date().getTime()}`;
        request.open(method, route);
        request.setRequestHeader('Accept', 'application/json');
        if (vixenworks.restfulApi.jwt) request.setRequestHeader('Authorization', `Bearer ${vixenworks.restfulApi.jwt}`);
        if (args.payload) {
            request.setRequestHeader('Content-Type', 'application/json');
            request.send(JSON.stringify(args.payload));
        } else request.send();
    }),
    responseStatusCode: Object.freeze({
        conflict: 409,
        notFound: 404,
        unauthorized: 401
    }),
    scope: Object.freeze({
        project: 'project',
        vixenworks: 'vixenworks'
    }),
    url: JSON.parse(document.currentScript.getAttribute('restfulapiurl')),
    method: Object.freeze({
        get: 'GET',
        patch: 'PATCH',
        post: 'POST'
    })
};

vixenworks.text = {
    highlight: Object.freeze({
        begin: 'a06b78e334e0fe1eea31fc1613fb70c373d450c42975185cb76637e5434d261582a872ecab8df3be276b32fb9e9893badc5a75b3b580aba4c85471311294e4c1',
        end: '2d9448b6c907e58cee2d0d8b20982d1e1e08a4a89895863025b24172298900f6a9a26a55d4f01dc26438bfdc97e3676634261e69296dfa692cb4517c94aec214'
    }),
    returnSanitized: text =>
        text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br />')
        .replace(new RegExp(vixenworks.text.highlight.begin, 'g'), '<span class="vixenworks-highlighted">')
        .replace(new RegExp(vixenworks.text.highlight.end, 'g'), '</span>')
};
