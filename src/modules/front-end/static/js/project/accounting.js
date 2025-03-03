project.accounting = {
    returnCuitDigitoVerificador: (tipo, numero) => {
        var digitoVerificador = 0;
        var nuevoTipo = 0;
        var onceMenosSumaDeProductosModuloOnce = 0;
        var sumaDeProductos = 0;

        [...tipo.toString() + numero.toString().padStart(8, '0')].reverse().forEach(function(digito, indiceDigito) {
            sumaDeProductos += parseInt(digito, 10) * (2 + (indiceDigito % 6));
        });

        onceMenosSumaDeProductosModuloOnce = 11 - sumaDeProductos % 11;

        if (onceMenosSumaDeProductosModuloOnce === 11) {
            digitoVerificador = 0;
        } else if (onceMenosSumaDeProductosModuloOnce === 10) {
            nuevoTipo = [20, 27, 24].includes(tipo) ? 23 : 33;
            digitoVerificador = project.accounting.returnCuitDigitoVerificador(nuevoTipo, numero);
        } else {
            digitoVerificador = onceMenosSumaDeProductosModuloOnce;
        }

        return digitoVerificador;
    },
    showInputVat: args => {
        vixenworks.restfulApi.performRequest(`commercial-documents/purchases/${args.year}/${args.month}`)
        .then(commercialDocuments => {
            let monthName = vixenworks.date.months[args.month - 1];
            monthName = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;
            document.title = `${document.title} (${monthName} de ${args.year})`;
            const listingData = [];

            let net105Total, net21Total, vat105Total, vat21Total, otherTaxesTotal, exemptTotal, totalTotal;
            net105Total = net21Total = vat105Total = vat21Total = otherTaxesTotal = exemptTotal = totalTotal = new Big(0);
            for (const commercialDocument of commercialDocuments) {
                listingData.push({
                    date: commercialDocument.date,
                    supplier: commercialDocument.supplier.apellidoYNombreORazonSocial,
                    cuit: commercialDocument.supplier.cuit,
                    type: commercialDocument.type,
                    number: commercialDocument,
                    file: commercialDocument.file ? { type: vixenworks.icon.type.foldedPaper, size: vixenworks.icon.size.small, tooltip: 'Ver fichero' } : null,
                    fileName: commercialDocument.file,
                    net105: commercialDocument.net105,
                    net21: commercialDocument.net21,
                    vat105: commercialDocument.vat105,
                    vat21: commercialDocument.vat21,
                    otherTaxes: commercialDocument.otherTaxes,
                    exempt: commercialDocument.exempt,
                    total: commercialDocument.total
                });
                if (commercialDocument.type === 'Credit note') {
                    net105Total = net105Total.minus(commercialDocument.net105);
                    net21Total = net21Total.minus(commercialDocument.net21);
                    vat105Total = vat105Total.minus(commercialDocument.vat105);
                    vat21Total = vat21Total.minus(commercialDocument.vat21);
                    otherTaxesTotal = otherTaxesTotal.minus(commercialDocument.otherTaxes);
                    exemptTotal = exemptTotal.minus(commercialDocument.exempt);
                    totalTotal = totalTotal.minus(commercialDocument.total);
                } else {
                    net105Total = net105Total.plus(commercialDocument.net105);
                    net21Total = net21Total.plus(commercialDocument.net21);
                    vat105Total = vat105Total.plus(commercialDocument.vat105);
                    vat21Total = vat21Total.plus(commercialDocument.vat21);
                    otherTaxesTotal = otherTaxesTotal.plus(commercialDocument.otherTaxes);
                    exemptTotal = exemptTotal.plus(commercialDocument.exempt);
                    totalTotal = totalTotal.plus(commercialDocument.total);
                }
            }
            new vixenworks.listing({
                title: `Libro de IVA compras para el período de ${monthName} de ${args.year}`,
                columns: {
                    date: { type: vixenworks.listing.column.type.date },
                    supplier: 'Proveedor',
                    cuit: {
                        displayName: 'CUIT',
                        type: {
                            classes: [ 'vixenworks-centered', 'vixenworks-monospaced' ],
                            modification: cuit => [ cuit.type, cuit.number, project.accounting.returnCuitDigitoVerificador(cuit.type, cuit.number)].join('-')
                        }
                    },
                    type: {
                        displayName: 'Tipo',
                        type: { modification: type => project.commercialDocuments.type[type].displayName }
                    },
                    number: {
                        displayName: 'Número',
                        type: {
                            classes: [ 'vixenworks-centered', 'vixenworks-monospaced' ],
                            modification: commercialDocument => project.commercialDocuments.toString(commercialDocument)
                        }
                    },
                    file: {
                        type: vixenworks.listing.column.type.icon,
                        onClick: {
                            url: `files/project/{fileName}?${new Date().getTime()}`,
                            tooltip: 'Ver fichero',
                            target: '_blank'
                        }
                    },
                    net105: {
                        displayName: 'Neto 10,5%',
                        type: vixenworks.listing.column.type.number
                    },
                    net21: {
                        displayName: 'Neto 21%',
                        type: vixenworks.listing.column.type.number
                    },
                    vat105: {
                        displayName: 'IVA 10,5%',
                        type: vixenworks.listing.column.type.number
                    },
                    vat21: {
                        displayName: 'IVA 21%',
                        type: vixenworks.listing.column.type.number
                    },
                    otherTaxes: {
                        displayName: 'Otros impuestos',
                        type: vixenworks.listing.column.type.number
                    },
                    exempt: {
                        displayName: 'Exento',
                        type: vixenworks.listing.column.type.number
                    },
                    total: {
                        displayName: 'Total',
                        type: vixenworks.listing.column.type.number
                    }
                },
                tableFooter: {
                    columns: [
                        {
                            type: { class: 'vixenworks-centered' },
                            columnsWidth: 6,
                            content: 'Totales'
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: net105Total.toNumber()
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: net21Total.toNumber()
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: vat105Total.toNumber()
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: vat21Total.toNumber()
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: otherTaxesTotal.toNumber()
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: exemptTotal.toNumber()
                        },
                        {
                            type: vixenworks.listing.column.type.number,
                            content: totalTotal.toNumber()
                        }
                    ]
                },
                data: listingData,
                container: 'Main'
            });
        })
        .catch(error => {
            vixenworks.error.show(error, 'No hay documentos comerciales de compras para el período solicitado.');
        });
    },
    showInputVatAvailablePeriods: () => {
        vixenworks.restfulApi.performRequest('commercial-documents/purchases/available-periods')
        .then(availablePeriods => {
            new project.summary.availablePeriods({
                title: 'IVA compras',
                availablePeriods: availablePeriods,
                class: 'input-vat',
                path: 'contabilidad/iva-compras'
            });
        })
        .catch(error => { vixenworks.error.show(error, 'No hay documentos comerciales de compras.'); });
    }
};
