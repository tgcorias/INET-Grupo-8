const dotenv = require("dotenv");
dotenv.config({path:"./env/.env"});

const connection = require("./db");

connection.query('SELECT * from registro',(err, rows)=>{
    if (err) throw err;
    let hora=14
    let suma=0
    for(let i = 0; i<rows.length; i++){
      if(rows[i].conteo>0 && rows[i].hora.slice(0,2) == hora){
        suma += rows[i].conteo;
        console.log(rows[i].hora.slice(0,2))
      }
    }
    console.log(suma);
});
