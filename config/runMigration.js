require("dotenv").config();
const { exec } = require('child_process');

function up(migration_name) {
    if (!migration_name) {
        migration_name = '';
    } else {
        migration_name = ` ${migration_name}`
    }
    const command = `db-migrate up${migration_name} --config config/database.json -e mysql`;
    exec(command, (error, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
            process.exit(0);
        }
        if (error) {
            console.error(error);
            process.exit(0);
        }
        console.log(stdout);
    });
}

function down(migration_count) {
    if (!migration_count) {
        migration_count = '';
    } else {
        migration_count = ` ${migration_count}`
    }
    const command = `db-migrate down -c${migration_count}  --config config/database.json -e mysql`;
    exec(command, (error, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
            process.exit(0);
        }
        if (error) {
            console.error(`Error running runMe.js: ${error}`);
            process.exit(0);
        }
        console.log(stdout);
    });
}

function create(migration_name) {
    exec(`db-migrate create ${migration_name} --config config/database.json -e mysql`, (error, stdout, stderr) => {
        if (stderr) {
            console.error(stderr);
            process.exit(0);
        }
        if (error) {
            console.error(`Error running runMe.js: ${error}`);
            process.exit(0);
        }
        console.log(stdout);
    });
}

function isNumeric(input) {
    const number = parseInt(input);
    return !isNaN(number);
}

if (process.argv[2] == 'up') {
    up(process.argv[3]);
} else if (process.argv[2] == 'down') {
    const migration_count = process.argv[3];
    if (!isNumeric(migration_count)){
        console.error('Invalid parameter is passed');
        console.error('Usage: npm run migrate:down [number_of_migration_to_down]');
        process.exit(0);
    }
    down(parseInt(migration_count));
} else if (process.argv[2] == 'create') {
    let migration_name = '';
    for (let i = 3; i < process.argv.length; i++) {
        migration_name += process.argv[i] + "-"
    }
    migration_name = migration_name.substring(0, migration_name.length - 1);
    if (!migration_name) {
        console.error('migration_name is missing');
        console.error('Usage: npm run migrate:create [migration_name]')
        process.exit(0);
    }
    create(migration_name);
} else {
    console.log('Usage: npm run [migrate:up|migrate:down|migrate:create]');
}