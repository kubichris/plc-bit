/**
 *  MCP23017-control blocks
     //% name.min= name.max=16
    //% group="LEDs"

 */


enum ADDRESS {                     // address for MCP23017 (configurable by tying pins 15,16,17 on the mcp23017 high or low)
    //% block=0x20
    A20 = 0x20,               // 
    //% block=0x21
    A21 = 0x21,                // 
    //% block=0x22
    A22 = 0x22,                // 
    //% block=0x23
    A23 = 0x23,                // 
    //% block=0x24
    A24 = 0x24,                // 
    //% block=0x25
    A25 = 0x25,                // 
    //% block=0x26
    A26 = 0x26,                // 
    //% block=0x27
    A27 = 0x27                // 
}

const enum BITS {             //
    //% block=00000001
    IOb0 = 0,             // 
    //% block=00000010
    IOb1 = 1,               // 
    //% block=00000100
    IOb2 = 2,               // 
    //% block=00001000
    IOb3 = 3,               // 
    //% block=00010000
    IOb4 = 4,               // 
    //% block=00100000
    IOb5 = 5,               // 
    //% block=01000000
    IOb6 = 6,                // 
    //% block=10000000
    IOb7 = 7,                // 
    //% block=#0
    IO0 = 0,             // 
    //% block=#1
    IO1 = 1,               // 
    //% block=#2
    IO2 = 2,               // 
    //% block=#3
    IO3 = 3,               // 
    //% block=#4
    IO4 = 4,               // 
    //% block=#5
    IO5 = 5,               // 
    //% block=#6
    IO6 = 6,                // 
    //% block=#7
    IO7 = 7                // 
}

const enum REG_MCP {
    //% A Port bitképe (Bemenetek)
    PORT_A_BITS = 0x12,
    //% B Port bitképe (Kimenetek)
    PORT_B_BITS = 0x13,

    //% A Port ki vagy bemeneti irányt meghatározó regiszter
    PORT_A_DIRECTION = 0x00, // Alapértelmezetten bemenetek (1111 1111)
    //% A Port ki vagy bemeneti irányt meghatározó regiszter
    PORT_B_DIRECTION = 0x01, 

    //% A Port polaritása
    PORT_A_POL = 0x02,
    //% B Port polaritása
    PORT_B_POL = 0x03,

    //% A Port interrupt
    PORT_A_INTEN = 0x04,
    //% B Port interrupt
    PORT_B_INTEN = 0x05,

    //% A Port interrupt
    PORT_A_INTCON = 0x08,
    //% B Port interrupt
    PORT_B_INTCON = 0x09,

   //% A Port interrupt
    PORT_A_IOCON = 0x0A,
    //% B Port interrupt
    PORT_B_IOCON = 0x0B,

    //% A Port bemeneti felhúzó ellenállás
    PORT_A_PULLUP = 0x0C,
    //% B Port bemeneti felhúzó ellenállás
    PORT_B_PULLUP = 0x0D
}

//% weight=100 color=#0fbc12 icon= "\uf126"
namespace PLCbit_IO {

/*
    PORT_A - BEMENETEK
    PORT_B - KIMENETEK
*/

let outputABuffer = 0;

let tempHandler : Action
let thereIsHandler = false
let intPin = DigitalPin.P16

    /**
     * Egy regiszter írása
     * @param adress: A PLC:BIT címe
     * @param reg: Regiszter
     * @param value: A regiszterbe írandó decimális érték
     */
    //% blockId=Regiszter írása 
    //%advanced=true 
    //%block="A %adress PLC:BIT %reg regiszterének írása %value értékkel"
    export function writeRegister(adress: ADDRESS, reg: REG_MCP, value: number) {
        pins.i2cWriteNumber(adress, (reg << 8) + value, NumberFormat.UInt16BE)
    }

    /**
     * Egy regiszter olvasása
     * @param adress: A PLC:BIT címe
     * @param reg: Regiszter
     */
    //%blockId=Regiszter olvasása 
    //%advanced=true 
    //%block="A %adress PLC:BIT %reg regiszterének kiolvasása"
    export function readRegister(adress: ADDRESS, reg: REG_MCP): number {
        pins.i2cWriteNumber(adress, reg, NumberFormat.Int8LE);
        return pins.i2cReadNumber(adress, NumberFormat.Int8LE)
    }



