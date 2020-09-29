  
/**
 * PCA9685
 */
//% weight=100 color=#0fbc11 icon=""
namespace PLCbit_Valve {
    let _DEBUG: boolean = false
  
    const debug = (msg: string) => {
        if (_DEBUG === true) {
            serial.writeLine(msg)
        }
    }

    const MIN_CHIP_ADDRESS = 0x40
    const MAX_CHIP_ADDRESS = MIN_CHIP_ADDRESS + 62
    const chipResolution = 4096;
    const PrescaleReg = 0xFE //the prescale register address
    const modeRegister1 = 0x00 // MODE1
    const modeRegister1Default = 0x01
    const modeRegister2 = 0x01 // MODE2
    const modeRegister2Default = 0x04
    const sleep = modeRegister1Default | 0x10; // Set sleep bit to 1
    const wake = modeRegister1Default & 0xEF; // Set sleep bit to 0
    const restart = wake | 0x80; // Set restart bit to 1
    const allChannelsOnStepLowByte = 0xFA // ALL_LED_ON_L
    const allChannelsOnStepHighByte = 0xFB // ALL_LED_ON_H
    const allChannelsOffStepLowByte = 0xFC // ALL_LED_OFF_L
    const allChannelsOffStepHighByte = 0xFD // ALL_LED_OFF_H
    const PinRegDistance = 4
    const channel0OnStepLowByte = 0x06 // LED0_ON_L
    const channel0OnStepHighByte = 0x07 // LED0_ON_H
    const channel0OffStepLowByte = 0x08 // LED0_OFF_L
    const channel0OffStepHighByte = 0x09 // LED0_OFF_H

    const hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

  
    export enum PinNum {
        Pin0 = 0,
        Pin1 = 1,
        Pin2 = 2,
        Pin3 = 3,
        Pin4 = 4,
        Pin5 = 5,
        Pin6 = 6,
        Pin7 = 7,
        Pin8 = 8,
        Pin9 = 9,
        Pin10 = 10,
        Pin11 = 11,
        Pin12 = 12,
        Pin13 = 13,
        Pin14 = 14,
        Pin15 = 15,
    }

  
    export enum ValveNum {
        Valve1 = 1,
        Valve2 = 2,
        Valve3 = 3,
        Valve4 = 4,
        Valve5 = 5,
        Valve6 = 6,
        Valve7 = 7,
        Valve8 = 8,
        Valve9 = 9,
        Valve10 = 10,
        Valve11 = 11,
        Valve12 = 12,
        Valve13 = 13,
        Valve14 = 14,
        Valve15 = 15,
        Valve16 = 16,
    }

  
    export class ChipConfig {
        address: number;
        freq: number;
        constructor(address: number = 0x40, freq: number = 50) {
            this.address = address
            this.freq = freq
            valveInit(address, freq)
        }
    }

    export const chips: ChipConfig[] = []

    function calcFreqPrescaler(freq: number): number {
        return (25000000 / (freq * chipResolution)) - 1;
    }

    function stripHexPrefix(str: string): string {
        if (str.length === 2) {
            return str
        }
        if (str.substr(0, 2) === '0x') {
            return str.substr(-2, 2)
        }
        return str
    }

    function write(chipAddress: number, register: number, value: number): void {
        const buffer = pins.createBuffer(2)
        buffer[0] = register
        buffer[1] = value
        pins.i2cWriteBuffer(chipAddress, buffer, false)
    }

    export function getChipConfig(address: number): ChipConfig {
        for (let i = 0; i < chips.length; i++) {
            if (chips[i].address === address) {
                debug(`Returning chip ${i}`)
                return chips[i]
            }
        }
        debug(`Creating new chip for address ${address}`)
        const chip = new ChipConfig(address)
        const index = chips.length
        chips.push(chip)
        return chips[index]
    }

    function calcFreqOffset(freq: number, offset: number) {
        return ((offset * 1000) / (1000 / freq) * chipResolution) / 10000
    }

    /**
     * A pulzustartomány beállítására szolgál (0-4095) tartományban
     * @param chipAddress [64-125] A PCA9685 I2C címe, pl.: 64
     * @param pinNumber a láb sorszáma (0-15) 
     * @param onStep A bekapcsolásai impulzus hossza (0-4095)
     * @param offStep A kikapcsolási impulzus hossza (0-4095)
     */
    //% block advanced=true
    //% chipAddress.defl=0x40
    
