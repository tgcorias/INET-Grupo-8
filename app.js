//1- Invocamos a express
const express = require("express")
const app = express()

//2- seteamos urlencode para capturar los datos del formulario
app.use(express.urlencoded({extended:false}))
app.use(express.json())

//3- Invocamos a dotenv
const dotenv = require("dotenv")
dotenv.config({path:"./env/.env"})

//4- El directorio public
app.use("/resources", express.static("public"))
app.use("/resources", express.static(__dirname + "/public"))

//5- Establecemos el motor de plantillas ejs
app.set("view engine","ejs")

//6- Invocamos a bcryptjs
const bcryptjs = require("bcryptjs")

//7- Var. de session
const session = require("express-session")
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}))

//8- Invocamos al modulo de conexion de la base de datos
const connection = require("./database/db")

//9- Estableciendo las rutas
app.get("/", (req,res) => {
    res.render("index")
})
app.get("/login", (req,res) => {
    res.render("login")
})
app.get("/agregar", (req,res) => {
    res.render("agregar")
})

app.listen(3000, (req, res) => {
  console.log('SERVER RUNNING IN http://localhost:3000')
})
