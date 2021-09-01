# OLIMPÍADA INET VIRTUAL

Este repositorio contiene nuestra solución a la problemática de la primer instancia de las olimpíadas virtuales de INET.  

EEST N°3 Ing. Agustín Rocca.

**Grupo 8:** Corias Ticiano, Navarro Julieta, Juan Cruz Stakys.

A continuación se explica el funcionamiento de este proyecto y las diferentes etapas de desarrollo.


# Índice
 **1.** Cómo funciona. 
 
 **2.** Etapas de Desarrollo.
 
 **3.** Web.
 
 **4.** Base de datos.
 
 **5.** Servidor.
 
  **6.** Arduino.


## Cómo funciona

Para empezar, al iniciar sesión, existen dos tipos de usuarios posible:

***-  Administrador:*** Los usuarios con permisos de administrador pueden agregar nuevas sucursales, ver la lista de sucursales registradas, tienen acceso al conteo actual de personas de cada local, y también pueden ver las estadísticas de cada local. 
	
***-  Usuario:*** Los usuarios con permisos de usuario, al iniciar sesión tienen acceso a la página /indexUsuario, donde pueden ver el conteo actual de personas que tiene su local, y pueden sus las estadísticas. Si se desea, se puede simular el acceso de personas. Luego de iniciar sesión, cada usuario tiene acceso a /arduino, donde puede simular el ingreso y egreso de personas al local. 


Por otro lado, el funcionamiento interno del sistema es parecido al protocolo MQTT. Cada cliente tiene su arduino conectado a internet, que envía la información al servidor, y  además, otro dispositivo donde puede acceder a la página web y consultar su conteo de personas. El servidor también puede ser consultado por los usuarios administradores.

![MQTT](https://i.ibb.co/6sVMGQR/Captura-de-pantalla-de-2021-08-23-16-31-21.png)

Lo que busca expresar el gráfico, es la forma en que cada arduino tiene una ID que coincide con la de su local, para que luego pueda ser consultada por el responsable del local y los usuarios admin. 

## Etapas de desarrollo

Las etapas de desarrollo pueden categorizarse de la siguiente manera:
	1. Análisis de la problemática.
	2. Elección de solución.
	3. Diseño visual y lógico de la solución.
	4. Diseño y desarrollo de la base de datos.
	5. Desarrollo web.
	6. Desarrollo del server-side.
	7. Implementación de sistemas embedidos.

## Desarrollo Web

El desarrollo de la página web comienza por el diseño visual. Para eso usamos figma, y basamos todo en el diseño responsive, Mobile First. 
La página utiliza Server-Side Rendering, es decir, el servidor renderiza la mayor parte de la página en lugar del cliente. 
Por otro lado, las tecnologías implementadas son: Git y GitHub, JavaScript, NodeJS, EJS, CSS.
El funcionamiento lógico de la página se encuentra en el archivo [App.js](https://github.com/tgcorias/INET1-Web/blob/main/app.js), las plantillas se encuentran en la carpeta [/views](https://github.com/tgcorias/INET1-Web/tree/main/views), y los estilos en [public/css](https://github.com/tgcorias/INET1-Web/tree/main/public/css). Por otro lado, la conexión con la base de datos inicia en [/database](https://github.com/tgcorias/INET1-Web/tree/main/database).

Las bibliotecas, frameworks y módulos utilizados son:

	- bcryptJs para el cifrado de las contraseñas.
	
	- ChartJs para generar gráficas dinámicas.
	
	- dotenv para las variables de conexión con la base de datos.
	
	- EJS para integrar javascript en las plantillas.
	
	- Express para el back-end.
	
	- mysql package, para hacer queries desde App.js a la base de datos. 
	
## Base de datos

La base de datos está alojada en la misma VPS que la página. 
Está hecha con MySQL([Código SQL](https://github.com/tgcorias/INET1-Web/blob/main/C%C3%B3digo%20SQL%20y%20Arduino/DATABASE.sql)) y cuenta con dos tablas: registro y locales_usuarios. 
La tabla locales_usuarios tiene los campos necesarios que se ingresan por el administrador en /agregar.
Y la tabla registro tiene los campos id_registro, hora, fecha, conteo e id_local, es donde se envía la información sobre el conteo actual de personas de los locales para luego ser consultada.

**Tabla locales_usuarios:**

![tabla locales_usuarios](https://i.ibb.co/zZJhjbz/Captura-de-pantalla-de-2021-08-23-16-12-10.png)


**Tabla registro:**

![tabla registro](https://i.ibb.co/xqL8wjq/Captura-de-pantalla-de-2021-08-23-16-18-17.png)


## Servidor

El servidor está alojado en Google Cloud. Para esto hicimos una instancia de VM (es decir una VPS). Donde configuramos los puertos 8080 para la página y 3306 para la base de datos. En esta VPS creamos la Db, y clonamos el repositorio de GitHub. La página está funcionando en segundo plano en esta VM con NodeJs.


## Arduino

El código de arduino se encuentra en el archivo [Dispositivo.ino](https://github.com/tgcorias/INET1-Web/blob/main/C%C3%B3digo%20SQL%20y%20Arduino/Dispositivo.ino). Al momento de realización no contabamos con sensores de barrera, por lo que simulamos los sensores con dos botones, uno para ingreso y otro para egreso de persona. Además, le agregamos un módulo Ethernet al Arduino Uno, por otro lado, para mejorarlo sería ideal implementar sensores como el hc-sr04. El circuito que usamos es el siguiente:

![enter image description here](https://arduinogetstarted.com/images/tutorial/arduino-multiple-button-wiring-diagram.jpg)

En lugar de usar tres botones, usamos dos. Por otro lado, implementamos las librerías de MySQL y Ethernet, para obtener la información de hora y día actual y enviar información a la base de datos del servidor. 
