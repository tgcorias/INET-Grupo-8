const mysql = require('mysql');

const conection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'user',
    database: 'registro'
})

conection.connect((err)=>{
    if (err) throw err;
    console.log("Conexión funcionando");
});

conection.query('SELECT * from registro',(err, rows)=>{
    if (err) throw err;
    console.log("Datos:");
    console.log(rows);
});

conection.end();