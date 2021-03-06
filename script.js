// https://github.com/login
// https://bremher.github.io/Test/
// Password: 40Br@gitHUB
// 08/01/20  14:40

// ###################################################################
// # PROJECT: WinUSBkeyboard Opniômetro  
// # Project Created 01/12/2019 09:38:01 by Cariyl Kirsten
// # This file generated 29/10/2015 11:04:19
// # Product Name: Avanttec WinUSBkeyboard Opniômetro
// #        GUID : {58d07210-27c1-11dd-bd0b-0800200c9a66}
// #  Manufature : Avanttec Tecnologia
// #  Filename: script.js
// ###################################################################

// DIRECTIVE DEFINE ************************************************** 
'use strict'; // all code in the script will execute in strict mode


// DEFINES - CONSTANTS - VARIABLES ***********************************
  const VENDOR_ID  = 0x04D8
  const PRODUCT_ID = 0x3174
  const CLASS_CODE = 0xFF
  const SUBCLASS_CODE = 0xFF
  const PROTOCOL_CODE = 0xFF
  const SERIAL_NUMBER = '000007'

  const ack_packet1 = Uint8Array.of(0x80); //CancelRating 
  const ack_packet2 = Uint8Array.of(0x81); //ReadRating
  const ack_packet3 = Uint8Array.of(0x82); //ReadyToRating

  const filters = [{vendorId: VENDOR_ID,  
                    productId: PRODUCT_ID}];

  //serialNumber: SERIAL_NUMBER

  let device;                   //  
  let statusConexion = false;   // dispositivo conectado ?
  let inRating = false;         // Aguardando nota ?
  let bRating = false;          // adiciona no relatório ?
  
// DIRECTIVE MACRO ************************************************** 
// repeats a function at every time-interval
  var myVar = window.setInterval(dateTimeNow, 1000);

// ################################################
// ##     F U N C T I O N S                      ##
// ################################################

///////////////////////////////////////////////////
// async function find Device
///////////////////////////////////////////////////
async function findDevices()
{
    try
    {
       await navigator.usb.getDevices()
        .then(devices => 
        {
            console.log("Total de dispositivos: " + devices.length);
            devices.forEach( async (device) => 
            {
                  console.log("\nFabricante: " + dev.manufacturerName +
                              "\nProduto:  " + dev.productName +
                              "\nNúmero de Serie: " + dev.serialNumber);

                  if (device.serialNumber == SERIAL_NUMBER) 
                  {                                
                      //device = await navigator.usb.requestDevice({ filters: filters});

                      await device.open();
                      await device.selectConfiguration(1); // Select configuration #1 
                      await device.claimInterface(0);  // Request control over interface #0. 
                      if (device.opened == true)
                      {
                          document.getElementById('status').innerHTML = "CONNECTADO";
                          document.getElementById('target').innerHTML = "Retorno: ";
                          statusConexion = true;
        
                          if (readDevice() == true) // AVANTTEC_NOTA_EM_ESPERA 0x04
                              readyToRating();
                          return true;  
                      }
                  }                 
            });
        });

        return false;
    }

    catch (error) 
    {
        console.log(error);
        document.getElementById('target').innerHTML = "Retorno: " + error;

        if (statusConexion == true)
            closeDevice();
        return false;     
    }
}

///////////////////////////////////////////////////
// async function Close Device
///////////////////////////////////////////////////
async function closeDevice()
{
    if (statusConexion == false) // fail if not connected ...
        return false;

    try 
    {
      // bulk or interrupt data        
      await device.transferOut(1, ack_packet1); // CancelaNota

      let result = await device.transferIn(1, 64); // #endpoint 1
      while (result.data.byteLength != 64);
      await device.close();        

      statusConexion = false;
      document.getElementById('serialNumber').innerHTML = "Número de Serie:";
      document.getElementById('result').innerHTML ="CMD:";
      document.getElementById('nota').innerHTML = "NOTA:";
      document.getElementById('target').innerHTML = "Retorno:";
      return true;
    } 
    catch (error) 
    {
      document.getElementById('target').innerHTML = "Retorno: " + error;
      statusConexion = false;    
      return false;
    }    
}