    /**
     * A PLC:BIT ki és bemeneteinek inicializálása
     * @param adress A PLC:BIT címe
     */
    //% blockId="initPlcBit"
    //% block="A %adress PLC:BIT inicializálása"
    //% weight=80
    //% group="Induláshoz"
    export function initPlcBit(adress: ADDRESS): void {
        
        writeRegister(adress, REG_MCP.PORT_A_DIRECTION, 0xff) // Inputs
        writeRegister(adress, REG_MCP.PORT_B_DIRECTION, 0x00) // Outputs
        
        writeRegister(adress, REG_MCP.PORT_A_PULLUP, 0xff)   // Inputs + Pullups
        writeRegister(adress, REG_MCP.PORT_B_PULLUP, 0x00)   // Outputs 

        writeRegister(adress, REG_MCP.PORT_A_INTEN, 0xFF)   // INTerrupt on PORT B
    //    writeRegister(adress, REG_MCP.PORT_B_IOCON, 35)   // INTerrupt on PORT B
        

        writeRegister(adress, REG_MCP.PORT_A_POL, 0xff) //A bemenetek alacsony aktívak!
        clearAllOuputs
        
        pins.setEvents(intPin, PinEventType.Edge)
        pins.setPull(intPin, PinPullMode.PullUp)

        //interrupt active low
        control.onEvent(intPin, DAL.MICROBIT_PIN_EVENT_ON_EDGE, function () {
           // if (intPin == 0) {
               tempHandler() 
         //   }   
        })
    }



