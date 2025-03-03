project.sites = {
    toString: site => {
        let response = '';

        if (site.address) response = `${site.address} - `;
        response = `${response}${site.localidad.name} (${site.localidad.province})`;
        if (site.denominacionAdicional) response = `${response} - ${site.denominacionAdicional}`;

        return response;
    }
};
