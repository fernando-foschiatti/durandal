DROP USER IF EXISTS 'vixenworks_durandal_dev_user'@'%';
CREATE USER 'vixenworks_durandal_dev_user'@'%' IDENTIFIED WITH 'mysql_native_password' BY 'vixenworks_durandal_dev_user';
GRANT SELECT, INSERT, UPDATE, DELETE ON `vixenworks_durandal_dev`.* TO 'vixenworks_durandal_dev_user'@'%';
