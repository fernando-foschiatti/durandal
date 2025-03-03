vixenworks.login = () => {
    const requestedUrl = window.location.href;
    new vixenworks.modal({
        type: vixenworks.modal.type.notification,
        text: 'Debe iniciar sesión para continuar.',
        callback: () => {
            new vixenworks.form({
                title: 'Inicio de sesión',
                fields: {
                    login: {
                        label: 'Nombre de usuario',
                        type: vixenworks.form.field.type.text
                    },
                    password: {
                        label: 'Contraseña',
                        type: vixenworks.form.field.type.password
                    }
                },
                hideCancel: true,
                restfulApiRequest: {
                    scope: vixenworks.restfulApi.scope.vixenworks,
                    method: vixenworks.restfulApi.method.post,
                    route: 'users/login',
                    success: {
                        callback: response => {
                            document.cookie = `jwt=${response.jwt}; Path=${vixenworks.frontEndBasePath}; Secure`;
                            window.location.replace(`${window.location.origin}${vixenworks.frontEndBasePath}vixenworks/register-session?requestedurl=${encodeURI(requestedUrl)}`);
                        }
                    },
                    failureCallback: error => {
                        new vixenworks.modal({
                            type: vixenworks.modal.type.notification,
                            text: error === vixenworks.restfulApi.responseStatusCode.unauthorized ? 'No autorizado.' : 'Ha ocurrido un error.'
                        });
                    }
                }
            });
        }
    });
};
