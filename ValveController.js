"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValveController {
    constructor(pin, callback, logger) {
        this.relayPin = -1;
        this.gpio = require("rpi-gpio");
        this.logger = logger;
        this.relayPin = pin;
        this.gpio.setup(this.relayPin, this.gpio.DIR_OUT, callback);
    }
    FlushValve(duration) {
        this.OpenValve();
        setTimeout(this.CloseValve.bind(this), duration * 1000);
    }
    OpenValve() {
        try {
            this.gpio.write(this.relayPin, true);
            this.logger.info("Opening Valve");
        }
        catch (err) {
            this.logger.error("Error opening valve: " + JSON.stringify(err));
        }
    }
    CloseValve() {
        try {
            this.gpio.write(this.relayPin, false);
            this.logger.info("Closing Valve");
        }
        catch (err) {
            this.logger.error("Error closing valve: " + JSON.stringify(err));
        }
    }
    ReadValve(callback) {
        try {
            this.gpio.read(this.relayPin, callback);
        }
        catch (err) {
            this.logger.error("Error reading valve: " + JSON.stringify(err));
        }
    }
}
exports.ValveController = ValveController;
//# sourceMappingURL=ValveController.js.map