///////////////////////////////////////////////////
// Connect Device
///////////////////////////////////////////////////
async function connectDevice()
{
    if (statusConexion == true) // fail if connected ...
       return false;

    try 
    {        
        device = await navigator.usb.requestDevice({ filters: filters});

        if (device.serialNumber == SERIAL_NUMBER) 
        {                                
          alert("Fabricante: " + device.manufacturerName +
                "\nProduto:  " + device.productName +
                "\nNúmero de Serie: " + device.serialNumber);
          document.getElementById('serialNumber').innerHTML =
                    "Número de Serie: " + device.serialNumber;
        }  

        await device.open();
        await device.selectConfiguration(1); // Select configuration #1 
        await device.claimInterface(0);  // Request control over interface #0. 
        if (device.opened == true)
        {
            document.getElementById('status').innerHTML = "CONNECTADO";
            document.getElementById('target').innerHTML = "Retorno: ";
            statusConexion = true;
        
            if (readDevice() == true) // AVANTTEC_NOTA_EM_ESPERA 0x04
                readyToRating();
            return true;  
        }
        return false;     
    }

    catch (error) 
    {
        console.log(error);
        document.getElementById('target').innerHTML = "Retorno: " + error;

        if (statusConexion == true)
            closeDevice();
        return false;     
    }
}
///////////////////////////////////////////////////
// Read Device
///////////////////////////////////////////////////
async function readDevice()
{
  let status = false;

    if (statusConexion == false) // fail if not connected ...
       return false;

    try 
    {
      //ReadRating from endpoint #1
      await device.transferOut(1, ack_packet2); // LeNota

//      await device.controlTransferOut({
//              requestType: 'vendor',  // standard - class - vendor
//              recipient: 'endpoint',  // device - interface - endpoint - other
//              request: 0x03,          // enable channels
//              value: 0x03,            // 0000 0011 (channels 1, and 2)
//              index: 0x01   });       // The recipient number

      //Get push scancode from button
      // Waiting for 64 bytes from endpoint #1
      let result = await device.transferIn(1, 64); // #endpoint 1
      let decoder = new TextDecoder('utf-8');
      let str = decoder.decode(result.data);  

      let header = parseInt(str.charCodeAt(0).toString(16), 10);
      let cmd = parseInt(str.charCodeAt(1).toString(16), 10);
      let nota = str[2];

      document.getElementById('target').innerHTML = "Retorno: ";

      // header 0x81 (0) + command (1)    // debuger
      //document.getElementById('target').innerHTML = 'Received: ' + str;

      if (cmd == 0x04)  // AVANTTEC_NOTA_EM_ESPERA 0x04
      {  document.getElementById('result').innerHTML ="CMD: "+'NOTA_EM_ESPERA';
         document.getElementById('nota').innerHTML = "NOTA: ";
         bRating = true;    // relatorio
         inRating = true;   // aguarda nota 
      }
      if (cmd == 0x05)  // AVANTTEC_NOTA_EFETUADA  0x05
      {  document.getElementById('result').innerHTML ="CMD: "+'NOTA_EFETUADA';
         document.getElementById('nota').innerHTML = "NOTA: "+ nota;
         document.getElementById('status').innerHTML = "NOTA EFETUADA";
         inRating = false;
         Relat();            
      }
      if (cmd == 0x06)  // AVANTTEC_CANCELAMENTO_NAO_PERMITIDO 0x06
      {  document.getElementById('result').innerHTML ="CMD: "+'CANCELAMENTO_NAO_PERMITIDO';
         document.getElementById('nota').innerHTML = "NOTA: "+ nota;
         document.getElementById('status').innerHTML = "CANCELAMENTO NAO PERMITIDO";
         inRating = false;
      }
      if (cmd == 0x07)  // AVANTTEC_NOTA_CANCELADA 0x07
      {  document.getElementById('result').innerHTML ="CMD: "+'NOTA_CANCELADA';
         document.getElementById('nota').innerHTML = "NOTA: "+ nota;
         document.getElementById('status').innerHTML = "NOTA CANCELADA";
         inRating = false;
         Relat();
      }
      return true;
    } 

    catch (error) 
    {
      console.log(error);
      document.getElementById('target').innerHTML = "Retorno: " + error;
      closeDevice();
      return false;
    }   
    
}
///////////////////////////////////////////////////
// Cancel Rating - Cancela nota
///////////////////////////////////////////////////
async function cancelRating()
{
    if (statusConexion == false) // fail if not connected ...
       return false;

    try 
    {
       // CancelRating 
       await device.transferOut(1, ack_packet1); // CancelaNota
       await device.transferIn(1, 64); // #endpoint 1 

       document.getElementById('result').innerHTML ="CMD: "+'NOTA_CANCELADA';
       document.getElementById('target').innerHTML = "Retorno: ";
       return true;
    } 

    catch (error) 
    {
      console.log(error);
      document.getElementById('target').innerHTML = "Retorno: " + error;
      closeDevice();
      return false;
    }    
}
///////////////////////////////////////////////////
// Ready To Rating - Prepara nota
///////////////////////////////////////////////////
async function readyToRating()
{
    if (statusConexion == false) // fail if not connected ...
        return false;

    try 
    {      
      //ReadyToRating
      await device.transferOut(1, ack_packet3); // preparaNota
      let result = await device.transferIn(1, 64); // #endpoint 1
      
      document.getElementById('status').innerHTML = "AGUARDANDO NOTA"; 
      document.getElementById('result').innerHTML ="CMD: "+'AGUARDANDO_NOTA';
      document.getElementById('nota').innerHTML = "NOTA: ...";       
      document.getElementById('target').innerHTML = "Retorno: ";   
      bRating = true;   // relatorio
      inRating = true;  // aguadando nota
      return true;
    } 

    catch (error) 
    {
      console.log(error);  
      document.getElementById('target').innerHTML = "Retorno: " + error;
      closeDevice();
      return false;
    }    
}
///////////////////////////////////////////////////
// dateTimeNow - atualiza data do sistema
///////////////////////////////////////////////////
function dateTimeNow() 
{
  var d = new Date();
  var status = document.getElementById('status').textContent;
  
    if (statusConexion == true) // if connected ...
    {        
          if (inRating == true) // if (status == 'AGUARDANDO NOTA')
              readDevice();
    }

    document.getElementById("DataNow").innerHTML = d.toLocaleTimeString();
}
///////////////////////////////////////////////////
// Relat - Registra nota de avaliação
///////////////////////////////////////////////////
function Relat() 
{
  if (bRating == true)
  {
    let date = new Date();
    let options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    var captDate = date.toLocaleTimeString('pt-BR', options)    

    var node = document.createElement("LI");
    var nota = document.getElementById('nota').textContent + " <=> " + captDate;
    var textnode = document.createTextNode(nota);
    node.appendChild(textnode);
    document.getElementById("List").appendChild(node);
    bRating = false;
  }  
}  
// ################################################
//  ##      E v e n t L i s t e n e r           ##
// ################################################
document.addEventListener('DOMContentLoaded', event => 
{  
  let button_1 = document.getElementById('Connect');
  let button_2 = document.getElementById('Toggle');
  let button_3 = document.getElementById('Status');
  let button_4 = document.getElementById('Blink');
  let button_5 = document.getElementById('Close');
  let button_6 = document.getElementById('usbLookup');

///////////////////////////////////////////////////
// Get serial Number
///////////////////////////////////////////////////   
button_6.addEventListener('click',  async() => 
{
   if (statusConexion == false)
      return;

   document.getElementById('serialNumber').innerHTML = "Numero de Serie: " + device.serialNumber;
   document.getElementById('result').innerHTML ="CMD:";
   document.getElementById('nota').innerHTML = "NOTA:";
   document.getElementById('target').innerHTML = "Retorno:";
})

///////////////////////////////////////////////////
// Connect Device
///////////////////////////////////////////////////
button_1.addEventListener('click', async() => 
{    
    connectDevice();  // expressioon boolean
}) // button- ConnectDevice

///////////////////////////////////////////////////
// Close Device
///////////////////////////////////////////////////
button_5.addEventListener('click', async() => 
{    
   closeDevice();
}) // button_4 - CloseDevice

///////////////////////////////////////////////////
// CancelRating - CancelaNota
///////////////////////////////////////////////////
button_2.addEventListener('click', async() => 
{ 
   cancelRating()
}) // button_1 - CancelaNota

///////////////////////////////////////////////////
// ReadRating - LeNota
///////////////////////////////////////////////////
button_3.addEventListener('click', async() => 
{    
   readDevice();
}) // button_2 - LeNota

///////////////////////////////////////////////////
// ReadyToRating - PreparaNota
///////////////////////////////////////////////////
button_4.addEventListener('click', async() => 
{    
   readyToRating();
}) // button_3 - PreparaNota

// ################################################
//  ##           E V E N T S                    ##
// ################################################
navigator.usb.addEventListener('connect', event => 
{
const policy = document.featurePolicy;
const can_use_usb = policy.allowsFeature('usb'); // document can use WebUSB.

  if (can_use_usb)
    document.getElementById("can-webusb").innerHTML = "\n Experimental Technology - WebUSB";

  document.getElementById('status').innerHTML = "DETECTADO"; 

  findDevices();
    
})

navigator.usb.addEventListener('disconnect', evt => 
{
    document.getElementById('status').innerHTML = "DESCONECTADO";
    if (statusConexion == true)
        closeDevice();
})

}); // document

// ###################################################################################
// END END END END END END END END END END END END END END END END END END END END END 
// ###################################################################################