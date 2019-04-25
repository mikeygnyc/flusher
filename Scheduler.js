"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class Scheduler {
    constructor(valve, logger) {
        this.hasRunToday = false;
        this.valve = valve;
        this.Logger = logger;
        this.LoadSchedule();
        this.StartScheduler();
        this.LastFlushTime = new Date(0);
        this.nextRunTime = this.GetNextFlushTime();
    }
    SetFlushDuration(duration) {
        if (this.schedule) {
            this.schedule.flush_duration = duration;
        }
        else {
            this.schedule = {
                days: [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday"
                ],
                flush_time: "04:00",
                flush_duration: duration
            };
        }
        this.UpdateSchedule(this.schedule);
    }
    SetFlushTime(time) {
        if (this.schedule) {
            this.schedule.flush_time = time;
        }
        else {
            this.schedule = {
                days: [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday"
                ],
                flush_time: time,
                flush_duration: 10
            };
        }
        this.UpdateSchedule(this.schedule);
    }
    ToggleScheduleDay(dayIndex, enable) {
        let day = this.dayOfWeekAsString(dayIndex);
        if (this.schedule) {
            let workingDaysArr = this.schedule.days;
            if (enable) {
                if (!workingDaysArr.includes(day)) {
                    workingDaysArr.push(day);
                }
            }
            else {
                if (workingDaysArr.includes(day)) {
                    let n = workingDaysArr.indexOf(day);
                    workingDaysArr.splice(n, 1);
                }
            }
            this.schedule.days = workingDaysArr;
        }
        else {
            if (enable) {
                this.schedule = {
                    days: [day],
                    flush_time: "04:00",
                    flush_duration: 10
                };
            }
            else {
                this.schedule = {
                    days: [],
                    flush_time: "04:00",
                    flush_duration: 10
                };
            }
        }
        this.UpdateSchedule(this.schedule);
    }
    UpdateSchedule(newSchedule) {
        this.nextRunTime = this.GetNextFlushTime();
        this.StopScheduler();
        fs_1.default.writeFileSync("schedule.json", JSON.stringify(newSchedule));
        this.LoadSchedule();
        this.StartScheduler();
        this.Logger.info("Updated schedule: " + JSON.stringify(this.schedule));
    }
    LoadSchedule() {
        let rawFile = fs_1.default.readFileSync("schedule.json").toString();
        this.schedule = JSON.parse(rawFile);
    }
    StartScheduler() {
        this.StopScheduler();
        this.timerRef = setTimeout(this.TimerTick.bind(this), 1000);
        this.Logger.info("Starting scheduler");
    }
    StopScheduler() {
        if (!this.timerRef) {
            clearTimeout(this.timerRef);
        }
        this.Logger.info("Stopping scheduler");
    }
    TimerTick() {
        let now = new Date(Date.now());
        if (this.schedule && !this.hasRunToday) {
            if (this.nextRunTime <= now) {
                this.Logger.info("Running flush");
                this.valve.FlushValve(this.schedule.flush_duration);
                this.hasRunToday = true;
                this.LastFlushTime = now;
            }
        }
        else {
            this.nextRunTime = this.GetNextFlushTime();
            if (this.nextRunTime.getDate() === now.getDate()) {
                this.hasRunToday = false;
            }
        }
        this.timerRef = setTimeout(this.TimerTick.bind(this), 1000);
    }
    GetNextFlushTime() {
        if (!this.schedule) {
            return new Date(0);
        }
        let hourRun = 0;
        let minuteRun = 0;
        if (this.schedule) {
            let colon = this.schedule.flush_time.indexOf(":");
            hourRun = Number(this.schedule.flush_time.substr(0, colon));
            minuteRun = Number(this.schedule.flush_time.substr(colon + 1, 2));
        }
        let testDate = new Date(Date.now());
        let testDay = this.dayOfWeekAsString(testDate.getDay());
        while (true) {
            let now = new Date(Date.now());
            if (this.schedule.days.includes(testDay)) {
                let nextDate = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate(), hourRun, minuteRun);
                if (nextDate >= now) {
                    return nextDate;
                }
                else {
                    testDate = new Date(testDate.setDate(testDate.getDate() + 1));
                    testDay = this.dayOfWeekAsString(testDate.getDay());
                }
            }
            else {
                testDate = new Date(testDate.setDate(testDate.getDate() + 1));
                testDay = this.dayOfWeekAsString(testDate.getDay());
            }
        }
    }
    dayOfWeekAsString(dayIndex) {
        return [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
        ][dayIndex];
    }
}
exports.Scheduler = Scheduler;
//# sourceMappingURL=Scheduler.js.map