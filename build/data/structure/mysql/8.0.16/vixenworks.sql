USE `vixenworks_durandal_dev`;

-- Profiles

CREATE TABLE `vxn_profile` (
  `vxn_profile_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,

  `name` varchar(255) NOT NULL,

  PRIMARY KEY (`vxn_profile_id`),
  UNIQUE KEY `u_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Permissions

CREATE TABLE `vxn_permission` (
  `vxn_permission_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

  `name` varchar(255) NOT NULL,

  PRIMARY KEY (`vxn_permission_id`),
  UNIQUE KEY `u_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Profiles permissions

CREATE TABLE `vxn_profile_permission` (
  `vxn_permission_id` smallint(5) unsigned NOT NULL,
  `vxn_profile_id` tinyint(3) unsigned NOT NULL,

  PRIMARY KEY (`vxn_permission_id`,`vxn_profile_id`),
  KEY `k_profile` (`vxn_profile_id`),
  CONSTRAINT `fk_vxn_profile_permission_vxn_permission_id` FOREIGN KEY (`vxn_permission_id`) REFERENCES `vxn_permission` (`vxn_permission_id`),
  CONSTRAINT `fk_vxn_profile_permission_vxn_profile_id` FOREIGN KEY (`vxn_profile_id`) REFERENCES `vxn_profile` (`vxn_profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Users

CREATE TABLE `vxn_user` (
    `vxn_user_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,

    `backgroundcolor` char(6) NOT NULL,
    `initials` char(2) NOT NULL,
    `isforegroundcolorblack` tinyint NOT NULL,
    `login` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `name` varchar(255) NOT NULL,
    `password` binary(60) NOT NULL,
    `uuid` binary(16) NOT NULL,
    `vxn_profile_id` tinyint(3) unsigned NOT NULL,

    PRIMARY KEY (`vxn_user_id`),
    UNIQUE KEY `u_color` (`backgroundcolor`,`isforegroundcolorblack`),
    UNIQUE KEY `u_login` (`login`),
    UNIQUE KEY `u_uuid` (`uuid`),
    KEY `k_profile` (`vxn_profile_id`),
    CONSTRAINT `fk_vxn_user_vxn_profile_id` FOREIGN KEY (`vxn_profile_id`) REFERENCES `vxn_profile` (`vxn_profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
