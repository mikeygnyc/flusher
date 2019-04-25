import express from "express";
import cors from "cors";
import morgan from "morgan";
import { ValveController } from "./ValveController";
import winston from "winston";
import logform from "logform";
import fs from "fs";
import path from "path";
import { Scheduler, Schedule } from "./Scheduler";
const { format } = logform;
const alignedWithColorsAndTime = format.combine(
    format.timestamp(),
    format.align(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);
const logger = winston.createLogger({
    format: alignedWithColorsAndTime,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "valve.log" })
    ]
});
let Valve: ValveController = new ValveController(7, ready, logger);
let Sched:Scheduler= new Scheduler(Valve,logger);
const app = express();
app.use(cors());
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))
app.get("/", (req, res) => {
    let outputStr: string =
        "Valve controller online. Controller " +
        (isReady ? "ready" : "not ready");
    return res.send(outputStr);
});
app.get("/state/", (req, res) => {
    Valve.ReadValve((err: any, data: boolean) => {
        let result: any;
        if (err) {
            result = {
                result: "OK",
                error: err
            };
            logger.error("Error reading valve state: " + JSON.parse(err));
        } else {
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
    var status:string;
    var schedule:any
    if (Sched.schedule){
        status="OK",
        schedule=Sched.schedule;
    } else {
        status="No Schedule!",
        schedule=undefined
    }
    var result = {
        result:status,
        schedule:schedule
    }
    return res.send(result);
});
app.get("/getScheduledTime", (req, res) => {
    var time:string;
    var status:string;
    if (Sched.schedule){
        status="OK";
        time=Sched.schedule.flush_time;
    } else {
        status="No Schedule!"
        time="UNKNOWN";
    }
    var result = {
        result:status,
        flush_time:time
    }
    return res.send(result);
});
app.get("/setScheduledTime/:scheduledTime", (req, res) => {
    Sched.SetFlushTime(req.params.scheduledTime);
    var status:string;
    var schedule:any
    if (Sched.schedule){
        status="OK",
        schedule=Sched.schedule;
    } else {
        status="No Schedule!",
        schedule=undefined
    }
    var result = {
        result:status,
        schedule:schedule
    }
    return res.send(result);
});
app.get("/getScheduledDays", (req, res) => {
    var days:string[];
    var status:string;
    if (Sched.schedule){
        status="OK";
        days=Sched.schedule.days;
    } else {
        status="No Schedule!"
        days=[""];
    }
    var result = {
        result:status,
        days:days
    }
    return res.send(result);
});
app.get("/setScheduledDays/:scheduledDays", (req, res) => {
    var daysList:string[] = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];

    var requestedDaysRaw:string=req.params.scheduledDays;
    var requestedDays=requestedDaysRaw.split(",");
    var dayNumber:number=0;
    daysList.forEach(value=>{
        if (requestedDays.includes(value)){
            Sched.ToggleScheduleDay(dayNumber,true);
        } else {
            Sched.ToggleScheduleDay(dayNumber,false);
        }
        dayNumber++;
    });
    var status:string;
    var schedule:any
    if (Sched.schedule){
        status="OK",
        schedule=Sched.schedule;
    } else {
        status="No Schedule!",
        schedule=undefined
    }
    var result = {
        result:status,
        schedule:schedule
    }
    return res.send(result);
});
app.get("/getFlushDuration", (req, res) => {
    var duration:number;
    var status:string;
    if (Sched.schedule){
        status="OK";
        duration=Sched.schedule.flush_duration;
    } else {
        status="No Schedule!"
        duration=-1;
    }
    var result = {
        result:status,
        flushDuration:duration
    }
    return res.send(result);
});
app.get("/setFlushDuration/:flushDuration", (req, res) => {
    var status:string;
    var schedule:any
    Sched.SetFlushDuration(Number(req.params.flushDuration));
    if (Sched.schedule){
        status="OK",
        schedule=Sched.schedule;
    } else {
        status="No Schedule!",
        schedule=undefined
    }
    var result = {
        result:status,
        schedule:schedule
    }
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
let isReady: boolean = false;
function ready(err: any, result: any) {
    if (err) {
        logger.error("Valve control not ready! " + JSON.stringify(err));
    } else {
        logger.info("Valve control ready");
        isReady = true;
    }
}
