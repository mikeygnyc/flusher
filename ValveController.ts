import winston = require("winston");

export class ValveController {
    private relayPin: number = -1;
    private gpio: any;
    private logger: winston.Logger;
    public constructor(pin: number, callback: any, logger: winston.Logger) {
        this.gpio = require("rpi-gpio");
        this.logger = logger;
        this.relayPin = pin;
        this.gpio.setup(this.relayPin, this.gpio.DIR_OUT, callback);
    }
    public FlushValve(duration: number) {
        this.OpenValve();
        setTimeout(this.CloseValve.bind(this), duration * 1000);
    }
    public OpenValve() {
        try {
            this.gpio.write(this.relayPin, true);
            this.logger.info("Opening Valve");
        } catch (err) {
            this.logger.error("Error opening valve: " + JSON.stringify(err));
        }
    }
    public CloseValve() {
        try {
            this.gpio.write(this.relayPin, false);
            this.logger.info("Closing Valve");
        } catch (err) {
            this.logger.error("Error closing valve: " + JSON.stringify(err));
        }
    }
    public ReadValve(callback: any) {
        try {
            this.gpio.read(this.relayPin, callback);
        } catch (err) {
            this.logger.error("Error reading valve: " + JSON.stringify(err));
        }
    }
}
