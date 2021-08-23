-- Crear base de datos

CREATE DATABASE locales_registros;

-- Crear usuario admin

CREATE USER 'admin'@'localhost' identified BY 'Inetadmin123!'

-- Darle todos los permisos al usuario admin en la base de datos creada

GRANT ALL PRIVILEGES ON locales_registros.* TO 'admin'@'localhost';

-- Crea tabla de locales (usuarios)

CREATE TABLE locales_usuarios( id INT(9) NOT NULL AUTO_INCREMENT, nombre_responsable VARCHAR(30) NOT NULL, email VARCHAR(60) NOT NULL, nombre_local VARCHAR(30), direccion VARCHAR(30), ciudad VARCHAR(30), provincia VARCHAR(30), telefono VARCHAR(30), capacidad_maxima INT(4), es_admin BOOLEAN NOT NULL DEFAULT 0, pass_hash VARCHAR(255), PRIMARY KEY (id));

-- Hace que el campo email de la tabla no se repita entre registros

ALTER TABLE locales_usuarios ADD UNIQUE (email);

-- Crea la tabla de registros con fecha y hora

CREATE TABLE registro( id_registro int(100) NOT NULL AUTO_INCREMENT, fecha DATE NOT NULL, hora TIME NOT NULL, conteo INT(1) NOT NULL, id_local INT(9) NOT NULL, PRIMARY KEY (id_registro));

-- Agrega clave foranea en registro para id_local, que se conecte con id de locales_usuarios

ALTER TABLE registro ADD FOREIGN KEY (id_local) REFERENCES locales_usuarios(id);



-- Para configurar el acceso remoto (accediendo como root).

RENAME USER 'admin'@'localhost' TO 'admin'@'%';

GRANT ALL PRIVILEGES on locales_registros.* TO 'admin'@'%';

FLUSH PRIVILEGES;
