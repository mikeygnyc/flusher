import { ValveController } from "./ValveController";
import fs from "fs";
import winston = require("winston");
export interface Schedule {
    days: string[];
    flush_time: string;
    flush_duration: number;
}
export class Scheduler {
    constructor(valve: ValveController, logger: winston.Logger) {
        this.valve = valve;
        this.Logger = logger;
        this.LoadSchedule();
        this.StartScheduler();
        this.LastFlushTime = new Date(0);
        this.nextRunTime = this.GetNextFlushTime();
    }
    public LastFlushTime: Date;
    private Logger: winston.Logger;
    private valve: ValveController;
    public schedule: Schedule | undefined;
    public SetFlushDuration(duration: number) {
        if (this.schedule) {
            this.schedule.flush_duration = duration;
        } else {
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
    public SetFlushTime(time: string) {
        if (this.schedule) {
            this.schedule.flush_time = time;
        } else {
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
    public ToggleScheduleDay(dayIndex: number, enable: boolean) {
        let day: string = this.dayOfWeekAsString(dayIndex);

        if (this.schedule) {
            let workingDaysArr = this.schedule.days;
            if (enable) {
                if (!workingDaysArr.includes(day)) {
                    workingDaysArr.push(day);
                }
            } else {
                if (workingDaysArr.includes(day)) {
                    let n: number = workingDaysArr.indexOf(day);
                    workingDaysArr.splice(n, 1);
                }
            }
            this.schedule.days = workingDaysArr;
        } else {
            if (enable) {
                this.schedule = {
                    days: [day],
                    flush_time: "04:00",
                    flush_duration: 10
                };
            } else {
                this.schedule = {
                    days: [],
                    flush_time: "04:00",
                    flush_duration: 10
                };
            }
        }
        this.UpdateSchedule(this.schedule);
    }
    public UpdateSchedule(newSchedule: Schedule) {
        this.nextRunTime = this.GetNextFlushTime();
        this.StopScheduler();
        fs.writeFileSync("schedule.json", JSON.stringify(newSchedule));
        this.LoadSchedule();
        this.StartScheduler();
        this.Logger.info("Updated schedule: " + JSON.stringify(this.schedule));
    }
    public LoadSchedule() {
        let rawFile: string = fs.readFileSync("schedule.json").toString();
        this.schedule = JSON.parse(rawFile);
    }
    private timerRef: NodeJS.Timer | undefined;
    public StartScheduler() {
        this.StopScheduler();
        this.timerRef = setTimeout(this.TimerTick.bind(this), 1000);
        this.Logger.info("Starting scheduler");
    }
    public StopScheduler() {
        if (!this.timerRef) {
            clearTimeout(this.timerRef);
        }
        this.Logger.info("Stopping scheduler");
    }
    private TimerTick() {
        let now: Date = new Date(Date.now());

        if (this.schedule && !this.hasRunToday) {
            if (this.nextRunTime <= now) {
                this.Logger.info("Running flush");
                this.valve.FlushValve(this.schedule.flush_duration);
                this.hasRunToday = true;
                this.LastFlushTime = now;
            }
        } else {
            this.nextRunTime = this.GetNextFlushTime();
            if (this.nextRunTime.getDate() === now.getDate()) {
                this.hasRunToday = false;
            }
        }
        this.timerRef = setTimeout(this.TimerTick.bind(this), 1000);
    }
    private nextRunTime: Date;
    private hasRunToday: boolean = false;
    public GetNextFlushTime() {
        if (!this.schedule) {
            return new Date(0);
        }
        let hourRun: number = 0;
        let minuteRun: number = 0;
        if (this.schedule) {
            let colon: number = this.schedule.flush_time.indexOf(":");
            hourRun = Number(this.schedule.flush_time.substr(0, colon));
            minuteRun = Number(this.schedule.flush_time.substr(colon + 1, 2));
        }
        let testDate: Date = new Date(Date.now());
        let testDay: string = this.dayOfWeekAsString(testDate.getDay());
        while (true) {
            let now: Date = new Date(Date.now());
            if (this.schedule.days.includes(testDay)) {
                let nextDate: Date = new Date(
                    testDate.getFullYear(),
                    testDate.getMonth(),
                    testDate.getDate(),
                    hourRun,
                    minuteRun
                );
                if (nextDate >= now) {
                    return nextDate;
                } else {
                    testDate = new Date(
                        testDate.setDate(testDate.getDate() + 1)
                    );
                    testDay = this.dayOfWeekAsString(testDate.getDay());
                }
            } else {
                testDate = new Date(testDate.setDate(testDate.getDate() + 1));
                testDay = this.dayOfWeekAsString(testDate.getDay());
            }
        }
    }
    private dayOfWeekAsString(dayIndex: number) {
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
