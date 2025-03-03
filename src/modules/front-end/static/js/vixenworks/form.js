vixenworks.form = function Form(args) {
    const modal = new vixenworks.modal({ type: vixenworks.modal.type.form });

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = args.title;

    const content = document.createElement('div');
    content.classList.add('content');

    const initialValues = {};
    let firstFocusableElement = null;
    for (const [ fieldName, field ] of Object.entries(args.fields)) {
        const fieldDiv = document.createElement('div');
        fieldDiv.classList.add('field', field.type.class);

        const label = document.createElement('div');
        label.classList.add('label');
        label.textContent = field.label;

        const interactive = document.createElement('div');
        interactive.classList.add('interactive');

        let interactiveContent;
        switch (field.type) {
            case vixenworks.form.field.type.dateAndTime:
                interactiveContent = document.createElement('input');
                interactiveContent.classList.add('vixenworks-monospaced');
                flatpickr(interactiveContent, { ...field.type.configuration, defaultDate: field.value || new Date() });
                break;
            case vixenworks.form.field.type.number:
                interactiveContent = document.createElement('input');
                interactiveContent.classList.add('vixenworks-monospaced');
                interactiveContent.setAttribute('type', 'number');
                interactiveContent.value = field.value?.toString() || '0';
                break;
            case vixenworks.form.field.type.options.dropDown:
                const value = !Object.hasOwn(field, 'value') ? field.options[0].value : field.value;
                interactiveContent = document.createElement('select');
                for (const option of field.options) {
                    const optionOption = document.createElement('option');
                    if (option.value === value) optionOption.setAttribute('selected', '');
                    optionOption.textContent = option.displayName;
                    interactiveContent.append(optionOption);
                }
                break;
            case vixenworks.form.field.type.options.horizontal:
                const values = [];
                if (field.multiple) {
                    fieldDiv.classList.add('multiple');
                    if (field.value) values.push(...field.value);
                } else values.push(!Object.hasOwn(field, 'value') ? field.options[0].value : field.value);
                interactiveContent = [];
                for (const option of field.options) {
                    const div = document.createElement('div');
                    div.classList.add('option');
                    if (values.includes(option.value)) div.classList.add('selected');
                    div.textContent = option.displayName;
                    div.addEventListener('click',
                        !field.multiple
                            ? e => {
                                interactive.querySelector('.selected').classList.remove('selected');
                                e.target.classList.add('selected');
                            }
                            : e => { e.target.classList.toggle('selected'); }
                    );
                    interactiveContent.push(div);
                }
                break;
            case vixenworks.form.field.type.password:
                interactiveContent = document.createElement('input');
                interactiveContent.setAttribute('type', 'password');
                interactiveContent.setAttribute('maxlength', '255');
                break;
            case vixenworks.form.field.type.text:
                interactiveContent = document.createElement('input');
                interactiveContent.setAttribute('type', 'text');
                interactiveContent.setAttribute('maxlength', '255');
                interactiveContent.value = field.value || '';
                break;
            case vixenworks.form.field.type.text.freeForm:
                interactiveContent = document.createElement('textarea');
                interactiveContent.setAttribute('maxlength', '65535');
                interactiveContent.value = field.value || '';
                break;
        }
        if (args.mustHaveChanges) initialValues[fieldName] = field.value;

        if (!firstFocusableElement && field.type.isFocusable) firstFocusableElement = interactiveContent;

        if (!Array.isArray(interactiveContent)) interactiveContent = [ interactiveContent ];
        interactive.append(...interactiveContent);

        fieldDiv.append(label, interactive);
        content.append(fieldDiv);
    }

    const handleOkClick = e => {
        const fieldDivs = content.children;
        const validationErrors = [];
        let firstFocusableElement = null;
        let hasChanges = false;
        const payload = {};
        for (const [ fieldIndex, [ fieldName, field ] ] of Object.entries(args.fields).entries()) {
            const fieldDiv = fieldDivs[fieldIndex];
            let validationError = '';
            let value;
            switch (field.type) {
                case vixenworks.form.field.type.dateAndTime:
                    value = fieldDiv.querySelector('input')._flatpickr.selectedDates[0];
                    break;
                case vixenworks.form.field.type.number:
                    value = !field.isDecimal ? Number.parseInt(fieldDiv.querySelector('input').value, 10) : Number.parseFloat(fieldDiv.querySelector('input').value);
                    if (isNaN(value) || value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) value = 0;
                    break;
                case vixenworks.form.field.type.options.dropDown:
                    value = field.options[fieldDiv.querySelector('select').selectedIndex].value;
                    break;
                case vixenworks.form.field.type.options.horizontal:
                    value = [];
                    Array.from(fieldDiv.querySelectorAll('.option')).forEach((option, optionIndex) => {
                        if (option.classList.contains('selected')) value.push(field.options[optionIndex].value);
                    });
                    if (field.validations?.notEmpty && !value.length) validationError = 'Debe seleccionar algo en FIELD_LABEL';
                    else if (!field.multiple) value = value[0];
                    break;
                case vixenworks.form.field.type.password:
                    value = fieldDiv.querySelector('input').value;
                    break;
                case vixenworks.form.field.type.text:
                    value = fieldDiv.querySelector('input').value.trim();
                    break;
                case vixenworks.form.field.type.text.freeForm:
                    value = fieldDiv.querySelector('textarea').value.trim();
                    if (field.validations?.notEmpty && !value) validationError = 'FIELD_LABEL no puede estar vacío';
                    break;
            }

            if (validationError) {
                validationErrors.push(`- ${validationError.replace('FIELD_LABEL', `${vixenworks.text.highlight.begin}${field.label}${vixenworks.text.highlight.end}`)}.`);
                if (!firstFocusableElement && field.type.isFocusable) firstFocusableElement = fieldDiv.querySelector('.interactive').children[0];
            } else {
                if (args.mustHaveChanges) {
                    if (JSON.stringify(value) !== JSON.stringify(initialValues[fieldName])) {
                        hasChanges = true;
                        payload[fieldName] = value;
                    }
                } else payload[fieldName] = value;
            }

        }
        if (validationErrors.length) {
            new vixenworks.modal({
                type: vixenworks.modal.type.notification,
                text: validationErrors.join('\n'),
                callback: () => { if (firstFocusableElement) firstFocusableElement.focus(); }
            });
            ok.addEventListener('click', handleOkClick, { once: true });
        } else if(args.mustHaveChanges && !hasChanges) modal.close();
        else {
            vixenworks.restfulApi.performRequest({
                scope: args.restfulApiRequest.scope,
                method: args.restfulApiRequest.method,
                route: args.restfulApiRequest.route,
                payload: payload
            })
            .then(response => {
                modal.close();
                if (args.restfulApiRequest.success.notificationText)
                    new vixenworks.modal({
                        type: vixenworks.modal.type.notification,
                        text: args.restfulApiRequest.success.notificationText,
                        callback: () => { args.restfulApiRequest.success.callback(response); }
                    });
                else args.restfulApiRequest.success.callback(response);
            })
            .catch(error => {
                args.restfulApiRequest.failureCallback(error);
                ok.addEventListener('click', handleOkClick, { once: true });
            });
        }
    };

    const okCancel = document.createElement('div');
    okCancel.classList.add('ok-cancel');

    const ok = document.createElement('div');
    ok.classList.add('vixenworks-button', 'ok');
    ok.textContent = 'Aceptar';
    ok.addEventListener('click', handleOkClick, { once: true });

    if (!args.hideCancel) {
        const cancel = document.createElement('div');
        cancel.classList.add('vixenworks-button', 'cancel');
        cancel.textContent = 'Cancelar';
        cancel.addEventListener('click', modal.close, { once: true });
        okCancel.append(cancel);
    }

    okCancel.append(ok);
    content.append(okCancel);

    modal.show(title, content);
    if (firstFocusableElement) firstFocusableElement.focus();
};

// Field types
vixenworks.form.field = {
    type: Object.freeze({
        dateAndTime: {
            class: 'date-and-time',
            configuration: {
                dateFormat: 'j/n/Y H:i',
                enableTime: true,
                locale: 'es',
                minuteIncrement: 1
            },
            isFocusable: true
        },
        number: {
            class: 'number',
            isFocusable: true
        },
        options: {
            dropDown: {
                class: 'drop-down-options',
                isFocusable: true
            },
            horizontal: { class: 'horizontal-options' }
        },
        password: {
            class: 'password',
            isFocusable: true
        },
        text: {
            class: 'text',
            isFocusable: true,
            freeForm: {
                class: 'free-form-text',
                isFocusable: true
            }
        }
    })
};