    /**
     * Minden kimenet törlése
     * @param adress Az eszköz címe, pl.: 0x20
     */
    //% blockId="A PLC:BIT kimeneteinek alaphelyzetbe állítása"
    //% block="A(z) %adress PLC:BIT minden kimenete KI"
    //% weight=70
    //% group="Induláshoz"
    export function clearAllOuputs(adress: ADDRESS) {
        outputABuffer = 0
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Minden kimenet bekapcsolása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="A PLC:BIT kimeneteinek bekapcsolása"
    //% block="A %adress PLC:BIT minden kimenete BE"
    //% weight=60
    //% group="Induláshoz"
    export function setAllOuputs(adress: ADDRESS) {
        outputABuffer = 0xff
        writeRegister(adress, REG_MCP.PORT_B_BITS , outputABuffer)
    }


    /**
     * Egy kimenet bekapcsolása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="A PLC:BIT egy kimenetének bekapcsolása"
    //% block="A %adress PLC:BIT %bit. kimenet BE"
    //% bit.min=0 bit.max=7
    //% weight=50
    //% group="Kimenetek"
    export function setOutput(adress: ADDRESS, bit: BITS) {
        outputABuffer = outputABuffer | (1 << bit)
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Egy kimenet kikapcsolása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="Az eszköz egy kimenetének kikapcsolása"
    //% block="A %adress PLC:BIT %bit. kimenet KI"
    //% bit.min=0 bit.max=7
    //% weight=48
    //% group="Kimenetek"
    export function clearOutput(adress: ADDRESS, bit: BITS) {
        let tempMask = 1 << bit
        tempMask = tempMask ^ 0B11111111
        outputABuffer = outputABuffer & tempMask
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    
  /**
     * Az összes kimenet módosítása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param value A kimenetek értéke
    */
    //% blockId="Az eszköz minden kimenetének írása"
    //% block="A %adress PLC:BIT kimenetei legyen %value"
    //% bit.min=0 bit.max=255
    //% weight=45
    //% group="Kimenetek"
    export function writeAllOutput(adress: ADDRESS,  value: number) {
        outputABuffer = value
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

   /**
     * Egy kimenet írása sorszám alapján (0-7)
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
     * @param value A kimenet értéke
    */
    //% blockId="Az eszköz egy kimenetének írása sorszám alapján"
    //% block="A %adress PLC:BIT %bit. kimenet %value"
    //% bit.min=0 bit.max=7
    //% weight=44
    //% group="Kimenetek"
    export function writeOutputNum(adress: ADDRESS, bit: number, value: boolean) {
        let bitMask = 1 << bit

        outputABuffer = readRegister(adress, REG_MCP.PORT_B_BITS)

        if (value) {
            outputABuffer = outputABuffer | bitMask;
        }
        else 
        {
            bitMask = bitMask ^ 0B11111111    
            outputABuffer = outputABuffer & bitMask;
        }

        
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Egy kimenet írása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
     * @param value A kimenet értéke
    */
    //% blockId="Az eszköz egy kimenetének írása"
    //% block="A %adress PLC:BIT %bit. kimenet %value"
    //% bit.min=0 bit.max=7
    //% weight=43
    //% group="Kimenetek"
    export function writeOutput(adress: ADDRESS, bit: BITS, value: boolean) {
        if (value) 
            setOutput(adress, bit)
        else
            clearOutput(adress, bit)
 }

    /**
     * Egy kimenet váltása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="Az eszköz egy kimenetének váltása Ki->Be vagy Be->Ki"
    //% block="A %adress PLC:BIT %bit. kimenet váltás"
    //% bit.min=0 bit.max=7
    //% weight=46
    //% group="Kimenetek"
    export function toggleOutput(adress: ADDRESS, bit: BITS) {
        let tempMask = 1 << bit
        //tempMask = tempMask ^ 0B11111111
        outputABuffer = outputABuffer ^ tempMask
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * A kimenetek frissítése
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz kimeneteinek frissítése"
    //% block="A %adress PLC:BIT kimeneteinek frissítése"
    //% weight=42
    //% group="Kimenetek"
    export function updateOutput(adress: ADDRESS) {
        writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Összes kimenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz kimeneteinek visszaolvasása"
    //% block="A %adress PLC:BIT kimeneteinek kiolvasása"
    //% weight=40
    //% group="Kimenetek"
    export function readAllOutputs(adress : ADDRESS): number {
        return readRegister(adress, REG_MCP.PORT_B_BITS)
    }

    /**
     * Egy kimenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param output A kimenet sorszáma
     * 
    */
    //% blockId="Az eszköz egy kimenetének visszaolvasása"
    //% block="A %adress PLC:BIT %output kimenetének kiolvasása"
    //% weight=38
    //% group="Kimenetek"
    export function readOutput(adress : ADDRESS, output: BITS): boolean {
        let port = readRegister(adress, REG_MCP.PORT_B_BITS)
        return ((port & (1 << output)) == 1)
    }


    /**
     * A PLC:BIT bemenet válozás esemény
     */
    //% blockId="onInputsChanged"
    //% block="A PLC:BIT egy bemenete megváltozott"
    //% weight=40
    //% group="Bemenetek"
    export function onInputsChanged(handler: Action): void {
        tempHandler = handler
        thereIsHandler = true
    }


    /**
     * Összes bemenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz bemeneteinek kiolvasása"
    //% block="A %adress PLC:BIT bemeneteinek kiolvasása"
    //% weight=30
    //% group="Bemenetek"
    export function readInputAll(adress : ADDRESS): number {
        return (readRegister(adress, REG_MCP.PORT_A_BITS) & 0xff)
    }

    /**
     * Egy bemenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param input A bemenet sorszáma
    */
    //% blockId="Az eszköz egy bemenetének kiolvasása"
    //% block="A %adress PLC:BIT %input bemenetének kiolvasása"
    //% weight=28
    //% group="Bemenetek"
    export function readInput(adress : ADDRESS, input: BITS): boolean {
        let port = readRegister(adress, REG_MCP.PORT_A_BITS)
        return ((port & (1 << input)) != 0)
    }


    /**
     * Egy szám egy bitjének módosítása
     * @param bin A decimális érték
     * @param bit A módosítandó bit
     * @param value Az új érték
    */
    //% blockId="Szám egy bitjének módosítása"
    //% block="%bin szám %bit.bitjének módosítása %value értékre"
    //% weight=27
    //% bit.min=0 bit.max=7
    //% group="Egyéb"
    export function setBit( bin : number, bit: number, value : boolean) : number {
        let num : number = bin
        let bitMask = 1 << bit

        if (value) {
            num = num | bitMask;
        }
        else 
        {
            bitMask = bitMask ^ 0B11111111    
            num = num & bitMask;
        }

        return num
    }


    /**
     * Egy szám binárissá konvertálása
     * @param bin A decimális érték
    */
    //% blockId="Szám binárissá konvertálása"
    //% block="%bin bináris értéke"
    //% weight=27
    //% group="Egyéb"
    export function showBin( bin : number) : string {
        let str : string = ""
        let i : number;
        for (i = 0; i < 8; i++){

            if ((bin & (1<<i)) == 0)
                str = str + "0"
            else 
                str = str + "1"    
        }

        return str
    }

    // block
    function ReadNotAnd(addr: ADDRESS, reg: REG_MCP, value: number): boolean {
        return (!(readRegister(addr, reg) & value))
    }

    // block
    function writeNumberToPort(adress: ADDRESS, port: REG_MCP, value: number) {
        pins.i2cWriteNumber(adress, (port << 8) + value, NumberFormat.UInt16BE)
    }



}
