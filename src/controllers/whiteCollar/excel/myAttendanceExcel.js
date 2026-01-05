let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')
const moment = require('moment')
const getMyAttendanceExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)

        // console.log(decodedToken);
        // const tokenUserId = '29'
        // const tokenBranchId = '1'
        // let db = sequelize('59')

        let data = req.body
        const { month, year } = data

        function getDaysInMonth(year, month) {
            return new Date(year, month, 0).getDate();
        }

        let isMultiClockEmp = await myFunc.isMultiEmployee(tokenUserId, db)

        const daysInCurrentMonth = getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)
        const app = [];

        for (let i = 1; i <= NoOfdaysInMonth; i++) {

            let number = i.toString().padStart(2, '0');
            let empDtStrdate = new Date(`${year}-${month}-${number}`);
            let dayName = empDtStrdate.toLocaleString('en-US', { weekday: 'long' });

            let newObj = {
                'date': `${year}-${month}-${number}`,
                'day': dayName,
                'inTime': `--`,
                'outTime': "--",
                'lunchIn': "--",
                'lunchOut': '--',
                'workHours1': '--',
                'workHours2': '--',
                'workHours': '00:00',
                'breakHrs': "",
                'status': '--',
                'remarks': '--',
                'leaveTypeId': '--',
                'type': '--',
                'isRejectSunday': '--',
                'isHoliday': '--',
                'fixedWeeklyHoliday': '--',
                'holidayPurpose': '--'
            };

            app.push(newObj);
        }

        const attendanceModel = await db.query(
            `
                 select 
                 a.date,
                 a.intime,
                 a.outTime,
                 a.startLunch,
                 a.endLunch,
                 a.type AS attenType,
                 a.lensDeviceName,
                 a.remarks
                 from eve_acc_employee_attendence as a
                 where a.status='A'
                 and a.empId=:tokenUserId
                 and year(a.date)=:year
                 and month(a.date)=:month                               
                `, {
            replacements: {
                tokenUserId: tokenUserId,
                year: year,
                month: month,
            }, type: QueryTypes.SELECT
        }
        )

        const attendanceApproveModel = await db.query(
            `
                     select
                     date,leaveTypeId,remarks,type  
                     from eve_acc_employee_attendence_approved 
                     where status='A'
                     and employeeId=:tokenUserId
                     and year(date)=:year
                     and month(date)=:month
            `, {
            replacements: {
                tokenUserId: tokenUserId,
                year: year,
                month: month,
            }, type: QueryTypes.SELECT
        })

        const checkSetHolidayDate = await db.query(
            `  
                                select * from eve_acc_company_holiday
                                where status='A'
                                and branchId=:tokenBranchId
                                and year(date)=:year
                                and month(date)=:month
                `, {
            replacements: {
                tokenBranchId: tokenBranchId,
                year: year,
                month: month,
            }, type: QueryTypes.SELECT
        }
        )
        const fixHolidayModel = await db.query(
            `  
                                select day from eve_acc_company_fix_weekly_holiday
                                where status='A'
                                and branchId=:tokenBranchId
                              
                `, {
            replacements: {
                tokenBranchId: tokenBranchId,

            }, type: QueryTypes.SELECT
        }
        )


        let holidayDateName
        if (fixHolidayModel.length > 0) {
            holidayDateName = fixHolidayModel[0]['day']
        }
        else {
            holidayDateName = ''
        }

        let attendanceMap = new Map()
        let attendanceApproveMap = new Map()
        let checkSetHolidayDateMap = new Map()

        attendanceModel.map(x => attendanceMap.set(x.date, x))
        attendanceApproveModel.map(x => attendanceApproveMap.set(x.date, x))
        checkSetHolidayDate.map(x => checkSetHolidayDateMap.set(x.date, x))

        let totalWorkHoursArr = []
        await Promise.all(app.map(async e => {
            if (attendanceMap.has(e.date)) {
                let record = attendanceMap.get(e.date)
                // console.log(record);




                e.inTime = record.intime
                e.outTime = record.outTime
                e.lunchIn = record.startLunch
                e.lunchOut = record.endLunch
                e.lensDeviceName = record.lensDeviceName
                e.attenType = record.attenType
                    ? record.attenType.charAt(0).toUpperCase() + record.attenType.slice(1)
                    : '';

                e.leaveTypeId = record.leaveTypeId

                if (record.intime && record.outTime) {
                    if (isMultiClockEmp === 'yes') {
                        const schedule = await myFunc.getEmployeeWiseOfficeSchedule(tokenUserId, record.date, db);
                        if (!schedule) return;

                        let { clockInTime, clockOutTime, lunchIn, lunchOut, minWorkingHour } = schedule;
                        const baseDate = e.date;
                        const toMillis = time => new Date(`${baseDate} ${time}`).getTime();
                        const officeIn = toMillis(clockInTime);
                        const officeOut = toMillis(clockOutTime);
                        let lunchInMillis = toMillis(lunchIn);
                        let lunchOutMillis = toMillis(lunchOut);
                        let totalWorkMillis = officeOut > officeIn ? officeOut - officeIn : 0;
                        if (lunchOutMillis > lunchInMillis) totalWorkMillis -= (lunchOutMillis - lunchInMillis);
                        const officetotalWorkHours = moment.utc(totalWorkMillis).format("HH:mm");
                        e.officetotalWorkHours = officetotalWorkHours


                        const multi = await myFunc.getMultiAttendanceWorkingHour(
                            tokenUserId,
                            record.date,
                            // '2025-11-13',
                            officetotalWorkHours,
                            lunchInMillis, lunchOutMillis, minWorkingHour,
                            record.intime, record.outTime, record.startLunch, record.endLunch, db
                        )

                        let workingHrs, breakHrs;

                        let validate

                        if (multi.startLunch !== null && multi.endLunch !== null) {


                            validate = isLunchInBetween(multi.outime, multi.endLunch)
                            if (!validate) {
                                multi.totalBreakHourMillis = 0
                                lunchOutMillis = 0
                                lunchInMillis = 0
                            }
                            // let a = isLunchInBetween1(multi.intime, multi.outime, multi.startLunch)


                            // if (a == false) {
                            //     multi.totalBreakHourMillis = 0
                            //     lunchOutMillis = 0
                            //     lunchInMillis = 0
                            // }
                        }
                        else {

                            validate = isLunchInBetween(record.outTime, lunchOut)
                            if (!validate) {
                                lunchOutMillis = 0
                                lunchInMillis = 0
                            }
                        }

                        let breakMillis
                        if (multi.startLunch === '00:00' && multi.endLunch === '00:00') {
                            breakMillis = multi.totalBreakHourMillis

                        }
                        else {

                            breakMillis = multi.totalBreakHourMillis || (lunchOutMillis - lunchInMillis);
                        }

                        breakHrs = moment.utc(breakMillis).format("HH:mm");


                        let netWorkMillis
                        if (validate && multi.startLunch === null && multi.endLunch === null) {

                            netWorkMillis = multi.totalWorkingHoursMillis > breakMillis
                                ? multi.totalWorkingHoursMillis - breakMillis
                                : multi.totalWorkingHoursMillis;

                        }
                        else {
                            netWorkMillis = multi.totalWorkingHoursMillis
                        }

                        workingHrs = moment.utc(netWorkMillis).format("HH:mm");

                        e.workHours = workingHrs



                        if (multi.key === 'single') {

                            e.breakHrs = breakHrs


                        }
                        else {
                            let inOutDiff = myFunc.calculateWorkingHours(record.intime, record.outTime)
                            let break1 = myFunc.calculateWorkingHours(workingHrs, inOutDiff)
                            e.breakHrs = break1

                        }

                        //     console.log(
                        //         {
                        //             date:e.date,
                        //             breakHrs:break1,
                        //             inOutDiff:inOutDiff,
                        //             workingHrs:workingHrs,
                        // });





                        // timeArr.push(workingHrs);
                        // breakArr.push(breakHrs);
                    }
                }

                else {

                    if (record.intime !== '--' && record.outTime !== '--' && record.intime !== null && record.outTime !== null) {

                        e.workHours1 = myFunc.calculateWorkingHours(record.intime, record.outTime)
                    }
                    if (record.startLunch !== '--' && record.endLunch !== '--' && record.startLunch !== null && record.endLunch !== null) {

                        e.workHours2 = myFunc.calculateWorkingHours(record.startLunch, record.endLunch)
                    }
                    if (e.workHours1 !== '--' && e.workHours2 !== '--' && e.workHours1 !== null && e.workHours2 !== null) {
                        e.workHours = myFunc.subtractTime(e.workHours1, e.workHours2)
                    }

                }


            }
            if (attendanceApproveMap.has(e.date)) {
                let recordApprove = attendanceApproveMap.get(e.date)
                e.remarks = recordApprove.remarks
                e.leaveTypeId = recordApprove.leaveTypeId
                e.type = recordApprove.type
                e.isRejectSunday = recordApprove.isRejectSunday
            }
            if (e.isRejectSunday === 'yes') {
                e.status = 'Absent'
            }
            else {
                if (checkSetHolidayDateMap.has(e.date)) {
                    let recordHd = checkSetHolidayDateMap.get(e.date)
                    e.holidayPurpose = recordHd.purpose
                    if (e.holidayPurpose !== '--') {
                        e.status = 'Holiday'
                    }

                }
                if (holidayDateName === e.day) {
                    e.status = 'Off Day'
                }
                else if (e['type'] == "reject" && e['remarks'] != "AB LEAVE" && e['remarks'] != "First Half" && e['remarks'] != "Second Half") {

                    e.status = 'Absent'
                }
                else if (e.type === 'full') {
                    e.status = 'Full Day'
                }
                else if (e.type === 'half') {
                    e.status = 'Half Day'
                }
                else if (e.type === 'holiday' && e.remarks === 'L LEAVE' && e.leaveTypeId !== '') {
                    let leaveName = await myFunc.leaveType(e.leaveTypeId, db)
                    e.status = leaveName.name
                }
                else if (e.type === 'holiday' && e.remarks === 'L LEAVE' && e.leaveTypeId === '') {

                    e.status = 'Default Paid Leave'
                }
                else if (e.type === 'reject' && e.remarks === 'AB LEAVE') {

                    e.status = 'Unpaid Leave'
                }
                else if (e.type === 'holiday' && e.remarks === 'First Half' && e.remarks === 'Second Half') {

                    e.status = 'Halfday Paid Leave'
                }

                else if (e.type === 'reject' && e.remarks === 'First Half' || e.remarks === 'Second Half') {

                    e.status = 'Halfday Unpaid Leave'
                }
                else if (e.type === 'holiday' && e.remarks !== 'L LEAVE' && e.remarks !== 'First Half' && e.remarks !== 'Second Half') {

                    e.status = 'Marked as Holiday'
                }

                // if (e.status === 'Off Day') {
                // e.workHours = '00:00'
                // }

            }

            e.workHours = validateTime(e.workHours)
            totalWorkHoursArr.push(e.workHours)


            if (e.workHours && e.officetotalWorkHours && toMinutesForStar(e.workHours) < toMinutesForStar(e.officetotalWorkHours)) {
                e.workHours = `${e.workHours}*`;
            }


        }))


        const totalWorkingHrs = myFunc.addTimes(totalWorkHoursArr)

        function validateTime(timeStr) {
            const parts = timeStr.split(':');
            if (parts[0].startsWith('-')) {
                return '00:00';
            }
            if (parts.length !== 2 ||
                isNaN(parts[0]) ||
                isNaN(parts[1]) ||
                parts[0] < 0 || parts[0] > 23 ||
                parts[1] < 0 || parts[1] > 59) {
                return 'Invalid time format';
            }
            return timeStr;
        }
        function formatDate(inputDate) {
            const date = new Date(inputDate);
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).format(date);
        }
        const excelData = app.map(e => ({
            'Date': formatDate(e.date),
            'Day': e.day,
            'In Time': e.inTime,
            'Out Time': e.outTime,
            'Lunch In': e.lunchIn,
            'Lunch Out': e.lunchOut,
            'Work Hours': e.workHours,
            'Total Break Hours': e.breakHrs,
            'Type': e.attenType && e.attenType.trim() !== ''
                ? `${e.attenType}${e.lensDeviceName ? ` (${e.lensDeviceName})` : ''}`
                : '',
            'Status': e.status,
            'Remarks': e.remarks
        }))
        return res.status(200).json({
            status: true, totalData: app.length, totalWorkingHrs: `Total : ${totalWorkingHrs}`,
            // employee: app,
            employee: myFunc.replaceEmptyValues(excelData)
        })
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, month, year }) {

    try {
        const config = {

            headers: {
                'Content-Type': 'application/json',
                // 'Cookie': `x-cross-auth=${(token)}`
                'x-cross-auth': token
            },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyAttendanceExcel`,
            data: { token, month, year }

        }
        const response = await axios(config)
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function createExcelFile(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = []
    let employee = data.employee
    let header = Object.keys(employee[0])

    values.push(header)
    employee.forEach(e => {
        let value = Object.values(e)

        values.push(value)
    });

    let workHrsIndex = header.indexOf('Work Hours')
    let len = header.length;
    let row = new Array(len).fill('');
    row[workHrsIndex] = data['totalWorkingHrs']
    values.push(row)


    worksheet.addRows(values)
    const headerRow = worksheet.getRow(1);


    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            row.height = 25

        });
    });
    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true }

    })
    worksheet.columns.forEach(column => {
        column.width = 20
    })
    const lastRow = worksheet.lastRow;
    lastRow.eachCell(cell => { cell.font = { bold: true } })
    return workbook.xlsx
}

async function getMyAttendanceExcelSheet(req, res) {
    try {

        // let token = req.cookies["x-cross-auth"] || req.query["x-cross-auth"]
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { month, year } = data

        let apiData = await fetchData({
            token, month, year
        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Attendance.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMyAttendanceExcel, getMyAttendanceExcelSheet }

function isLunchInBetween1(intime, outime, startLunch) {
    // Helper to convert HH:mm or H:mm to minutes
    if (!startLunch) {
        return true
    }
    const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const inMin = toMinutes(intime);
    const outMin = toMinutes(outime);
    const lunchMin = toMinutes(startLunch);

    return lunchMin >= inMin && lunchMin <= outMin;
}
function isLunchInBetween(outime, endLunch) {
    if (!endLunch) {
        return true
    }

    const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const outMin = toMinutes(outime);
    const endLunchMin = toMinutes(endLunch);

    return outMin > endLunchMin;
}

function addTimeStrings(t1, t2) {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);

    let totalMinutes = h1 * 60 + m1 + h2 * 60 + m2;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format as hh:mm
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
function toMinutesForStar(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}
