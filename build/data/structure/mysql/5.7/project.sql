USE `vixenworks_durandal_dev`;

-- Customers and suppliers

CREATE TABLE `drn_customer_and_supplier` (
    `drn_customer_and_supplier_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `apellidoynombreorazonsocial` varchar(255) NOT NULL,
    `iscustomer` tinyint(1) NOT NULL,
    `issupplier` tinyint(1) NOT NULL,
    `name` varchar(255) NOT NULL,
    `numerodecuit` int (10) unsigned NOT NULL,
    `slug` varchar(255) NOT NULL,
    `tipodecuit` tinyint(3) unsigned NOT NULL,

    PRIMARY KEY (`drn_customer_and_supplier_id`),
    UNIQUE KEY `u_name` (`name`),
    UNIQUE KEY `u_cuit` (`numerodecuit`,`tipodecuit`),
    UNIQUE KEY `u_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Localidades

CREATE TABLE `drn_localidad` (
    `drn_localidad_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `name` varchar(255) NOT NULL,
    `province` enum('Buenos Aires','Catamarca','Chaco','Chubut','Ciudad Autónoma de Buenos Aires','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán') NOT NULL,

    PRIMARY KEY (`drn_localidad_id`),
    UNIQUE KEY `u_name` (`name`,`province`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Sites

CREATE TABLE `drn_site` (
    `drn_site_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `address` varchar(255) NOT NULL,
    `denominacionadicional` varchar(255) NOT NULL,
    `drn_customer_and_supplier_id` smallint(5) unsigned NOT NULL,
    `drn_localidad_id` smallint(5) unsigned NOT NULL,

    PRIMARY KEY (`drn_site_id`),
    KEY `k_customer_supplier` (`drn_customer_and_supplier_id`),
    KEY `k_localidad` (`drn_localidad_id`),
    CONSTRAINT `fk_drn_site_drn_customer_and_supplier_id` FOREIGN KEY (`drn_customer_and_supplier_id`) REFERENCES `drn_customer_and_supplier` (`drn_customer_and_supplier_id`),
    CONSTRAINT `fk_drn_site_drn_localidad_id` FOREIGN KEY (`drn_localidad_id`) REFERENCES `drn_localidad` (`drn_localidad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases

CREATE TABLE `drn_purchase` (
    `drn_purchase_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `drn_site_id` smallint(5) unsigned NOT NULL,
    `name` varchar(255) NOT NULL,
    `number` smallint(5) unsigned NOT NULL,
    `status` enum('Awaiting estimate','Cancelled','Confirmed','Estimate received','Finalized','In transit','Not started') NOT NULL,

    PRIMARY KEY (`drn_purchase_id`),
    UNIQUE KEY `u_number` (`number`),
    KEY `k_site` (`drn_site_id`),
    CONSTRAINT `fk_drn_purchase_drn_site_id` FOREIGN KEY (`drn_site_id`) REFERENCES `drn_site` (`drn_site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases events

CREATE TABLE `drn_purchase_event` (
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `details` text NOT NULL,
    `drn_purchase_id` smallint(5) unsigned NOT NULL,
    `timestamp` datetime NOT NULL,
    `uuid` binary(16) NOT NULL,

    PRIMARY KEY (`drn_purchase_event_id`),
    UNIQUE KEY `u_timestamp` (`drn_purchase_id`,`timestamp`),
    UNIQUE KEY `u_uuid` (`uuid`),
    KEY `k_purchase` (`drn_purchase_id`),
    CONSTRAINT `fk_drn_purchase_event_drn_purchase_id` FOREIGN KEY (`drn_purchase_id`) REFERENCES `drn_purchase` (`drn_purchase_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases events status

CREATE TABLE `drn_purchase_event_status` (
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL,

    `status` enum('Awaiting estimate','Cancelled','Confirmed','Estimate received','Finalized','In transit','Not started') NOT NULL,

    PRIMARY KEY (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_event_status_drn_purchase_event_id` FOREIGN KEY (`drn_purchase_event_id`) REFERENCES `drn_purchase_event` (`drn_purchase_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases events users

CREATE TABLE `drn_purchase_event_user` (
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL,
    `vxn_user_id` smallint(5) unsigned NOT NULL,

    PRIMARY KEY (`drn_purchase_event_id`,`vxn_user_id`),
    KEY `k_user` (`vxn_user_id`),
    CONSTRAINT `fk_drn_purchase_event_user_drn_purchase_event_id` FOREIGN KEY (`drn_purchase_event_id`) REFERENCES `drn_purchase_event` (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_event_user_vxn_user_id` FOREIGN KEY (`vxn_user_id`) REFERENCES `vxn_user` (`vxn_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Files

CREATE TABLE `drn_file` (
    `drn_file_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `number` smallint(5) unsigned NOT NULL,
    `type` enum('Account balance','Cheque','Credit note','Debit note','Delivery note','Estimate','Invoice','Other','Payment order','Product details','Proforma invoice','Proof of payment','Receipt','Transport token') NOT NULL,

    PRIMARY KEY (`drn_file_id`),
    UNIQUE KEY `u_number` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases events files

CREATE TABLE `drn_purchase_event_file` (
    `drn_file_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL,

    PRIMARY KEY (`drn_file_id`,`drn_purchase_event_id`),
    KEY `k_event` (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_event_file_drn_file_id` FOREIGN KEY (`drn_file_id`) REFERENCES `drn_file` (`drn_file_id`),
    CONSTRAINT `fk_drn_purchase_event_file_drn_purchase_event_id` FOREIGN KEY (`drn_purchase_event_id`) REFERENCES `drn_purchase_event` (`drn_purchase_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Commercial documents

CREATE TABLE `drn_commercial_document` (
    `drn_commercial_document_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `date` date NOT NULL,
    `exempt` decimal(11,2) unsigned NOT NULL,
    `letter` enum('A','B','C') NOT NULL,
    `net105` decimal(11,2) unsigned NOT NULL,
    `net21` decimal(11,2) unsigned NOT NULL,
    `number` int (10) unsigned NOT NULL,
    `othertaxes` decimal(11,2) unsigned NOT NULL,
    `puntodeventa` mediumint unsigned NOT NULL,
    `total` decimal(11,2) unsigned NOT NULL,
    `type` enum('Credit note','Debit note','Invoice') NOT NULL,
    `uuid` binary(16) NOT NULL,
    `vat105` decimal(11,2) unsigned NOT NULL,
    `vat21` decimal(11,2) unsigned NOT NULL,

    PRIMARY KEY (`drn_commercial_document_id`),
    UNIQUE KEY `u_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Invoices balances

CREATE TABLE `drn_invoice_balance` (
    `drn_commercial_document_id` smallint(5) unsigned NOT NULL,

    `balance` decimal(11,2) NOT NULL,

    PRIMARY KEY (`drn_commercial_document_id`),
    CONSTRAINT `fk_drn_invoice_balance_drn_commercial_document_id` FOREIGN KEY (`drn_commercial_document_id`) REFERENCES `drn_commercial_document` (`drn_commercial_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Invoices notes

CREATE TABLE `drn_invoice_note` (
    `drn_invoice_id` smallint(5) unsigned NOT NULL,
    `drn_note_id` smallint(5) unsigned NOT NULL,

    `amount` decimal(11,2) unsigned NOT NULL,

    PRIMARY KEY (`drn_invoice_id`,`drn_note_id`),
    KEY `k_note` (`drn_note_id`),
    CONSTRAINT `fk_drn_invoice_note_drn_invoice_id` FOREIGN KEY (`drn_invoice_id`) REFERENCES `drn_commercial_document` (`drn_commercial_document_id`),
    CONSTRAINT `fk_drn_invoice_note_drn_note_id` FOREIGN KEY (`drn_note_id`) REFERENCES `drn_commercial_document` (`drn_commercial_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases events commercial documents

CREATE TABLE `drn_purchase_event_commercial_document` (
    `drn_commercial_document_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL,

    PRIMARY KEY (`drn_commercial_document_id`,`drn_purchase_event_id`),
    KEY `k_event` (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_event_commercial_document_drn_purchase_event_id` FOREIGN KEY (`drn_purchase_event_id`) REFERENCES `drn_purchase_event` (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_event_commercial_documentdrncommercialdocumentid` FOREIGN KEY (`drn_commercial_document_id`) REFERENCES `drn_commercial_document` (`drn_commercial_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases balances

CREATE TABLE `drn_purchase_balance` (
    `drn_purchase_balance_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `amount` decimal(11,2) unsigned NOT NULL,
    `balance` decimal(11,2) NOT NULL,
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL,
    `uuid` binary(16) NOT NULL,

    PRIMARY KEY (`drn_purchase_balance_id`),
    UNIQUE KEY `u_uuid` (`uuid`),
    KEY `k_event` (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_balance_drn_purchase_event_id` FOREIGN KEY (`drn_purchase_event_id`) REFERENCES `drn_purchase_event` (`drn_purchase_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases categories

CREATE TABLE `drn_purchase_category` (
    `drn_purchase_category_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,

    `description` text NOT NULL,
    `isexpense` tinyint(1) NOT NULL,
    `name` varchar(255) NOT NULL,

    PRIMARY KEY (`drn_purchase_category_id`),
    UNIQUE KEY `u_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases invoices categories

CREATE TABLE `drn_purchase_invoice_category` (
    `drn_commercial_document_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_category_id` tinyint(3) unsigned NOT NULL,

    `amount` decimal(11,2) unsigned NOT NULL,

    PRIMARY KEY (`drn_commercial_document_id`,`drn_purchase_category_id`),
    KEY `k_category` (`drn_purchase_category_id`),
    CONSTRAINT `fk_drn_purchase_commercial_documentcategorydrnpurchasecategoryid` FOREIGN KEY (`drn_purchase_category_id`) REFERENCES `drn_purchase_category` (`drn_purchase_category_id`),
    CONSTRAINT `fk_drn_purchasecommercialdocumentcategorydrncommercialdocumentid` FOREIGN KEY (`drn_commercial_document_id`) REFERENCES `drn_commercial_document` (`drn_commercial_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases invoices notes categories

CREATE TABLE `drn_purchase_invoice_note_category` (
    `drn_invoice_note_drn_invoice_id` smallint(5) unsigned NOT NULL,
    `drn_invoice_note_drn_note_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_category_id` tinyint(3) unsigned NOT NULL,

    `amount` decimal(11,2) unsigned NOT NULL,

    PRIMARY KEY (`drn_invoice_note_drn_invoice_id`,`drn_invoice_note_drn_note_id`,`drn_purchase_category_id`),
    KEY `k_note` (`drn_invoice_note_drn_note_id`),
    KEY `k_category` (`drn_purchase_category_id`),
    CONSTRAINT `drn_purchase_invoice_note_category_drn_invoice_note_drn_note_id` FOREIGN KEY (`drn_invoice_note_drn_note_id`) REFERENCES `drn_invoice_note` (`drn_note_id`),
    CONSTRAINT `drn_purchase_invoice_note_category_drn_invoice_note_drninvoiceid` FOREIGN KEY (`drn_invoice_note_drn_invoice_id`) REFERENCES `drn_invoice_note` (`drn_invoice_id`),
    CONSTRAINT `drn_purchase_invoice_note_category_drn_purchase_category_id` FOREIGN KEY (`drn_purchase_category_id`) REFERENCES `drn_purchase_category` (`drn_purchase_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases balances categories

CREATE TABLE `drn_purchase_balance_category` (
    `drn_purchase_balance_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_category_id` tinyint(3) unsigned NOT NULL,

    `amount` decimal(11,2) unsigned NOT NULL,

    PRIMARY KEY (`drn_purchase_balance_id`,`drn_purchase_category_id`),
    KEY `k_category` (`drn_purchase_category_id`),
    CONSTRAINT `fk_drn_purchase_balance_category_drn_purchase_balance_id` FOREIGN KEY (`drn_purchase_balance_id`) REFERENCES `drn_purchase_balance` (`drn_purchase_balance_id`),
    CONSTRAINT `fk_drn_purchase_balance_category_drn_purchase_category_id` FOREIGN KEY (`drn_purchase_category_id`) REFERENCES `drn_purchase_category` (`drn_purchase_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases payments

CREATE TABLE `drn_purchase_payment` (
    `drn_purchase_payment_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `amount` decimal(11,2) unsigned NOT NULL,
    `drn_purchase_event_id` smallint(5) unsigned NOT NULL,
    `uuid` binary(16) NOT NULL,

    PRIMARY KEY (`drn_purchase_payment_id`),
    UNIQUE KEY `u_uuid` (`uuid`),
    KEY `k_event` (`drn_purchase_event_id`),
    CONSTRAINT `fk_drn_purchase_payment_drn_purchase_event_id` FOREIGN KEY (`drn_purchase_event_id`) REFERENCES `drn_purchase_event` (`drn_purchase_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases invoices payments

CREATE TABLE `drn_purchase_invoice_payment` (
    `drn_commercial_document_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_payment_id` smallint(5) unsigned NOT NULL,

    PRIMARY KEY (`drn_commercial_document_id`,`drn_purchase_payment_id`),
    KEY `k_payment` (`drn_purchase_payment_id`),
    CONSTRAINT `fk_drn_purchase_invoice_payment_drn_commercial_document_id` FOREIGN KEY (`drn_commercial_document_id`) REFERENCES `drn_commercial_document` (`drn_commercial_document_id`),
    CONSTRAINT `fk_drn_purchase_invoice_payment_drn_purchase_payment_id` FOREIGN KEY (`drn_purchase_payment_id`) REFERENCES `drn_purchase_payment` (`drn_purchase_payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Purchases balances payments

CREATE TABLE `drn_purchase_balance_payment` (
    `drn_purchase_balance_id` smallint(5) unsigned NOT NULL,
    `drn_purchase_payment_id` smallint(5) unsigned NOT NULL,

    PRIMARY KEY (`drn_purchase_balance_id`,`drn_purchase_payment_id`),
    KEY `k_payment` (`drn_purchase_payment_id`),
    CONSTRAINT `fk_drn_purchase_balance_payment_drn_purchase_balance_id` FOREIGN KEY (`drn_purchase_balance_id`) REFERENCES `drn_purchase_balance` (`drn_purchase_balance_id`),
    CONSTRAINT `fk_drn_purchase_balance_payment_drn_purchase_payment_id` FOREIGN KEY (`drn_purchase_payment_id`) REFERENCES `drn_purchase_payment` (`drn_purchase_payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
