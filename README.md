How to install:

1. Run the scripts at build/data/structure/mysql/<your MySQL version> in the following order:
    - database.sql
    - vixenworks.sql
    - project.sql
    - user.sql

2. Run the following script: build/data/seed/mysql.sql

3. Copy all of the files at build/files/seed to res/files/project

4. Check the following configuration files (conf folder):
    - restful-api/conf and front-end/conf: make sure the specified port is not being used (default 55294).
    - data-access.json: if your MySQL instance is running at a non-default port (3306) specify it by using the "Port": 12345 option. Make sure the "Server host" option is correct.

5. Run npm install to install all packages.

How to run:

- From the console run "node src/index.js".
- Browse "https://localhost/durandal" (you will get an "invalid certificate" message wich you can safely ignore).
- You can now login using any of the following user/password combinations:
    . usuarioad/usuarioad.
    . usuariorp/usuariopr.
    . usuariote/usuariote.
