// Invocamos al framework express
const express = require("express");
const app = express();




// Seteamos urlencode para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());




// Invocamos a dotenv
const dotenv = require("dotenv");
dotenv.config({path:"./env/.env"});




// El directorio public
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));



// Establecemos el motor de plantillas .ejs
app.set("view engine","ejs");




// Invocamos a bcryptjs para cifrar las contraseñas
const bcryptjs = require("bcryptjs");



// Declaramos la variable de session
const session = require("express-session");
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}))




// Invocamos al modulo de conexion de la base de datos
const connection = require("./database/db");




// ---- Estableciendo las rutas ----



// Dirigimos a /login antes de renderizar las plantillas
app.get("/login", (req,res) => {
    res.render("login");
})



// Establecemos que /agregar sólo pueda ser renderizada si la sesión es admin.
app.get("/agregar", (req,res) => {

  if(req.session.es_admin){

    res.render("agregar");

  }else{

    res.send("No autorizade")

  }
})



// Establecemos que /locales sólo pueda ser renderizada si la sesión es admin.

app.get("/locales", (req,res) => {

  if(req.session.es_admin){

        connection.query("SELECT nombre_local, id FROM locales_usuarios WHERE id <> 1",(err, rows)=>{
        app.locals.listaLocales = rows;

    });
    res.render("locales");

  }else{

    res.send("No autorizade");

  }
})



// Establecemos que /monitorAdmin sólo pueda ser renderizada si la sesión es admin.
// Si es admin, hace una consulta a la Db por el registro con la idLocal solicitada.
// Después, se declara una variable suma que tiene el conteo de personas para enviarla al contador en ejs.

app.get("/monitorAdmin", (req,res) => {

  if(req.session.es_admin){

    connection.query('SELECT * FROM registro WHERE id_local = ?', [idLocal], async (err, rows)=>{

        if (err) throw err;
        let suma = 0;
        for(let i=0; i<rows.length; i++){

          suma += rows[i].conteo;

        }
        app.locals.suma = suma;
      });

      connection.query('SELECT * from registro', async (err, rows)=>{
        if (err) throw err;
        app.locals.informacion = rows;

      });
    res.render("monitorAdmin");

  }else{

    res.send("No autorizade");

  }
})



// Se establece que /estadisticas pueda ser accesible para admin y usuario
// siempre y cuando hayan iniciado sesión, sino, renderiza /login

app.get("/estadisticas", (req,res) => {

  if(req.session.loggedin){

    if(req.session.es_admin){

      res.render("estadisticas",{
        login: true,

      });

    }else{

        res.render("estadisticas",{
        login: true,

      });
    }
  }else{

    res.render("login")

  }
})

// Renderización de /arduino para simular el dispositivo solamente si el usuario NO es admin.
app.get("/arduino",(req,res)=>{
  if(req.session.loggedin){
    if(req.session.es_admin){
      res.redirect("/")
    }else{
      connection.query('SELECT * FROM registro WHERE id_local = ?', [req.session.id_usuario], async (err, rows)=>{
      });
      res.render("arduino");
    }
  }else{
    req.session.destroy();
    res.redirect("login")
  }

});

// Funciones para insertar en la tabla registro dependiendo de la opción que se seleccione.

app.post("/arduino",(req,res)=>{
  let currentDate = new Date();
  let cDay = currentDate.getDate().toString();
  let cMonth = ('0'+(currentDate.getMonth()+1)).slice(-2).toString();
  let cYear = currentDate.getFullYear().toString();
  let cHour = currentDate.getHours().toString();



  let clickeado = (String(Object.keys(req.body)));

  if(clickeado == "mas1"){
    connection.query("INSERT INTO registro(fecha,hora,conteo,id_local) VALUES (" + cYear + "" + cMonth + "" + cDay + "," + cHour + "0000,1," + req.session.id_usuario + ")", async(error,results)=>{
      if(error){console.log(error)}
    });
  }
  if(clickeado == "menos1"){
    connection.query("INSERT INTO registro(fecha,hora,conteo,id_local) VALUES (" + cYear + "" + cMonth + "" + cDay + "," + cHour + "0000,-1," + req.session.id_usuario + ")", async(error,results)=>{
      if(error){console.log(error)}
    });
  }
  res.render("arduino");
});


// Se establece una función asíncrona que se ejecuta si hay un submit en /agregar
// Entonces, se extraen los datos de cada input y se almacenan en constantes
// que después, se almacenan en la tabla locales_usuarios de la Db

app.post("/agregar", async (req, res)=>{

  const nombre_local = req.body.nombre_local;
  const nombre_responsable = req.body.nombre_responsable;
  const direccion = req.body.direccion;
  const ciudad = req.body.ciudad;
  const provincia = req.body.provincia;
  const email = req.body.email;
  const telefono = req.body.telefono;
  const capacidad_maxima = req.body.capacidad_maxima;
  const password = req.body.password;
  let passwordHash = await bcryptjs.hash(password, 8);


  connection.query("INSERT INTO locales_usuarios SET ?", {
    nombre_responsable:nombre_responsable,
    email:email,
    nombre_local:nombre_local,
    direccion:direccion,
    ciudad:ciudad,
    provincia:provincia,
    telefono:telefono,
    capacidad_maxima:capacidad_maxima,
    pass_hash:passwordHash,

  }, async(error,results)=>{

    if(error){

      console.log(error);

    }
    else {

      res.render("agregar");

    }
  })
})






