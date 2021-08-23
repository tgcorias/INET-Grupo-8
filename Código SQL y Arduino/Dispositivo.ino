#include <MySQL_Connection.h>
#include <MySQL_Cursor.h>
#include <MySQL_Encrypt_Sha1.h>
#include <MySQL_Packet.h>

#include <SPI.h>
#include <ezButton.h>
#include <TimeLib.h>
#include <Ethernet.h>
#include <EthernetUdp.h>


ezButton BOTON_INGRESO(7);  // create ezButton object that attach to pin 7;
ezButton BOTON_EGRESO(2);  // create ezButton object that attach to pin 2;

/* Configuración Tcp/Ip del Ethernet Shield */
byte mac[] = { 0x90, 0xA2, 0xDA, 0x0F, 0x69, 0xAC };

/* ******** NTP Server Settings ******** */
/* (Set to your time server of choice) */
IPAddress timeServer(35, 247, 251, 106);

/* DIRECCION DEL SERVER MYSQL */
IPAddress mysql_server_addr(35, 247, 251, 106);

/* Usuario y contraseña para conectar a la DB */
char user[] = "admin";
char password[] = "Inetadmin123!";


/* Offset de la zona horaria local (UTC-3) con respecto a UTC */
const long timeZoneOffset = -10800L;

/* Syncs to NTP server every 15 seconds for testing,
   set to 1 hour or more to be reasonable */
unsigned int ntpSyncTime = 3600;       

/* ALTER THESE VARIABLES AT YOUR OWN RISK */
// local port to listen for UDP packets
unsigned int localPort = 8888;
// NTP time stamp is in the first 48 bytes of the message
const int NTP_PACKET_SIZE= 48;     
// Buffer to hold incoming and outgoing packets
byte packetBuffer[NTP_PACKET_SIZE]; 
// A UDP instance to let us send and receive packets over UDP
EthernetUDP Udp;                   
// Keeps track of how long ago we updated the NTP server
unsigned long ntpLastUpdate = 0;   
// Check last time clock displayed (Not in Production)
time_t prevDisplay = 0;

/* configuración de MySQL Conector/arduino */
EthernetClient client;
MySQL_Connection conn((Client *)&client);

void setup() {
  Serial.begin(9600);
  BOTON_INGRESO.setDebounceTime(50); // set debounce time to 50 milliseconds
  BOTON_EGRESO.setDebounceTime(50); // set debounce time to 50 milliseconds}

// Ethernet shield and NTP setup
   int i = 0;
   int DHCP = 0;
   DHCP = Ethernet.begin(mac);
   //Try to get dhcp settings 30 times before giving up
   while( DHCP == 0 && i < 30){
     delay(1000);
     DHCP = Ethernet.begin(mac);
     i++;
   }
   if(!DHCP){
    Serial.println("DHCP FAILED");
     for(;;); //Infinite loop because DHCP Failed
   }
  Serial.println("DHCP Success");

   //Try to get the date and time
   int trys=0;
   while(!getTimeAndDate() && trys<10) {
     trys++;
   }
// Se conecta a la db con el usuario y la clave
  if (conn.connect(mysql_server_addr, 3306, user, password)) {
    Serial.println("Conexión exitosa. :)");
    delay(1000);
  }
  else
    Serial.println("Connection failed. :(");
}

// Do not alter this function, it is used by the system
int getTimeAndDate() {
   int flag=0;
   Udp.begin(localPort);
   sendNTPpacket(timeServer);
   delay(1000);
   if (Udp.parsePacket()){
     Udp.read(packetBuffer,NTP_PACKET_SIZE);  // read the packet into the buffer
     unsigned long highWord, lowWord, epoch;
     highWord = word(packetBuffer[40], packetBuffer[41]);
     lowWord = word(packetBuffer[42], packetBuffer[43]); 
     epoch = highWord << 16 | lowWord;
     epoch = epoch - 2208988800 + timeZoneOffset;
     flag=1;
     setTime(epoch);
     ntpLastUpdate = now();
   }
   return flag;
}

// Do not alter this function, it is used by the system
unsigned long sendNTPpacket(IPAddress& address)
{
  memset(packetBuffer, 0, NTP_PACKET_SIZE);
  packetBuffer[0] = 0b11100011;
  packetBuffer[1] = 0;
  packetBuffer[2] = 6;
  packetBuffer[3] = 0xEC;
  packetBuffer[12]  = 49;
  packetBuffer[13]  = 0x4E;
  packetBuffer[14]  = 49;
  packetBuffer[15]  = 52;                 
  Udp.beginPacket(address, 123);
  Udp.write(packetBuffer,NTP_PACKET_SIZE);
  Udp.endPacket();
}

// Clock display of the time and date (Basic)
void clockDisplay(){
  Serial.print(hour());
  printDigits(minute());
  printDigits(second());
  Serial.print(" ");
  Serial.print(day());
  Serial.print(" ");
  Serial.print(month());
  Serial.print(" ");
  Serial.print(year());
  Serial.println();
}

// Utility function for clock display: prints preceding colon and leading 0
void printDigits(int digits){
  Serial.print(":");
  if(digits < 10)
    Serial.print('0');
  Serial.print(digits);
}

void loop() {

//Serial.println("LLEGAMOS AL LOOP!");

// Update the time via NTP server as often as the time you set at the top
    if(now()-ntpLastUpdate > ntpSyncTime) {
      int trys=0;
      while(!getTimeAndDate() && trys<10){
        trys++;
      }
      if(trys<10){
        Serial.println("ntp server update success");
      }
      else{
        Serial.println("ntp server update failed");
      }
    }      
      
  BOTON_INGRESO.loop(); // MUST call the loop() function first
  BOTON_EGRESO.loop(); // MUST call the loop() function first

  String horaLocal, annoLocal, mesLocal, diaLocal, cuando;
  horaLocal = String(hour());
  annoLocal = String(year());
  mesLocal = String(month());
  diaLocal = String(day());
  cuando = " a las " + horaLocal + " del " + diaLocal + "/" + mesLocal + "/" + annoLocal; 
  
  String INSERTAR_1= "INSERT INTO locales_registros.registro(fecha,hora,conteo,id_local) VALUES ("+ annoLocal+ mesLocal+ diaLocal+ ","+ horaLocal+ "0000,1,2)";
  String RESTAR_1 = "INSERT INTO locales_registros.registro(fecha,hora,conteo,id_local) VALUES ("+ annoLocal+ mesLocal+ diaLocal+ ","+ horaLocal+ "0000,-1,2)";  
  
  char INSERTAR_1_CMD[INSERTAR_1.length()+1];
  char RESTAR_1_CMD[RESTAR_1.length()+1];
  
  INSERTAR_1.toCharArray(INSERTAR_1_CMD,INSERTAR_1.length()+1);
  RESTAR_1.toCharArray(RESTAR_1_CMD,RESTAR_1.length()+1);  
  
  if(BOTON_INGRESO.isPressed()){
    Serial.println(INSERTAR_1_CMD);  
    delay(100);      
  // Initiate the query class instance
    MySQL_Cursor *cur_mem = new MySQL_Cursor(&conn);    
    // Execute the query
    cur_mem->execute(INSERTAR_1_CMD);   
  }
  if(BOTON_EGRESO.isPressed()){
    Serial.println(RESTAR_1_CMD);
    delay(100);
      // Initiate the query class instance
    MySQL_Cursor *cur_mem = new MySQL_Cursor(&conn);
    // Execute the query
    cur_mem->execute(RESTAR_1_CMD);
  }

}