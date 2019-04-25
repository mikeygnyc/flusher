"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const ValveController_1 = require("./ValveController");
const winston_1 = __importDefault(require("winston"));
const logform_1 = __importDefault(require("logform"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Scheduler_1 = require("./Scheduler");
const { format } = logform_1.default;
const alignedWithColorsAndTime = format.combine(format.timestamp(), format.align(), format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`));
const logger = winston_1.default.createLogger({
    format: alignedWithColorsAndTime,
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: "valve.log" })
    ]
});
let Valve = new ValveController_1.ValveController(7, ready, logger);
let Sched = new Scheduler_1.Scheduler(Valve, logger);
const app = express_1.default();
app.use(cors_1.default());
var accessLogStream = fs_1.default.createWriteStream(path_1.default.join(__dirname, 'access.log'), { flags: 'a' });
// setup the logger
app.use(morgan_1.default('combined', { stream: accessLogStream }));
app.get("/", (req, res) => {
    let outputStr = "Valve controller online. Controller " +
        (isReady ? "ready" : "not ready");
    return res.send(outputStr);
});
app.get("/state/", (req, res) => {
    Valve.ReadValve((err, data) => {
        let result;
        if (err) {
            result = {
                result: "OK",
                error: err
            };
            logger.error("Error reading valve state: " + JSON.parse(err));
        }
        else {
            result = {
                result: "OK",
                valve_state: data ? "open" : "closed"
            };
        }
        return res.send(result);
    });
});
app.get("/flush/:duration", (req, res) => {
    Valve.FlushValve(Number(req.params.duration));
    return res.send({ result: "OK" });
});
app.get("/getSchedule", (req, res) => {
    var status;
    var schedule;
    if (Sched.schedule) {
        status = "OK",
            schedule = Sched.schedule;
    }
    else {
        status = "No Schedule!",
            schedule = undefined;
    }
    var result = {
        result: status,
        schedule: schedule
    };
    return res.send(result);
});
app.get("/getScheduledTime", (req, res) => {
    var time;
    var status;
    if (Sched.schedule) {
        status = "OK";
        time = Sched.schedule.flush_time;
    }
    else {
        status = "No Schedule!";
        time = "UNKNOWN";
    }
    var result = {
        result: status,
        flush_time: time
    };
    return res.send(result);
});
app.get("/setScheduledTime/:scheduledTime", (req, res) => {
    Sched.SetFlushTime(req.params.scheduledTime);
    var status;
    var schedule;
    if (Sched.schedule) {
        status = "OK",
            schedule = Sched.schedule;
    }
    else {
        status = "No Schedule!",
            schedule = undefined;
    }
    var result = {
        result: status,
        schedule: schedule
    };
    return res.send(result);
});
app.get("/getScheduledDays", (req, res) => {
    var days;
    var status;
    if (Sched.schedule) {
        status = "OK";
        days = Sched.schedule.days;
    }
    else {
        status = "No Schedule!";
        days = [""];
    }
    var result = {
        result: status,
        days: days
    };
    return res.send(result);
});
app.get("/setScheduledDays/:scheduledDays", (req, res) => {
    var daysList = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];
    var requestedDaysRaw = req.params.scheduledDays;
    var requestedDays = requestedDaysRaw.split(",");
    var dayNumber = 0;
    daysList.forEach(value => {
        if (requestedDays.includes(value)) {
            Sched.ToggleScheduleDay(dayNumber, true);
        }
        else {
            Sched.ToggleScheduleDay(dayNumber, false);
        }
        dayNumber++;
    });
    var status;
    var schedule;
    if (Sched.schedule) {
        status = "OK",
            schedule = Sched.schedule;
    }
    else {
        status = "No Schedule!",
            schedule = undefined;
    }
    var result = {
        result: status,
        schedule: schedule
    };
    return res.send(result);
});
app.get("/getFlushDuration", (req, res) => {
    var duration;
    var status;
    if (Sched.schedule) {
        status = "OK";
        duration = Sched.schedule.flush_duration;
    }
    else {
        status = "No Schedule!";
        duration = -1;
    }
    var result = {
        result: status,
        flushDuration: duration
    };
    return res.send(result);
});
app.get("/setFlushDuration/:flushDuration", (req, res) => {
    var status;
    var schedule;
    Sched.SetFlushDuration(Number(req.params.flushDuration));
    if (Sched.schedule) {
        status = "OK",
            schedule = Sched.schedule;
    }
    else {
        status = "No Schedule!",
            schedule = undefined;
    }
    var result = {
        result: status,
        schedule: schedule
    };
    return res.send(result);
});
app.get("/getLastFlushTime", (req, res) => {
    return res.send({
        result: "OK",
        lastFlushTime: Sched.LastFlushTime.toLocaleString()
    });
});
app.get("/getNextFlushTime", (req, res) => {
    return res.send({
        result: "OK",
        nextFlushTime: Sched.GetNextFlushTime().toLocaleString()
    });
});
app.listen(3000, () => logger.info(`Valve control listening on port 3000`));
let isReady = false;
function ready(err, result) {
    if (err) {
        logger.error("Valve control not ready! " + JSON.stringify(err));
    }
    else {
        logger.info("Valve control ready");
        isReady = true;
    }
}
//# sourceMappingURL=auto_flush.js.map