// Autenticación de la sesión, se toman los datos de los inputs en /login y se comparan
// con los que están en la base de datos, si no coincidem se envía un alert y se
// destruye la sesión, redireccionando a /login
// Si la sesión es correcta, se extraen los datos de la Db de ese usuario.
app.post("/auth", async(req,res)=>{

  const correo = req.body.email;
  const pass = req.body.password;
  let passwordHash = await bcryptjs.hash(pass, 8);

  if(correo && pass){

      connection.query("SELECT * FROM locales_usuarios WHERE email = ?", [correo], async(error, results)=>{

      if(results.length == 0 || !(await bcryptjs.compare(pass,results[0].pass_hash))){

        res.send("<script>alert('Correo y/o contraseña incorrecto/s'); window.location.href = '/login';</script>")
        req.session.destroy();

      }else{

        let currentDate = new Date();
        let cDay = currentDate.getDate();
        let cMonth = currentDate.getMonth() + 1;
        let cYear = currentDate.getFullYear();
        let fechaHoy = cYear + "-" + cMonth + "-" + cDay;
        req.session.loggedin = true;
        req.session.id_usuario = results[0].id;
        req.session.nombre_responsable = results[0].nombre_responsable;
        req.session.email = results[0].email;
        req.session.nombre_local = results[0].nombre_local;
        req.sessiondireccion = results[0].direccion;
        req.session.ciudad = results[0].ciudad;
        req.session.provincia = results[0].provincia;
        req.session.telefono = results[0].telefono;
        req.session.capacidad_maxima = results[0].capacidad_maxima;
        req.session.es_admin = results[0].es_admin;
        req.session.fechaSolicitada = fechaHoy;
        res.redirect("/");

      }
    })
  }else{

    res.send("<script>alert('Por favor, ingrese un correo y contraseña'); window.location.href = '/login';</script>")
    req.session.destroy();

  }
})





// Se establece una página principal que es diferente para el admin y para el usuario.
// Se consulta a la Db por nombre_local y capacidad_maxima para enviarlo a .ejs
app.get("/", (req, res)=>{

  if(req.session.loggedin){

    if(req.session.es_admin){

      res.render("indexAdmin",{
        login: true,

      });
    }else{

      connection.query('SELECT * FROM registro WHERE id_local = ?', [req.session.id_usuario], async (err, rows)=>{

          if (err) throw err;
          let suma = 0;
          for(let i=0; i<rows.length; i++){

            suma += rows[i].conteo;

          }

          app.locals.suma = suma;
          connection.query("SELECT * FROM locales_usuarios WHERE id = ?", [req.session.id_usuario], async (err,rows)=>{

          if (err) throw err;

          app.locals.capacidad_maxima = rows[0].capacidad_maxima;
          app.locals.nombre_local = rows[0].nombre_local;

        });

      });

        res.render("indexUsuario.ejs",{
        login: true,

      });
    }
  }else{

    res.render("login")

  }
})


// Declaración de idLocal en global scope para que el admin pueda
// hacer consultas a la Db en diferentes funciones.
var idLocal;




// Cargar página de contador según el local seleccionado por el admin
// Se le da valor a idLocal dependiendo de qué button toque el admin y se convierte a entero.
// Luego se consulta a la Db por nombre_local y capacidad_maxima para enviarlo a .ejs
app.post("/cargarContadorAdmin",async(req,res)=>{

        idLocal = parseInt(Object.keys(req.body));
        connection.query('SELECT * from registro WHERE id_local = ?', [idLocal], async (err, rows)=>{

          if (err) throw err;
          let suma = 0;

         for(let i=0; i<rows.length; i++){
          suma += rows[i].conteo;

      }

      app.locals.suma = suma;

      connection.query("SELECT * FROM locales_usuarios WHERE id = ?", [idLocal], async (err,rows)=>{

        if (err) throw err;

        app.locals.capacidad_maxima = rows[0].capacidad_maxima;
        app.locals.nombre_local = rows[0].nombre_local;

      });

  });

  res.redirect("monitorAdmin");

});






// Se renderiza la página estadísticas y se carga el gráfico ChartJs dependiendo de la fecha
// solicitada por el usuario o admin. Se declara la variable fechaSolicitada con los datos del input.
// Después, se hace una consulta a la tabla registros con la id de la sesión (o idLocal para el admin),
// la fecha, y conteo si es mayor a 0.
app.post("/cargarEstadistica",(req,res)=>{

  if(!req.session.es_admin){

    req.session.fechaSolicitada = req.body.fecha;
    app.locals.fechaSolicitada = req.session.fechaSolicitada;

    connection.query("SELECT * from registro WHERE id_local = " + req.session.id_usuario + " AND fecha = '" + req.session.fechaSolicitada + "' AND conteo > 0", async (err, rows)=>{


      if (err) throw err;
      let clientesSegunHora = new Array(24).fill(0);

      for(let i=0; i<rows.length;i++){

        clientesSegunHora[parseInt(rows[i].hora.slice(0,2))] += rows[i].conteo;

        }
        app.locals.clientesSegunHora = clientesSegunHora;

    });

  }else{

    req.session.fechaSolicitada = req.body.fecha;
    app.locals.fechaSolicitada = req.session.fechaSolicitada;

    connection.query("SELECT * from registro WHERE id_local = " + idLocal + " AND fecha = '" + req.session.fechaSolicitada + "' AND conteo > 0", async (err, rows)=>{

      if (err) throw err;
      let clientesSegunHora = new Array(24).fill(0);


      for(let i=0; i<rows.length;i++){

        clientesSegunHora[parseInt(rows[i].hora.slice(0,2))] += rows[i].conteo;

        }

        app.locals.clientesSegunHora = clientesSegunHora;
  });

}

  res.redirect("estadisticas");

});

app.listen(8080, (req, res) => {
  console.log('Servidor funcionando!');
});
