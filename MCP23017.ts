
/**
 *  MCP23017-control blocks
     //% name.min= name.max=16
    //% group="LEDs"

 */

/*
    PORT_A - BEMENETEK
    PORT_B - KIMENETEK
*/

let outputABuffer = 0;
let outputBBuffer = 0;

enum SET_PORT {
    //% block=PORT_A
    A = 0,
    //% block=PORT_B
    B = 256
}


enum REG_PIO {
    //% block=PORT_A
    OUTPUTS = 4608,
    //% block=PORT_B
    INPUTS = 4864
}
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

    //% A Port bemeneti felhúzó ellenállás
    PORT_A_PULLUP = 0x0C,
    //% B Port bemeneti felhúzó ellenállás
    PORT_B_PULLUP = 0x0D
}
/**
 * Blocks
 */
//% weight=100 color=#0fbc12 icon=
namespace PlcBit {


    /**
     * Egy regiszter írása
     * adress: A PLC:BIT címe
     * reg: Regiszter
     * value: A regiszterbe írandó decimális érték
     */
    //% blockId=Regiszter írása 
    //%advanced=true 
    //%block="A %adress PLC:BIT %reg regiszterének írása %value értékkel"
    export function writeRegister(adress: ADDRESS, reg: REG_MCP, value: number) {
        pins.i2cWriteNumber(adress, (reg << 8) + value, NumberFormat.UInt16BE)
    }

    /**
     * Egy regiszter olvasása
     * adress: A PLC:BIT címe
     * reg: Regiszter
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
     */
    //% blockId="initPlcBit"
    //% block="A %adress PLC:BIT inicializálása"
    //% weight=80
    //% group="Induláshoz"
    export function initPlcBit(adress: ADDRESS): void {
        
        PlcBit.writeRegister(adress, REG_MCP.PORT_A_DIRECTION, 0xff) // Inputs
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_DIRECTION, 0x00) // Outputs
        
        PlcBit.writeRegister(adress, REG_MCP.PORT_A_PULLUP, 0xff)   // Inputs + Pullups
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_PULLUP, 0x00)   // Outputs 

        PlcBit.writeRegister(adress, REG_MCP.PORT_A_POL, 0xff) //A bemenetek alacsony aktívak!
        clearAllOuputs
    }

    /**
     * Minden kimenet törlése
     *adress Az eszköz címe, pl.: 0x20
     */
    //% blockId="A PLC:BIT kimeneteinek alaphelyzetbe állítása"
    //% block="A(z) %adress PLC:BIT minden kimenete KI"
    //% weight=86
    //% group="Induláshoz"
    export function clearAllOuputs(adress: ADDRESS) {
        outputABuffer = 0
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Minden kimenet bekapcsolása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="A PLC:BIT kimeneteinek bekapcsolása"
    //% block="A %adress PLC:BIT minden kimenete BE"
    //% weight=87
    //% group="Induláshoz"
    export function setAllOuputs(adress: ADDRESS) {
        outputABuffer = 0xff
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS , outputABuffer)
    }


    /**
     * Egy kimenet bekapcsolása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="A PLC:BIT egy kimenetének bekapcsolása"
    //% block="A %adress PLC:BIT %bit. kimenet BE"
    //% bit.min=0 bit.max=7
    //% weight=82
    //% group="Kimenetek"
    export function setOutput(adress: ADDRESS, bit: BITS) {
        outputABuffer = outputABuffer | (1 << bit)
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Egy kimenet kikapcsolása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="Az eszköz egy kimenetének kikapcsolása"
    //% block="A %adress PLC:BIT %bit. kimenet KI"
    //% bit.min=0 bit.max=7
    //% weight=83
    //% group="Kimenetek"
    export function clearOutput(adress: ADDRESS, bit: BITS) {
        let tempMask = 1 << bit
        tempMask = tempMask ^ 0B11111111
        outputABuffer = outputABuffer & tempMask
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
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
    //% weight=84
    //% group="Kimenetek"
    export function writeOutput(adress: ADDRESS, bit: BITS, value: boolean) {
        if (value) 
            PlcBit.setOutput(adress, bit)
        else
            PlcBit.clearOutput(adress, bit)
 }

    /**
     * Egy kimenet váltása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="Az eszköz egy kimenetének váltása Ki->Be vagy Be->Ki"
    //% block="A %adress PLC:BIT %bit. kimenet váltás"
    //% bit.min=0 bit.max=7
    //% weight=85
    //% group="Kimenetek"
    export function toggleOutput(adress: ADDRESS, bit: BITS) {
        let tempMask = 1 << bit
        //tempMask = tempMask ^ 0B11111111
        outputABuffer = outputABuffer ^ tempMask
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * A kimenetek frissítése
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz kimeneteinek frissítése"
    //% block="A %adress PLC:BIT kimeneteinek frissítése"
    //% bit.min=0 bit.max=7
    //% weight=88
    //% group="Kimenetek"
    export function updateOutput(adress: ADDRESS) {
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }



    /**
     * Összes kimenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz kimeneteinek visszaolvasása"
    //% block="A %adress PLC:BIT kimeneteinek kiolvasása"
    //% bit.min=0 bit.max=7
    //% weight=88
    //% group="Kimenetek"
    export function readAllOutputs(adress : ADDRESS): number {
        return PlcBit.readRegister(adress, REG_MCP.PORT_B_BITS)
    }

    /**
     * Egy kimenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz egy kimenetének visszaolvasása"
    //% block="A %adress PLC:BIT %output kimenetének kiolvasása"
    //% bit.min=0 bit.max=7
    //% weight=88
    //% group="Kimenetek"
    export function readOutput(adress : ADDRESS, output: BITS): boolean {
        let port = PlcBit.readRegister(adress, REG_MCP.PORT_B_BITS)
        return ((port & (1 << output)) == 1)
    }


    /**
     * Összes bemenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz bemeneteinek kiolvasása"
    //% block="A %adress PLC:BIT bemeneteinek kiolvasása"
    //% bit.min=0 bit.max=7
    //% weight=91
    //% group="Bemenetek"
    export function readInputAll(adress : ADDRESS): number {
        return PlcBit.readRegister(adress, REG_MCP.PORT_A_BITS)
    }

    /**
     * Egy bemenet olvasása
     * @param adress Az eszköz címe, pl.: 0x20
    */
    //% blockId="Az eszköz egy bemenetének kiolvasása"
    //% block="A %adress PLC:BIT %input bemenetének kiolvasása"
    //% bit.min=0 bit.max=7
    //% weight=92
    //% group="Bemenetek"
    export function readInput(adress : ADDRESS, input: BITS): boolean {
        let port = PlcBit.readRegister(adress, REG_MCP.PORT_A_BITS)
        return ((port & (1 << input)) == 1)
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
