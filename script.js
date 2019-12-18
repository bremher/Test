'use strict';

  const VENDOR_ID = 0x04D8
  const PRODUCT_ID = 0x3174
  //const PRODUCT_ID = 0xFA2E
  const CLASS_CODE = 0xFF
  const SUBCLASS_CODE = 0xFF
  const PROTOCOL_CODE = 0xFF
  const SERIAL_NUMBER = '000007'
  //const SERIAL_NUMBER = 'LUSBW1'

  const ack_packet1 = Uint8Array.of(0x80) //CancelRating 
  const ack_packet2 = Uint8Array.of(0x81) //ReadRating
  const ack_packet3 = Uint8Array.of(0x82) //ReadyToRating


document.addEventListener('DOMContentLoaded', event => 
{
  
  let button = document.getElementById('Connect');
  let button_1 = document.getElementById('Toggle');
  let button_2 = document.getElementById('Status');
  let button_3 = document.getElementById('Blink');
  let button_4 = document.getElementById('Close');
  let button_5 = document.getElementById('usbLookup');

  const filters = [{vendorId: VENDOR_ID,  
                    productId: PRODUCT_ID}];

  let device;
  
button_5.addEventListener('click',  async() => 
{
  if (device.serialNumber == null)
      device =  await navigator.usb.requestDevice({ filters: filters })

      if (device.opened == false)
      {    
        await device.open();
        await device.selectConfiguration(1); // Select configuration #1 
        await device.claimInterface(0);  // Request control over interface #0.
      } 

      try 
      {
        //ReadyToRating
         await device.transferOut(1, ack_packet3); // preparaNota
         await device.transferIn(1, 64); // #endpoint 1

         document.getElementById('result').innerHTML = "CMD: "+'AGUARDANDO_NOTA';
         document.getElementById('target').innerHTML = "Retorno:";
      } 

      catch (error) 
      {
        console.log(error);  
        document.getElementById('target').innerHTML = "Retorno: " + error;
      }    
});

///////////////////////////////////////////////////
// Connect Device
///////////////////////////////////////////////////
  button.addEventListener('click', async() => 
  {    
      device = await navigator.usb.requestDevice(
      {
        filters: filters 
      })

    try 
    {
        if (device.serialNumber == SERIAL_NUMBER) 
        {                                
          alert("Fabricante:  " + device.manufacturerName +
                "\nProduto:  " + device.productName +
                "\nNumero de Serie: " + device.serialNumber);
          document.getElementById('serialNumber').innerHTML =
                    "Numero de Serie " + device.serialNumber;
        }  
        await device.open();
        device.selectConfiguration(1); // Select configuration #1 
        device.claimInterface(0);  // Request control over interface #0.      
    }

    catch (error) 
    {
      console.log(error);
      document.getElementById('target').innerHTML = "Retorno: " + error;
      await device.close();  
    }   
  }) // button

///////////////////////////////////////////////////
// CancelRating - CancelaNota
///////////////////////////////////////////////////

button_1.addEventListener('click', async() => 
  { 
    try 
    {
       // CancelRating 
       await device.transferOut(1, ack_packet1); // CancelaNota
       await device.transferIn(1, 64); // #endpoint 1 

       document.getElementById('result').innerHTML ="CMD: "+'NOTA_CANCELADA';
    } 

    catch (error) 
    {
      console.log(error);
      document.getElementById('target').innerHTML = "Retorno: " + error;
      await device.close();  
    }    
  }) // button_1

///////////////////////////////////////////////////
// ReadRating - LeNota
///////////////////////////////////////////////////
  button_2.addEventListener('click', async() => 
  {    
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
      // Waiting for 1 byte from endpoint #1
      let result = await device.transferIn(1, 64); // #endpoint 1
      let decoder = new TextDecoder('utf-8');
      let str = decoder.decode(result.data);  

      let header = parseInt(str.charCodeAt(0).toString(16), 10);
      let cmd = parseInt(str.charCodeAt(1).toString(16), 10);
      let nota = str[2];

      // header 0x81 (0) + command (1)    // debuger
      //document.getElementById('target').innerHTML = 'Received: ' + str;

      if (cmd == 0x04)  // AVANTTEC_NOTA_EM_ESPERA 0x04
      { document.getElementById('result').innerHTML ="CMD: "+'NOTA_EM_ESPERA';
        document.getElementById('nota').innerHTML = "NOTA: "+ nota;
      }
      if (cmd == 0x05)  // AVANTTEC_NOTA_EFETUADA  0x05
      { document.getElementById('result').innerHTML ="CMD: "+'NOTA_EFETUADA';
        document.getElementById('nota').innerHTML = "NOTA: "+ nota;
      }
      if (cmd == 0x06)  // AVANTTEC_CANCELAMENTO_NAO_PERMITIDO 0x06
      { document.getElementById('result').innerHTML ="CMD: "+'CANCELAMENTO_NAO_PERMITIDO';
        document.getElementById('nota').innerHTML = "NOTA: "+ nota;
      }
      if (cmd == 0x07)  // AVANTTEC_NOTA_CANCELADA 0x07
      {   document.getElementById('result').innerHTML ="CMD: "+'NOTA_CANCELADA';
          document.getElementById('nota').innerHTML = "NOTA: "+ nota;
      }
    } 

    catch (error) 
    {
      console.log(error);
      document.getElementById('target').innerHTML = "Retorno: " + error;
      await device.close();  
    }    
  }) // button_2

///////////////////////////////////////////////////
// ReadyToRating - PreparaNota
///////////////////////////////////////////////////
 button_3.addEventListener('click', async() => 
  {    
    try 
    {
      //ReadyToRating
      await device.transferOut(1, ack_packet3); // preparaNota
      let result = await device.transferIn(1, 64); // #endpoint 1

      document.getElementById('result').innerHTML ="CMD: "+'AGUARDANDO_NOTA';
      document.getElementById('nota').innerHTML = "NOTA: ...";            
    } 

    catch (error) 
    {
      console.log(error);  
      document.getElementById('target').innerHTML = "Retorno: " + error;
    }    
  }) // button_3

///////////////////////////////////////////////////
// Close Device
///////////////////////////////////////////////////
 button_4.addEventListener('click', async() => 
  {    
    try 
    {
      // bulk or interrupt data        
      await device.transferOut(1, ack_packet1); // CancelaNota

      let result = await device.transferIn(1, 64); // #endpoint 1
      while (result.data.byteLength != 64);

      await device.close();      
      document.getElementById('serialNumber').innerHTML = "Numero de Serie";
      document.getElementById('result').innerHTML ="CMD:";
      document.getElementById('nota').innerHTML = "NOTA:";    
      document.getElementById('target').innerHTML = "Retorno:";  
    } 
    catch (error) 
    {
      console.log(error);   
      document.getElementById('target').innerHTML = "Retorno: " + error;
    }    
  }) // button_4

 navigator.usb.addEventListener('connect', evt => 
 {
    document.getElementById('status').innerHTML = "CONNECTADO";

    while (true) 
    {
        let result = device.transferIn(1, 64);
        if (result.data && result.data.byteLength === 64) 
        {
          let decoder = new TextDecoder('utf-8');
          let str = decoder.decode(result.data);  
          let nota = str[2];
          document.getElementById('target').innerHTML = "Recebeu: " + nota;
        }
     }    
 });

 navigator.usb.addEventListener('disconnect', evt => 
 {
    document.getElementById('status').innerHTML = "DESCONECTADO";
 });

}) // document