    export function valveSetPinPulseRange(chipAddress: number = 0x40, pinNumber: PinNum = 0, onStep: number = 0, offStep: number = 2048): void {
        pinNumber = Math.max(0, Math.min(15, pinNumber))
        const buffer = pins.createBuffer(2)
        const pinOffset = PinRegDistance * pinNumber
        onStep = Math.max(0, Math.min(4095, onStep))
        offStep = Math.max(0, Math.min(4095, offStep))

        debug(`setPinPulseRange(${pinNumber}, ${onStep}, ${offStep}, ${chipAddress})`)
        debug(`  pinOffset ${pinOffset}`)

        // Low byte of onStep
        write(chipAddress, pinOffset + channel0OnStepLowByte, onStep & 0xFF)

        // High byte of onStep
        write(chipAddress, pinOffset + channel0OnStepHighByte, (onStep >> 8) & 0x0F)

        // Low byte of offStep
        write(chipAddress, pinOffset + channel0OffStepLowByte, offStep & 0xFF)

        // High byte of offStep
        write(chipAddress, pinOffset + channel0OffStepHighByte, (offStep >> 8) & 0x0F)
    }

    /**
     * Kitöltési tényező megadása (0-100) egy szelephez
     * @param chipAddress [64-125] A PCA9685 I2C címe, pl.: 64
     * @param ledNum A kimenet sorszáma (1-16) 
     * @param dutyCycle A kitöltéi tényező (0-100)
     */
    //% block
    //% chipAddress.defl=0x40
    export function valveSetDutyCycle(chipAddress: number = 0x40, valveNum: ValveNum = 1, dutyCycle: number = 50): void {
        valveNum = Math.max(1, Math.min(16, valveNum))
        dutyCycle = Math.max(0, Math.min(100, dutyCycle))
        const pwm = (dutyCycle * (chipResolution - 1)) / 100
        debug(`setLedDutyCycle(${valveNum}, ${dutyCycle}, ${chipAddress})`)
        return valveSetPinPulseRange(valveNum - 1, 0, pwm, chipAddress)
    }

  
  
  
    /**
     * A PCA9685 inicializálása. Teljes alapelyzetbe állítja és minden kimemetet kikapcsol.
     * @param chipAddress [64-125] A PCA9685 I2C címe, pl.: 64
     * @param freq [40-1000] Frekvencia (40Hz-1000Hz); pl.: 100
     */
    //% block advanced=true
    //% chipAddress.defl=0x40
    //% newFreq.defl=100
    export function valveInit(chipAddress: number = 0x40, newFreq: number = 100) {
        debug(`Init chip at address ${chipAddress} to ${newFreq}Hz`)
        const buf = pins.createBuffer(2)
        const freq = (newFreq > 1000 ? 1000 : (newFreq < 40 ? 40 : newFreq))
        const prescaler = calcFreqPrescaler(freq)

        write(chipAddress, modeRegister1, sleep)

        write(chipAddress, PrescaleReg, prescaler)

        write(chipAddress, allChannelsOnStepLowByte, 0x00)
        write(chipAddress, allChannelsOnStepHighByte, 0x00)
        write(chipAddress, allChannelsOffStepLowByte, 0x00)
        write(chipAddress, allChannelsOffStepHighByte, 0x00)

        write(chipAddress, modeRegister1, wake)

        control.waitMicros(1000)
        write(chipAddress, modeRegister1, restart)
    }

    /**
     * A PCA9685 reszetelése. Teljes alapelyzetbe állítja és minden kimemetet kikapcsol.
     * @param chipAddress [64-125] A PCA9685 I2C címe, pl.: 64
     */
    //% block
    //% chipAddress.defl=0x40
    export function valveReset(chipAddress: number = 0x40): void {
        return valveInit(chipAddress, getChipConfig(chipAddress).freq);
    }

    /**
     * Segít a hexadecimális szá, decimálissá konvertálásában.
     * @param hexAddress A Hexadecimális szám; pl.: 0x40
     */
    //% block
    export function chipAddress(hexAddress: string): number {
        hexAddress = stripHexPrefix(hexAddress)
        let dec = 0
        let lastidx = 0
        let lastchar = 0
        const l = Math.min(2, hexAddress.length)
        for (let i = 0; i < l; i++) {
            const char = hexAddress.charAt(i)
            const idx = hexChars.indexOf(char)
            const pos = l - i - 1
            lastidx = pos
            dec = dec + (idx * Math.pow(16, pos))
        }
        return dec
    }

    export function setDebug(debugEnabled: boolean): void {
        _DEBUG = debugEnabled
    }
}