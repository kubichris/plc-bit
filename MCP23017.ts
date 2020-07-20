
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


const enum REG_MCP {
    //% A Port bitképe (Bemenetek)
    PORT_A_BITS = 0x12,
    //% B Port bitképe (Kimenetek)
    PORT_B_BITS = 0x13,

    //% A Port ki vagy bemeneti irányt meghatározó regiszter
    PORT_A_DIRECTION = 0x00, //Alapértelmezetten bemenetek (1111 1111)
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
        pins.i2cWriteNumber(adress, reg * 256 + value, NumberFormat.UInt16BE)
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
        
        PlcBit.writeRegister(adress, REG_MCP.PORT_A_DIRECTION, 0xff) //Inputs
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_DIRECTION, 0x00) // Outputs
        
        PlcBit.writeRegister(adress, REG_MCP.PORT_A_PULLUP, 0xff)
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_PULLUP, 0x00)

        PlcBit.writeRegister(adress, REG_MCP.PORT_A_POL, 0xff) //A bemenetek alacsony aktívak!
        clearAllOuputs
    }

    /**
     * Minden kimenet törlése
     *adress Az eszköz címe, pl.: 0x20
     */
    //% blockId="A PLC:BIT kimeneteinek alaphelyzetbe állítása"
    //% block="A(z) %adress PLC:BIT minden kimenete KI"
    //% weight=88
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
    //% weight=88
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
    //% weight=88
    //% group="Működéshez"
    export function setOutput(adress: ADDRESS, bit: number) {
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
    //% weight=88
    //% group="Működéshez"
    export function clearOutput(adress: ADDRESS, bit: number) {
        let tempMask = 1 << bit
        tempMask = tempMask ^ 0B11111111
        outputABuffer = outputABuffer & tempMask
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }

    /**
     * Egy kimenet váltása
     * @param adress Az eszköz címe, pl.: 0x20
     * @param bit A kimenet sorszáma
    */
    //% blockId="Az eszköz egy kimenetének váltása Ki->Be vagy Be->Ki"
    //% block="A %adress PLC:BIT %bit. kimenet váltás"
    //% bit.min=0 bit.max=7
    //% weight=88
    //% group="Működéshez"
    export function toggleOutput(adress: ADDRESS, bit: number) {
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
    //% group="Működéshez"
    export function updateOutput(adress: ADDRESS) {
        PlcBit.writeRegister(adress, REG_MCP.PORT_B_BITS, outputABuffer)
    }


    export function readInput(adress : ADDRESS, input: number): boolean {
        let port = PlcBit.readRegister(adress, REG_MCP.PORT_A_BITS)
        return port & (1 << input);
    }

    //% block
    export function ReadNotAnd(addr: ADDRESS, reg: REG_PIO, value: number): boolean {
        return (!(readRegister(addr, reg) & value))
    }

    //% block
    export function writeNumberToPort(adress: ADDRESS, port: REG_PIO, value: number) {
        pins.i2cWriteNumber(adress, port + value, NumberFormat.UInt16BE)
    }

    //% block
    export function setPortAsOutput(adress: ADDRESS, port: SET_PORT) {
        pins.i2cWriteNumber(adress, port + 0x00, NumberFormat.UInt16BE)
    }



}
