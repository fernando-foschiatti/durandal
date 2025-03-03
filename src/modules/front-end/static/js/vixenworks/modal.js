vixenworks.modal = function Modal(args) {
    const overlayZIndex = (document.body.querySelectorAll('.vixenworks-modal.overlay').length + 1) * 10;
    const overlay = document.createElement('div');
    overlay.classList.add('vixenworks-modal', 'overlay');
    overlay.style.zIndex = overlayZIndex.toString();
    document.body.append(overlay);

    const modal = document.createElement('div');
    modal.classList.add('vixenworks-modal', 'modal', args.type.class);
    modal.style.zIndex = (overlayZIndex + 1).toString();

    switch (args.type) {
        case vixenworks.modal.type.notification:
            const text = document.createElement('div');
            text.classList.add('text');
            text.innerHTML = vixenworks.text.returnSanitized(args.text);
            modal.append(text);

            const ok = document.createElement('div');
            ok.classList.add('vixenworks-button', 'ok');
            ok.textContent = 'Aceptar';
            ok.addEventListener('click', e => {
                this.close();
                if (args.callback) args.callback();
            }, { once: true });

            if (args.showCancel) {
                const cancel = document.createElement('div');
                cancel.classList.add('vixenworks-button', 'cancel');
                cancel.textContent = 'Cancelar';
                cancel.addEventListener('click', e => { this.close(); }, { once: true });
                modal.append(cancel);
            }
            modal.append(ok);

            document.body.append(modal);
            break;
    }

    this.show = (title, content) => {
        modal.append(title, content);
        document.body.append(modal);
    };

    this.close = () => {
        modal.remove();
        overlay.remove();
    };
};

vixenworks.modal.type = Object.freeze({
    form: { class: 'vixenworks-form' },
    notification: { class: 'notification' }
});
