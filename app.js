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
app.get("/", (req,res) => {
    res.render("index");
})
app.get("/login", (req,res) => {
    res.render("login");
})
app.get("/agregar", (req,res) => {
    res.render("agregar");
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
      }else{
        res.redirect("/");
      }
    })
  }else{
    res.send("<script>alert('Por favor, ingrese un correo y contraseña'); window.location.href = '/login';</script>")
  }
})

app.listen(3000, (req, res) => {
  console.log('SERVER RUNNING IN http://localhost:3000');
})
