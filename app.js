//1- Invocamos a express
const express = require("express");
const app = express();

//2- seteamos urlencode para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//3- Invocamos a dotenv
const dotenv = require("dotenv");
dotenv.config({path:"./env/.env"});

//4- El directorio public
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));

//5- Establecemos el motor de plantillas ejs
app.set("view engine","ejs");

//6- Invocamos a bcryptjs
const bcryptjs = require("bcryptjs");

//7- Var. de session
const session = require("express-session");
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}))

//8- Invocamos al modulo de conexion de la base de datos
const connection = require("./database/db");

//9- Estableciendo las rutas
app.get("/login", (req,res) => {
    res.render("login");
})

app.get("/agregar", (req,res) => {
  if(req.session.es_admin){
    res.render("agregar");
  }else{
    res.send("No tiene acceso a esta página")
  }
})

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

app.get("/monitorAdmin", (req,res) => {
  if(req.session.es_admin){
    connection.query('SELECT * from registro', async (err, rows)=>{
        if (err) throw err;
        app.locals.informacion = rows;
      });
    res.render("monitorAdmin");
  }else{
    res.send("No autorizade");
  }
})

app.get("/estadisticas", (req,res) => {
  if(req.session.loggedin){
    if(req.session.es_admin){
      res.render("indexAdmin",{
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

//10- Registro
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

//11- Autenticacion
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

//12- Autenticacion para el resto de las paginas
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

//13- Cargar página de contador según usuario para el admin
app.post("/cargarContadorAdmin",async(req,res)=>{
  let idLocal = parseInt(Object.keys(req.body));
  connection.query('SELECT * from registro WHERE id_local = ?', [idLocal], async (err, rows)=>{
      if (err) throw err;
      let suma = 0;
      for(let i=0; i<rows.length; i++){
        suma += rows[i].conteo;
      }
      app.locals.suma = suma;
      connection.query("SELECT capacidad_maxima FROM locales_usuarios WHERE id = ?", [idLocal], async (err,rows)=>{
        if (err) throw err;
        app.locals.capacidad_maxima = rows[0].capacidad_maxima;
      });
  });
  res.redirect("monitorAdmin");
});

//14- Cargar página de estadísticas para el usuario según fecha
app.post("/cargarEstadistica",(req,res)=>{
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
  res.redirect("estadisticas")
});

app.listen(3000, (req, res) => {
  console.log('SERVER RUNNING IN http://localhost:3000');
})
