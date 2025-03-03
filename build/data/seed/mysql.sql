USE `vixenworks_durandal_dev`;

INSERT INTO `vxn_profile` VALUES
    (NULL, 'Administración'),
    (NULL, 'Propietario'),
    (NULL, 'Técnico');

INSERT INTO `vxn_permission` VALUES
    (NULL, 'Aparecer en eventos de compras'),
    (NULL, 'Escribir compras'),
    (NULL, 'Leer compras'),
    (NULL, 'Leer contabilidad');

INSERT INTO `vxn_profile_permission` VALUES
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 1),
    (1, 2),
    (3, 2),
    (4, 2),
    (1, 3);

INSERT INTO `vxn_user` VALUES
    (NULL, 'ff0000', 'AD', FALSE, 'usuarioad', 'Usuario Administración', '$2b$10$6IMvyUgWFvrGC.Dt3hSQWeUu2HtTUanskhfl2e3Dl68HNhNhfEaN.', UNHEX(REPLACE(UUID(), '-', '')), 1),
    (NULL, '00ff00', 'PR', FALSE, 'usuariopr', 'Usuario Propietario', '$2b$10$tDrLwEACEC9NGL7roaxnROQ5pqPbolLo6aDkOGB8l5NgCQctOeGie', UNHEX(REPLACE(UUID(), '-', '')), 2),
    (NULL, '0000ff', 'TE', FALSE, 'usuariote', 'Usuario Técnico', '$2b$10$9NIgZLdpq1wAUrt9a5CDjOVjPQlrAx6a9g.Eo4BeMhHwXFjDfakum', UNHEX(REPLACE(UUID(), '-', '')), 3);

INSERT INTO `drn_customer_and_supplier` VALUES
    (NULL, 'Cerámicas El Norte SRL', FALSE, TRUE, 'Cerámicas El Norte', 1234567, 'ceramicas-el-norte', 20),
    (NULL, 'Emandios de Huestes SRL', FALSE, TRUE, 'Emandios', 2345678, 'emandios', 20),
    (NULL, 'Los Andamios SA', FALSE, TRUE, 'Los Andamios', 1234567, 'los-andamios', 30);

INSERT INTO `drn_localidad` VALUES
    (1, 'Banfield', 'Buenos Aires'),
    (2, 'Santa Rosa', 'La Pampa'),
    (3, 'Teodelina', 'Santa Fe');

INSERT INTO `drn_site` VALUES
    (NULL, 'Dr. Arizmendi 1.354', '', 1, 1),
    (NULL, 'Corredor II kilómetro 12', '', 2, 2),
    (NULL, 'Av. San Ignacio 407', '', 3, 3);

INSERT INTO `drn_purchase` VALUES
    (NULL, 1, 'Cerámicas', 1, 'Finalized'),
    (NULL, 2, 'Pintura de inmueble', 2, 'Finalized'),
    (NULL, 3, 'Andamios', 3, 'Finalized');

INSERT INTO `drn_purchase_event` VALUES
    (NULL, 'Pido cotización por cerámicas.', 1, '2022-05-04 16:19:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Recibo la cotización y confirmo la compra.', 1, '2022-05-09 12:16:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Recibo la factura.', 1, '2022-05-12 13:04:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Pago la factura y recibo el recibo.', 1, '2022-05-22 18:11:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Retiramos el pedido.', 1, '2022-06-03 19:22:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Se contratan los servicios de pintura para el inmueble principal (cotizaron $ 500.000, la mitad se facturará.).', 2, '2023-03-24 04:19:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Trabajo terminado. Recibo la factura por la mitad de lo cotizado.', 2, '2023-04-27 13:00:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Pido cotización por 2 andamios.', 3, '2023-07-14 15:09:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Recibo la cotización.', 3, '2023-07-19 22:26:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Pedido recibido.', 3, '2023-07-21 04:42:00', UNHEX(REPLACE(UUID(), '-', ''))),
    (NULL, 'Recibo un reclamo por el pago.', 3, '2023-08-03 13:44:00', UNHEX(REPLACE(UUID(), '-', '')));

INSERT INTO `drn_purchase_event_status` VALUES
    (1, 'Awaiting estimate'),
    (2, 'Confirmed'),
    (5, 'Finalized'),
    (6, 'Confirmed'),
    (7, 'Finalized'),
    (8, 'Awaiting estimate'),
    (9, 'Confirmed'),
    (10, 'Finalized');

INSERT INTO `drn_purchase_event_user` VALUES
    (1, 2),
    (2, 2),
    (2, 1),
    (3, 1),
    (4, 2),
    (5, 3),
    (5, 1),
    (6, 1),
    (7, 1),
    (8, 1),
    (9, 2),
    (10, 1),
    (11, 1);

INSERT INTO `drn_file` VALUES
    (NULL, 1, 'Invoice'),
    (NULL, 2, 'Estimate');

INSERT INTO `drn_purchase_event_file` VALUES
    (1, 3),
    (2, 9);

INSERT INTO `drn_commercial_document` VALUES
    (1, '2022-05-09', 0, 'A', 0, 10000, 45205, 300, 1, 12400, 'Invoice', UNHEX(REPLACE(UUID(), '-', '')), 0, 2100),
    (2, '2023-04-25', 0, 'A', 0, 250000, 214, 400, 51, 302900, 'Invoice', UNHEX(REPLACE(UUID(), '-', '')), 0, 52500);

INSERT INTO `drn_invoice_balance` VALUES
    (1, 0),
    (2, 302900);

INSERT INTO `drn_purchase_event_commercial_document` VALUES
    (1, 3),
    (2, 7);

INSERT INTO `drn_purchase_balance` VALUES
    (1, 250000, 250000, 6, UNHEX(REPLACE(UUID(), '-', ''))),
    (2, 400208, 400208, 10, UNHEX(REPLACE(UUID(), '-', '')));

INSERT INTO `drn_purchase_category` VALUES
    (1, 'Bienes materiales para el funcionamiento de la empresa.', TRUE, 'Bienes'),
    (2, 'Equipamiento para clientes.', TRUE, 'Equipamiento'),
    (3, 'Para terceros.', FALSE, 'Intermediarios'),
    (4, 'Servicios para el funcionamiento de la empresa.', TRUE, 'Servicios'),
    (5, 'Varios.', TRUE, 'Varios');

INSERT INTO `drn_purchase_invoice_category` VALUES
    (1, 1, 12400),
    (2, 4, 302900);

INSERT INTO `drn_purchase_balance_category` VALUES
    (1, 4, 250000),
    (2, 1, 400208);

INSERT INTO `drn_purchase_payment` VALUES
    (NULL, 12400, 4, UNHEX(REPLACE(UUID(), '-', '')));

INSERT INTO `drn_purchase_invoice_payment` VALUES
    (1, 1);
