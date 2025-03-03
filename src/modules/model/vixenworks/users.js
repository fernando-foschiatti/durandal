const bcrypt = require('bcrypt');

const dataAccess = require('../../data-access/data-access');

const profiles = {
    returnWithPermissions: () => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults('SELECT `a`.`name` AS `profile_name`, `c`.`name` AS `permission_name` FROM `vxn_profile` AS `a` JOIN `vxn_profile_permission` AS `b` ON `b`.`vxn_profile_id` = `a`.`vxn_profile_id` JOIN `vxn_permission` AS `c` ON `c`.`vxn_permission_id` = `b`.`vxn_permission_id`')
                .then(rows => resolve(rows.map(row => ({
                    name: row.profile_name,
                    permission: {
                        name: row.permission_name
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    })
};

const returnByPermissionNameSortedByUserName = permissionName => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`name\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\` FROM \`vxn_user\` AS \`a\` JOIN \`vxn_profile_permission\` AS \`b\` ON \`b\`.\`vxn_profile_id\` = \`a\`.\`vxn_profile_id\` JOIN \`vxn_permission\` AS \`c\` ON \`c\`.\`vxn_permission_id\` = \`b\`.\`vxn_permission_id\` WHERE \`c\`.\`name\` = '${permissionName}' ORDER BY \`a\`.\`name\``)
            .then(rows => resolve(rows.map(row => ({
                name: row.name,
                uuid: dataAccess.uuid.toString(row.uuid)
            }))))
            .catch(error => reject(error));
            break;
    }
});

const returnExistsByUuids = uuids => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`vxn_user_id\` FROM \`vxn_user\` AS \`a\` WHERE \`a\`.\`uuid\` IN(${uuids.map(uuid => dataAccess.uuid.returnWhereFunction(uuid)).join(', ')})`)
            .then(rows => resolve(rows.length === uuids.length))
            .catch(error => reject(error));
            break;
    }
});

const returnNameByLogin = login => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`name\` FROM \`vxn_user\` AS \`a\` WHERE \`a\`.\`login\` = ${dataAccess.returnEscaped(login)}`)
            .then(rows => resolve(rows.length ? rows[0].name : null))
            .catch(error => reject(error));
            break;
    }
});

const returnProfileNameByLoginPassword = (login, password) => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            let response;
            dataAccess.returnQueryResults(`SELECT \`a\`.\`password\`, \`b\`.\`name\` FROM \`vxn_user\` AS \`a\` JOIN \`vxn_profile\` AS \`b\` ON \`b\`.\`vxn_profile_id\` = \`a\`.\`vxn_profile_id\` WHERE \`a\`.\`login\` = ${dataAccess.returnEscaped(login)}`)
            .then(rows => {
                if (!rows.length) resolve(null)

                response = rows[0].name;
                return bcrypt.compare(password, rows[0].password.toString());
            })
            .then(result => resolve(result ? response : null))
            .catch(error => reject(error));
            break;
    }
});

module.exports = {
    profiles: profiles,

    returnByPermissionNameSortedByUserName: returnByPermissionNameSortedByUserName,
    returnExistsByUuids: returnExistsByUuids,
    returnNameByLogin: returnNameByLogin,
    returnProfileNameByLoginPassword: returnProfileNameByLoginPassword
};
