let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const moment = require('moment')
const getMonthlyAttendanceReportDateWise = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        
        // let db1 = sequelize()
        // const tokenUserId = '29'
        // const tokenCompanyId = '59'
        // const tokenBranchId = '75'
        // let db = sequelize('59')
        // let db1 = sequelize()

        let data = req.body
        let { fromDate, toDate, branchId, empCode, empname, locationId, subCompanyId, order } = data
        let year = moment(fromDate).format('YYYY')
        let month = moment(fromDate).format('MM')

        if (!fromDate && !toDate) {
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - 30);
            fromDate = pastDate.toISOString().split('T')[0];
            toDate = new Date().toISOString().split('T')[0];

        }
        // order = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        const countQuery = await db.query(
            `
                                select count(*) AS total
                                from eve_acc_employee as a
                                where a.status ='A'
                                and (:branchId is null or a.employeeBranchId=:branchId)
                                and (:empCode is null or a.employeeCode=:empCode)
                                and (:empname is null or a.employeeName=:empname)
                                and (:locationId is null or a.locationID=:locationId)
                                and (:subCompanyId is null or a.employeeSubCompanyId=:subCompanyId)
                                AND (employeeCurrentStatus = '' 
                                OR employeeCurrentStatus IS NULL 
                                OR employeeCurrentStatus = 'Active'
                                OR employeeCurrentStatus = 'resignation' 
                                OR employeeCurrentStatus = 'joining' 
                                OR employeeCurrentStatus = 'termination'
                                OR employeeCurrentStatus = 'release'
                                OR employeeCurrentStatus = 'offerletter')
                                AND (employeeType = '' 
								OR employeeType IS NULL
								OR employeeType = 'White Collar'
													    )                                                              
            `, {
            replacements: {
                branchId: branchId || null,
                empCode: empCode || null,
                empname: empname || null,
                locationId: locationId || null,
                subCompanyId: subCompanyId || null,
            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
        if (totalData === 0) {
            return res.status(200).json({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        let getData = await db.query(
            `
                         select a.id,a.id AS empId,a.employeeName,
                         a.employeeSubCompanyId,
                         a.employeeCode,
                         a.employeeDoj,
                         a.locationID,
                         a.employeeBranchId,
                         a.isOvertimeApplicable,
                         a.salaryTemplateId
                         -- a.multipleClockInClockOut

                         from eve_acc_employee as a
                           

                                     where a.status ='A'



                  and (:branchId is null or a.employeeBranchId=:branchId)
                  and (:empCode is null or a.employeeCode=:empCode)
                  and (:empname is null or a.employeeName=:empname)
                         and (:locationId is null or a.locationID=:locationId)
                                and (:subCompanyId is null or a.employeeSubCompanyId=:subCompanyId)

                                    AND (a.employeeCurrentStatus = '' 
                                    OR a.employeeCurrentStatus IS NULL 
                                    OR a.employeeCurrentStatus = 'Active'
                                    OR a.employeeCurrentStatus = 'resignation' 
                                    OR a.employeeCurrentStatus = 'joining' 
                                    OR a.employeeCurrentStatus = 'termination'
                                    OR a.employeeCurrentStatus = 'release'
    
    

                                                        OR a.employeeCurrentStatus = 'offerletter')
                                                     AND (a.employeeType = '' 
													        OR a.employeeType IS NULL
													        OR a.employeeType = 'White Collar'
													    )

                            ORDER BY a.employeeCode ${order}
                            limit :limit
                            offset :offset                       
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    branchId: branchId || null,
                    empCode: empCode || null,
                    empname: empname || null,
                    locationId: locationId || null,
                    subCompanyId: subCompanyId || null,


                }, type: QueryTypes.SELECT
            }
        )
        const a = new Date(fromDate);
        const b = new Date(toDate);
        let noOfdaysInMonth = (b - a) / (1000 * 60 * 60 * 24) + 1;


        if (noOfdaysInMonth >= 31) {
            noOfdaysInMonth = 31
        }

        // const app = [];

        // for (let i = 0; i < noOfdaysInMonth; i++) {

        //     const baseDate = new Date(fromDate);

        //     baseDate.setDate(baseDate.getDate() + i);
        //     const crtDate = baseDate.toISOString().split('T')[0];

        //     let newObj = {
        //         crtDate: crtDate,
        //         day: moment(`${crtDate}`).format('dddd'),
        //         inTime: '--',
        //         outTime: '--',
        //         workingHrs: '--',
        //         backcolor: "--",
        //         title: "--",
        //         breakHours: '--',
        //         type: '--',
        //         attStatus: '--',
        //         isSunday: false,
        //         deviceName: '',
        //     };

        //     app.push(newObj);
        // }


        await Promise.all(getData.map(async (e, i) => {
            e.year = year
            e.month = month
            const app = [];

            for (let i = 0; i < noOfdaysInMonth; i++) {

                const baseDate = new Date(fromDate);

                baseDate.setDate(baseDate.getDate() + i);
                const crtDate = baseDate.toISOString().split('T')[0];

                let newObj = {
                    crtDate: crtDate,
                    day: moment(`${crtDate}`).format('dddd'),
                    inTime: '--',
                    outTime: '--',
                    workingHrs: '--',
                    backcolor: "--",
                    title: "--",
                    breakHours: '--',
                    type: '--',
                    attStatus: '--',
                    isSunday: false,
                    deviceName: '',
                };

                app.push(newObj);
            }
            e.slno = offset + i + 1
            e.locationName = await myFunc.getLocationNameById(e.locationID, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.app = app

            const attendanceModel = await db.query(

                `
                        SELECT date,intime,outTime,lensDeviceName,startLunch,endLunch,type
                        FROM eve_acc_employee_attendence
                        WHERE status='A'
                        AND empId=:empId
                        AND date BETWEEN :fromDate AND :toDate

                        `, {
                replacements: {
                    empId: e.id,
                    fromDate: fromDate,
                    toDate: toDate,


                }, type: QueryTypes.SELECT
            }
            )





            const attendanceApproveModel = await db.query(

                `
                select date,type,remarks,leaveTypeId,flagRemarks
                from eve_acc_employee_attendence_approved
                where status='A'
                
                and employeeId=:employeeId
                AND date BETWEEN :fromDate AND :toDate
                `, {
                replacements: {
                    employeeId: e.id,
                    fromDate: fromDate,
                    toDate: toDate,


                }, type: QueryTypes.SELECT
            }
            )
            const companyHolidayModel = await db.query(
                `
                select date
                from eve_acc_company_holiday
                where status='A'
                and branchId=:branchId
                AND date BETWEEN :fromDate AND :toDate
                
                `, {
                replacements: {

                    branchId: e.employeeBranchId,
                    fromDate: fromDate,
                    toDate: toDate,

                }, type: QueryTypes.SELECT
            }
            )


            const sqlFixHodiday = await db.query(
                `
                select day from eve_acc_company_fix_weekly_holiday
                where status='A'
                and branchId=:branchId
                `, {
                replacements: {
                    branchId: e.employeeBranchId,
                }, type: QueryTypes.SELECT
            }
            )
            if (sqlFixHodiday.length > 0) {
                e.fixedWeeklyHoliday = sqlFixHodiday[0].day
            }
            else {
                e.fixedWeeklyHoliday = ''
            }

            let attendanceMap = new Map()
            let attendanceApproveMap = new Map()

            attendanceModel.map(x => attendanceMap.set(x.date, x))


            attendanceApproveModel.map(x => attendanceApproveMap.set(x.date, x))

            let timeArr = []
            let breakArr = []

            e.totalPresent = 0
            e.totalReject = 0
            e.totalAbsent = 0
            e.totalHalfDay = 0
            e.totalPaidLeave = 0
            e.totalUnpaidLeave = 0
            e.totalHalfdayPaidLeave = 0
            e.totalHalfdayunpaidLeave = 0
            e.totalMarkedAsHoliday = 0
            e.totalHoliday = 0
            // e.totalPaidHoliday = 0
            e.totalOffDay = 0
            // e.totalPayableOffDay=0
            e.totalRejectedSundays = 0



            let num_sundays = 0
            let fixWeeklyOffDay = await myFunc.getFixWeeklyOffDay(e.id, e.employeeBranchId, db)
            let additionalWeeklyOffDay = await additionalWeeklyOffDayForDaywise(e.employeeBranchId, fromDate, toDate, db)





            let getRoasterWiseOffday = await myFunc.getRoasterWiseOffday(e.id, fromDate, toDate, db)


            await Promise.all(e.app.map(async x => {

                let isHoliday = await myFunc.checkSetHolidayDate(x.crtDate, tokenBranchId, db)

                if (isHoliday == 'yes') {
                    x.isSunday = true
                }
                if (x.day === fixWeeklyOffDay) {
                    isSunday = 'yes'
                    x.isSunday = true
                }
                if (additionalWeeklyOffDay.includes(x.crtDate)) {
                    x.isSunday = true
                }

                if (getRoasterWiseOffday.includes(x.crtDate)) {
                    e.isSunday = true

                }


                if (attendanceMap.has(x.crtDate)) {

                    let record = attendanceMap.get(x.crtDate)



                    x.inTime = record.intime !== null ? record.intime : '--'
                    x.outTime = record.outTime !== null ? record.outTime : '--'
                    x.type = record.type

                    x.workingHrs = myFunc.calculateWorkingHours(x.inTime, x.outTime)
                    timeArr.push(x.workingHrs)

                    // if (record.intime !== null && record.outTime !== null) {

                    //     if (e.multipleClockInClockOut === 'yes') {
                    //         let timeSchedule = await myFunc.getEmployeeWiseOfficeSchedule(e.id, x.crtDate, db)

                    //         if (timeSchedule) {

                    //             //multiple clock in clock out working hour
                    //             let officeClockInTime = timeSchedule ? timeSchedule.clockInTime : null
                    //             let officeClockOutTime = timeSchedule ? timeSchedule.clockOutTime : null
                    //             let officeLunchInTime = timeSchedule ? timeSchedule.lunchIn : null
                    //             let officeLunchOutTime = timeSchedule ? timeSchedule.lunchOut : null
                    //             let minWorkingHour = timeSchedule ? timeSchedule.minWorkingHour : null

                    //             let baseDate = x.crtDate

                    //             let officeclockIn = new Date(`${baseDate} ${officeClockInTime}`).getTime()
                    //             let officeclockOut = new Date(`${baseDate} ${officeClockOutTime}`).getTime()
                    //             let officelunchIn = new Date(`${baseDate} ${officeLunchInTime}`).getTime()
                    //             let officelunchOut = new Date(`${baseDate} ${officeLunchOutTime}`).getTime()


                    //             let officetotalWorkHours = '00:00'


                    //             if (officeclockIn && officeclockOut && officeclockOut > officeclockIn) {
                    //                 let officetotalWorkSeconds = officeclockOut - officeclockIn

                    //                 if (officelunchIn && officelunchOut && officelunchOut > officelunchIn) {
                    //                     let officelunchSeconds = officelunchOut - officelunchIn
                    //                     officetotalWorkSeconds -= officelunchSeconds
                    //                 }

                    //                 officetotalWorkHours = moment.utc(officetotalWorkSeconds).format("HH:mm");
                    //             }

                    //             let multipleworkHours = await myFunc.getMultiAttendanceWorkingHour(e.id, record.date, officetotalWorkHours, officelunchIn, officelunchOut, minWorkingHour, x.intime, x.outTime, record.startLunch, record.endLunch, db)



                    //             let multiWorkingHrs
                    //             if (multipleworkHours.multi === 'no') {


                    //                 x.workingHrs = myFunc.calculateWorkingHours(multipleworkHours.intime, multipleworkHours.outime)
                    //                 x.breakHours = myFunc.subtractTime(multipleworkHours.startLunch, multipleworkHours.endLunch)
                    //                 timeArr.push(x.workingHrs)
                    //                 breakArr.push(x.breakHours)
                    //             }
                    //             else {

                    //                 if (multipleworkHours.totalBreakHourMillis === 0) {
                    //                     let lunchBreakHours = officelunchOut - officelunchIn
                    //                     x.breakHours = moment.utc(lunchBreakHours).format('HH:mm')
                    //                     if (multipleworkHours.totalWorkingHoursMillis > lunchBreakHours) {

                    //                         multiWorkingHrs = moment.utc(multipleworkHours.totalWorkingHoursMillis - lunchBreakHours).format("HH:mm")
                    //                     }
                    //                     else {
                    //                         multiWorkingHrs = moment.utc(multipleworkHours.totalWorkingHoursMillis).format("HH:mm")


                    //                     }


                    //                 }
                    //                 else {
                    //                     x.breakHours = moment.utc(multipleworkHours.totalBreakHourMillis).format('HH:mm')
                    //                     multiWorkingHrs = moment.utc(multipleworkHours.totalWorkingHoursMillis - multipleworkHours.totalBreakHourMillis).format("HH:mm")
                    //                 }
                    //                 x.workingHrs = multiWorkingHrs
                    //                 timeArr.push(x.workingHrs)
                    //                 breakArr.push(x.breakHours)
                    //             }
                    //         }
                    //     }

                    //     else {

                    //         x.workingHrs = myFunc.calculateWorkingHours(x.intime, x.outTime)
                    //         timeArr.push(x.workingHrs)
                    //         breakArr.push(x.breakHours)

                    //     }
                    // }
                    // if (record.intime && record.outTime) {
                    //     if (e.multipleClockInClockOut === 'yes') {
                    //         const schedule = await myFunc.getEmployeeWiseOfficeSchedule(e.id, x.crtDate, db);
                    //         if (!schedule) return;

                    //         const { clockInTime, clockOutTime, lunchIn, lunchOut, minWorkingHour } = schedule;
                    //         const baseDate = x.crtDate;

                    //         const toMillis = time => new Date(`${baseDate} ${time}`).getTime();

                    //         const officeIn = toMillis(clockInTime);
                    //         const officeOut = toMillis(clockOutTime);
                    //         const lunchInMillis = toMillis(lunchIn);
                    //         const lunchOutMillis = toMillis(lunchOut);

                    //         let totalWorkMillis = officeOut > officeIn ? officeOut - officeIn : 0;
                    //         if (lunchOutMillis > lunchInMillis) totalWorkMillis -= (lunchOutMillis - lunchInMillis);

                    //         const officetotalWorkHours = moment.utc(totalWorkMillis).format("HH:mm");

                    //         const multi = await myFunc.getMultiAttendanceWorkingHour(
                    //             e.id, record.date, officetotalWorkHours,
                    //             lunchInMillis, lunchOutMillis, minWorkingHour,
                    //             x.inTime, x.outTime, record.startLunch, record.endLunch, db
                    //         );

                    //         let workingHrs, breakHrs;

                    //         if (multi.multi === 'no') {
                    //             workingHrs = myFunc.calculateWorkingHours(multi.intime, multi.outime);
                    //             breakHrs = myFunc.subtractTime(multi.startLunch, multi.endLunch);
                    //         } else {
                    //             const breakMillis = multi.totalBreakHourMillis || (lunchOutMillis - lunchInMillis);
                    //             breakHrs = moment.utc(breakMillis).format("HH:mm");

                    //             const netWorkMillis = multi.totalWorkingHoursMillis > breakMillis
                    //                 ? multi.totalWorkingHoursMillis - breakMillis
                    //                 : multi.totalWorkingHoursMillis;

                    //             workingHrs = moment.utc(netWorkMillis).format("HH:mm");
                    //         }

                    //         x.workingHrs = workingHrs;
                    //         x.breakHours = breakHrs;
                    //         timeArr.push(workingHrs);
                    //         breakArr.push(breakHrs);
                    //     } else {
                    // x.workingHrs = myFunc.calculateWorkingHours(x.inTime, x.outTime);
                    // timeArr.push(x.workingHrs);
                    //         breakArr.push(x.breakHours);
                    //     }
                    // }

                    if (record.lensDeviceName) {
                        x.deviceName = record.lensDeviceName
                    }

                }

                if (attendanceApproveMap.has(x.crtDate)) {
                    let record = attendanceApproveMap.get(x.crtDate)
                   
                    if (record.type === 'full') {
                        x.title = 'Present'
                        x.backcolor = "#a4eab0"
                        x.attStatus = 'P'
                        e.totalPresent++
                    }
                    else if (record.type == "reject" && record.remarks != "AB LEAVE" && record.remarks != "First Half" && record.remark != "Second Half") {
                        x.title = 'Absent'
                        x.backcolor = "#f1bcbc"
                        x.attStatus = 'AB'
                        e.totalReject++
                        e.totalAbsent++
                    }
                    else if (record.type == "half") {
                        x.attStatus = "H"
                        x.backcolor = "#b1b82c"
                        x.title = "Halfday";
                        e.totalHalfDay++
                    }
                    else if (record.leaveTypeId && record.type === 'holiday' && record.remarks === 'L LEAVE' && record.leaveTypeId !== '') {
                        let leaveResult = await myFunc.leaveType(record.leaveTypeId, db)
                        x.attStatus = leaveResult.prefix
                        x.backcolor = leaveResult.colorCode
                        x.title = leaveResult.name
                        e.totalPaidLeave++

                        if (record.flagRemarks == "ForLateClockIn") {
                            x.title = " For Late ClockIn";

                        }
                    }
                    else if (record.type == "holiday" && record.remarks == "L LEAVE" && record.leaveTypeId == '') {
                        x.attStatus = "D-PL"
                        x.backcolor = "#85eaea"
                        x.title = "Default Paid Leave";
                        e.totalPaidLeave++
                    }
                    else if (record.type == "reject" && record.remarks == "AB LEAVE") {
                        x.attStatus = "UL"
                        x.backcolor = "#f17171"
                        x.title = "Unpaid Leave";
                        e.totalUnpaidLeave++
                    }
                    else if (record.type == 'holiday' && record.remarks == 'First Half' || record.remarks == 'Second Half') {
                        x.attStatus = 'HD-PL'
                        x.backcolor = '#ffa742'
                        x.title = 'Halfday Paid Leave';
                        e.totalHalfdayPaidLeave++
                    }
                    else if (record.type == 'reject' && record.remarks == 'First Half' || record.remarks == 'Second Half') {
                        x.attStatus = 'HD-UL'
                        x.backcolor = '#b0f320'
                        x.title = 'Halfday unpaid Leave';
                        e.totalHalfdayunpaidLeave++
                    }
                    else if (record.type == 'holiday' && record.remarks != 'L LEAVE' && record.remarks != 'First Half' && record.remarks != 'Second Half') {
                        x.attStatus = 'MHD'
                        x.backcolor = '#ccffcc'
                        x.title = 'Marked as Holiday';
                        e.totalMarkedAsHoliday++
                    }
                    else if (record.type == "sunday reject") {
                        x.attStatus = "AB"
                        x.backcolor = "#f1bcbc"
                        x.title = "Absent";
                        e.totalReject++
                        e.totalAbsent++
                    }

                }
                else {

                    x.attStatus = "-";
                    x.backcolor = "#fff";
                    x.title = "";


                    if (x.type === 'lens') {

                        x.backcolor = "#adcdff";

                    }
                    else if (companyHolidayModel.some(obj => obj.date === x.crtDate)) {
                        // x.attStatus = 'CH'
                        x.backcolor = "#09ff00";
                        x.title = 'Company Holiday'
                        e.totalHoliDay++
                    }
                    else if (sqlFixHodiday.some(obj => obj.day === x.day)) {
                        x.attStatus = '-'
                        x.backcolor = "#e8e4e4";
                        x.title = 'Off Day'
                        e.totalOffDay++
                        // sundayCount++

                    }
                    else if (additionalWeeklyOffDay.includes(x.crtDate)) {
                        x.attStatus = '-'
                        x.backcolor = "#e8e4e4"
                        x.title = 'Off Day'
                        e.totalOffDay++
                        // sundayCount++
                    }
                    else if (getRoasterWiseOffday.includes(x.crtDate)) {
                        x.attStatus = '-'
                        x.backcolor = "#e8e4e4"
                        x.title = 'Off Day'
                        e.totalOffDay++
                        // sundayCount++
                    }

                }

            }))


            e.totalWorkingHrs = myFunc.addTimes(timeArr)
            e.totalBreakHrs = myFunc.addTimes(breakArr)
            const rejectSundayModel = await db.query(

                `   select count(*) as totalRejectSundays
                        from eve_acc_employee_attendence_approved
                        where status='A'
                        and employeeId=:employeeId
                        AND date BETWEEN :fromDate AND :toDate
                        and isRejectSunday='yes'
                                  `, {
                replacements: {
                    employeeId: e.id,
                    fromDate: fromDate,
                    toDate: toDate,


                }, type: QueryTypes.SELECT
            }
            )

            let totalRejectedSundays = rejectSundayModel[0].totalRejectSundays


            e.totalRejectedSundays += parseFloat(totalRejectedSundays)

            let totalNonPayableDay = e.totalReject + ((e.totalHalfDay) / 2) + e.totalUnpaidLeave + ((e.totalHalfdayunpaidLeave) / 2) + totalRejectedSundays
            let totalNetPaidDays = noOfdaysInMonth - totalRejectedSundays - totalNonPayableDay
            e.totalNetPaidDays = totalNetPaidDays

            const creditSettingModel = await db.query(
                `
                        select creadit_month,used from eve_self_registration where status='A' and empId=:empId
                        and mm=:month
                        and yyyy=:year
                        `, {
                replacements: {
                    empId: e.id, year: year, month: month,
                }, type: QueryTypes.SELECT
            }
            )

            if (creditSettingModel.length > 0) {
                e.totalCredit = creditSettingModel[0].creadit_month
                e.totalUsed = creditSettingModel[0].used
            }
            else {
                e.totalCredit = 0
                e.totalUsed = 0
            }

            const attendaneCountModel = await db.query(
                `
                      SELECT SUM(attendanceCount) AS totalAttendance
                       from eve_acc_employee_attendence_approved
                        where status='A'
                        and employeeId=:employeeId
                        AND date BETWEEN :fromDate AND :toDate
                        `, {
                replacements: {
                    employeeId: e.id,
                    fromDate: fromDate,
                    toDate: toDate,
                }, type: QueryTypes.SELECT
            }
            )

            let attendanceCount
            if (attendaneCountModel.length > 0) {
                attendanceCount = attendaneCountModel[0].totalAttendance
            }
            if (attendanceCount == null || attendanceCount == undefined || attendanceCount == '') {
                attendanceCount = 0
            }


            for (let i = 0; i < noOfdaysInMonth && i < app.length; i++) {
                const x = app[i];
                if (x.isSunday === true) {
                    num_sundays++
                }

            }
            attendanceCount += num_sundays


            //     // attendanceCount += sundayCount
            e.extraDutySalary = await getExtraDutyAmountByEmployeeIdDatewise(e.id, fromDate, toDate, noOfdaysInMonth, e.salaryTemplateId, db)
            e.overtimeAmount = await getOvertimeAmountByEmployeeIdDatewise(e.id, fromDate, toDate, noOfdaysInMonth, e.salaryTemplateId, db) || ''



            const sql1 = await db.query(
                `
                select sum(salaryAmount) as amount1 from eve_acc_set_monthly_salary_employee_wise
                where employeeId=:employeeId
                and isApplicable='yes'
                and type='deduction'
                and status='A'

                `, {
                replacements: {
                    employeeId: e.id,

                }, type: QueryTypes.SELECT

            })


            let fixedDeduct = parseFloat(sql1[0]?.amount1 || 0);





            const sql2 = await db.query(
                `
                    select sum(salaryAmount) as amount2 from eve_acc_set_monthly_salary_employee_wise
                    where employeeId=:employeeId
                    and isApplicable='yes'
                    and type='addition'
                    and status='A'

                    `, {
                replacements: {
                    employeeId: e.id,

                }, type: QueryTypes.SELECT

            })

            let fixedAdd = parseFloat(sql2[0]?.amount2 || 0);

            let fixedTotal = fixedAdd - fixedDeduct;
            e.totalPayableOffDay = (e.totalOffDay - e.totalRejectedSundays)
            e.totalPaidHoliday=e.totalPayableOffDay+e.totalHoliday+e.totalMarkedAsHoliday




            let totalMonthlySalary = fixedTotal;

            let amount = totalMonthlySalary / noOfdaysInMonth * attendanceCount

            e.dailyEarning = myFunc.formatAmount((parseFloat(amount)) + (e.extraDutySalary) + (e.overtimeAmount))

        }))



        return res.status(200).json({
            status: true,
            recordPerPage: limit, currentPage: pageNo,
            totalData: totalData,
            // totalData: totalData,
            // totalApprove: myFunc.formatAmount(totalApprove),
            // totalPaid: myFunc.formatAmount(totalPaid),
            // totalUnpaid: myFunc.formatAmount(totalUnpaid),
            employee: getData,
            // employee: myFunc.replaceEmptyValues(excelData)
        })
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMonthlyAttendanceReportDateWise, }

async function additionalWeeklyOffDayForDaywise(empBranchId, fromDate, toDate, db) {
    const sqlCompanyHldy = await db.query(`
        SELECT day, weeks 
        FROM eve_acc_company_weekly_holiday 
        WHERE status = "A" AND branchId = :branchId
        AND day IS NOT NULL
    `, {
        replacements: { branchId: empBranchId },
        type: QueryTypes.SELECT
    });

    const weekMap = {
        '1st': 1,
        '2nd': 2,
        '3rd': 3,
        '4th': 4,
        '5th': 5,
    };

    const dayMap = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
    };

    const finalDates = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);

    sqlCompanyHldy.forEach(rule => {
        const targetDay = dayMap[rule.day];
        const targetWeeks = rule.weeks.split(',').map(w => weekMap[w.trim()]);

        let current = new Date(start);
        while (current <= end) {
            if (current.getDay() === targetDay) {
                // Determine week number of this weekday in its month
                const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
                let weekCount = 0;
                let temp = new Date(firstDayOfMonth);

                while (temp <= current) {
                    if (temp.getDay() === targetDay) {
                        weekCount++;
                    }
                    temp.setDate(temp.getDate() + 1);
                }

                if (targetWeeks.includes(weekCount)) {
                    const yyyy = current.getFullYear();
                    const mm = String(current.getMonth() + 1).padStart(2, '0');
                    const dd = String(current.getDate()).padStart(2, '0');
                    finalDates.push(`${yyyy}-${mm}-${dd}`);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    });

    return finalDates;
}

async function getExtraDutyAmountByEmployeeIdDatewise(employeeId, startDate, endDate, totalDaysInMonth, salaryTemplateId, db) {


    let compOffAmount = 0;
    let extraDutyOffPaidAct = await moduleActivation('extra_duty_off_paid', db);

    if (extraDutyOffPaidAct === 'yes') {
        const extraDutyModel = await db.query(`
              SELECT * FROM eve_acc_extra_duty_encashment_calculation_setting
              WHERE status = 'A' AND salaryTemplateId = :salaryTemplateId
          `, {
            replacements: { salaryTemplateId },
            type: QueryTypes.SELECT
        });

        let totalComponentWiseAmount = 0;

        if (extraDutyModel.length > 0) {
            let salaryComponentArr = extraDutyModel[0].salaryComponents.split(',');

            await Promise.all(
                salaryComponentArr.map(async (e) => {
                    const salaryEmpWiseModel = await db.query(`
                          SELECT salaryAmount FROM eve_acc_set_monthly_salary_employee_wise
                          WHERE status = 'A' AND salaryTempId = :salaryTempId
                            AND employeeId = :employeeId AND salaryId = :salaryId
                      `, {
                        replacements: {
                            salaryTempId: salaryTemplateId,
                            employeeId,
                            salaryId: e
                        },
                        type: QueryTypes.SELECT
                    });

                    if (salaryEmpWiseModel.length > 0) {
                        let salaryAmount = salaryEmpWiseModel[0].salaryAmount;
                        if (salaryAmount != null && salaryAmount !== '') {
                            totalComponentWiseAmount += parseFloat(salaryAmount);
                        }
                    }
                })
            );

            let dailyComponentWiseAmount = totalComponentWiseAmount / totalDaysInMonth;

            const extraDutyOffPaidModel = await db.query(`
                  SELECT SUM(countDays) AS totalCompOffDays
                  FROM eve_acc_employee_extra_duty_alocation
                  WHERE status = 'A' AND empId = :empId
                    AND workDate >= :startDate AND workDate <= :endDate
              `, {
                replacements: {
                    empId: employeeId,
                    startDate,
                    endDate
                },
                type: QueryTypes.SELECT
            });

            let totalCompOffDays = parseFloat(extraDutyOffPaidModel[0].totalCompOffDays || 0);

            const extraDutyMasterModel = await db.query(`
                  SELECT * FROM eve_acc_extra_duty_master_setting
                  WHERE status = 'A'
                  ORDER BY id DESC
              `, {
                type: QueryTypes.SELECT
            });

            let maxCompOffPaidDays = parseFloat(extraDutyMasterModel[0].maxCompOffPaidDays || 0);
            let daysPaidForPerDayCompOff = parseFloat(extraDutyMasterModel[0].daysPaidForPerDayCompOff || '1');

            totalCompOffDays = Math.min(totalCompOffDays, maxCompOffPaidDays);

            compOffAmount = Math.round(totalCompOffDays * daysPaidForPerDayCompOff * dailyComponentWiseAmount);
        }
    }

    return compOffAmount;
}

async function getOvertimeAmountByEmployeeIdDatewise(employeeId, startDate, endDate, totalDaysInMonth, tempId, db) {

    let overtimeTotalAmount = 0;
    let getTotalHours = 0;
    let getTotalHours2 = 0;
    let getTotalMinutes2 = 0;
    let getTotalMinutes = 0;
    let totalApprovehour = 0;
    let totalApprovehour1 = 0;
    let totalApprovehour2 = 0;
    let amount = 0;
    let overTime_InMinute = 0;
    let overTime_InMinute1 = 0;
    let shiftHours = 0;
    let minWorkHrs = 0;
    let minWorkHrsMin = 0;
    let totalhrs = 0;
    let totalmin = 0;
    let clockIn = '00:00';
    let clockOut = '00:00';
    let noOfTimes

    const sqlEmpDetails = await db.query(
        `
                              SELECT id FROM eve_acc_employee
                              WHERE status='A'
                              AND isOvertimeApplicable='yes'
                              AND id=:id

        `, {
        replacements: {
            id: employeeId

        }, type: QueryTypes.SELECT
    }
    )
    
    
    if (sqlEmpDetails.length > 0) {
        
        const sqlAttnApp = await db.query(
            `
            SELECT * FROM eve_acc_employee_overtime_approved
            where employeeId=:employeeId
            and status='A'
            and type='Approve'
            and date >= :startDate
            and date <= :endDate
            
            `, {
                replacements: {
                    
                    employeeId: employeeId,
                    startDate: startDate,
                    endDate: endDate,
                    
                }, type: QueryTypes.SELECT
            }
        )
        
        
        
        if (sqlAttnApp.length > 0) {
            
            await Promise.all(sqlAttnApp.map(async (x) => {
                
                if (x.editOTday != '' && x.editOTday != null) {
                    getTotalHours += parseInt(x.editOTday.split(':')[0])
                    
                    getTotalMinutes += parseInt(x.editOTday.split(':')[1])
                    totalApprovehour1 = getTotalHours * 60 + getTotalMinutes
                }
                else {
                    if (x.workingHour && myFunc.isValidWorkingHour(x.workingHour)) {
                         getTotalHours += parseInt(x.workingHour.split(':')[0])
                         getTotalMinutes += parseInt(x.workingHour.split(':')[1])

                     }
                    
                    totalApprovehour1 = getTotalHours * 60 + getTotalMinutes
                }
                  
                
            }))
           

            const sqlEmpList = await db.query(

                `
                SELECT attendanceType,shiftId 
                FROM eve_hrm_employee_details
                WHERE status='A'
                AND employeeId=:employeeId
                AND attendanceType IS NOT NULL
                
                `, {
                replacements: {
                    employeeId: employeeId,

                }, type: QueryTypes.SELECT
            }
            )
            if (sqlEmpList.length > 0) {
                if (sqlEmpList[0]['attendanceType'] === 'shift_wise') {
                    const sqlShift = await db.query(
                        `
                        SELECT * FROM eve_hrm_employee_shift_master
                        WHERE id=:id
                        AND status='A'
                        
                        `, {
                        replacements: {
                            id: sqlEmpList[0]['shiftId']
                        }, type: QueryTypes.SELECT
                    }
                    )

                    clockIn = sqlShift[0]['clockInTime']
                    clockOut = sqlShift[0]['clockOutTime']


                }
                // }
                else if (sqlEmpList[0]['attendanceType'] === 'customize') {
                    const sqlShiftCustomise = await db.query(
                        `
                    SELECT * FROM 
                    eve_hrm_employee_shift_customize
                    WHERE status='A'
                    AND employeeId=:employeeId
                    `, {
                        replacements: {
                            employeeId: employeeId
                        }, type: QueryTypes.SELECT
                    }
                    )

                    clockIn = sqlShiftCustomise[0]['clockInTime']
                    clockOut = sqlShiftCustomise[0]['clockOutTime']

                }

                else if (sqlEmpList[0]['attendanceType'] === 'roaster') {
                    const sqlRoasater = await db.query(
                        `
                    SELECT * FROM 
                    eve_hrm_employee_roaster
                    WHERE status='A'
                    AND employeeId=:employeeId
                    `, {
                        replacements: {
                            employeeId: employeeId
                        }, type: QueryTypes.SELECT
                    }
                    )

                    await Promise.all(sqlRoasater.map(async e => {
                        const sqlShiftDetails = await db.query(
                            `
                            select * from eve_hrm_employee_shift_master
                            where id=:id
                            and status='A'
                            `, {
                            replacements: {
                                id: e.shiftId
                            }, type: QueryTypes.SELECT
                        }
                        )
                        clockIn = sqlShiftDetails[0]['clockInTime'];

                        clockOut = sqlShiftDetails[0]['clockOutTime'];

                    }))

                }
            }


            const overtimeSql = await db.query(
                `
                select * from eve_overtime_rate_settings
                where status='A'
                and salaryComponent is not null
                and tempId=:tempId

                `, {
                replacements: {
                    tempId: tempId

                }, type: QueryTypes.SELECT
            }
            )


            if (overtimeSql.length > 0) {

                await Promise.all(overtimeSql.map(async e => {
                    let templateId = e.tempId
                    noOfTimes = e.noOfTimes !== null ? parseFloat(e.noOfTimes) : 1
                    let salaryComponent = (e.salaryComponent).split(',')

                    await Promise.all(salaryComponent.map(async x => {
                        const overtimeSql2 = await db.query(
                            `
                            select * from eve_acc_set_monthly_salary_employee_wise
                            where status='A'
                            and salaryTempId=:salaryTempId
                            and salaryId=:salaryId
                            and employeeId=:employeeId
                            `, {
                            replacements: {
                                salaryTempId: templateId,
                                salaryId: x,
                                employeeId: employeeId,
                            }, type: QueryTypes.SELECT
                        }
                        )


                        // if(overtimeSql2.length>0){

                        //     if(overtimeSql2[0].salaryTempId===templateId){
                        //         noOfTimes=overtimeSql[0].noOfTimes

                        // }
                        // }


                        if (overtimeSql2.length > 0) {
                            await Promise.all(overtimeSql2.map(async z => {
                                amount += parseFloat(z.salaryAmount)

                            }))
                        }
                    }))
                }))
            }

            let soutHrs = parseInt(clockOut.split(':')[0])
            let soutmin = parseInt(clockOut.split(':')[1])
            let sinhrs = parseInt(clockIn.split(':')[0])
            let sinmin = parseInt(clockIn.split(':')[1])


            let cheoutTotalMin = soutHrs * 60 + soutmin
            let cheinTotalMin = sinhrs * 60 + sinmin

            let shiftTotalMin = cheoutTotalMin - cheinTotalMin
            shiftHours = shiftTotalMin / 60;


            let totalApproveHourApp = myFunc.hoursAndMins(totalApprovehour1)



            let hrsApp = totalApproveHourApp.split(':')

            let appHrs = hrsApp[0]
            let appMin = hrsApp[1]
            if (appMin > 30) {
                totalApprovehour = parseInt(appHrs + 1)
            }
            else {
                totalApprovehour = parseInt(appHrs)
            }




            overtimeTotalAmount = ((amount / totalDaysInMonth / shiftHours * noOfTimes) * totalApprovehour)


        }
        else {
            overtimeTotalAmount = 0
        }

    }
    else {
        overtimeTotalAmount = 0
    }
    return overtimeTotalAmount

}

async function moduleActivation(name, db) {
    let module = await db.query('select status from eve_acc_module_activation_master where name=:name', {
        replacements: {
            name: name,
        }, type: QueryTypes.SELECT
    })
    if (module[0]) {
        let res = Object.values(module[0])
        let newRes = res.toString()
        return newRes
    } else {
        return ''
    }
}

