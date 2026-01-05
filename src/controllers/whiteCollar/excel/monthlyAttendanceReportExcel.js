let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')
const moment = require('moment')

async function moduleActivation(name, db) {
    let module = await db.query('select status from eve_acc_module_activation_master where name=:name', {
        replacements: {
            name: name,
        }, type: QueryTypes.SELECT
    })
    if (module[0]) {
        let res = Object.values(module[0])
        let newRes = res.toString()
        if (newRes == 'A') {
            newRes = 'yes'
        } else {
            newRes = 'no'
        }
        return newRes
    }
}
function hoursAndMins(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function getExtraDutyAmountByEmployeeId(employeeId, month, year, salaryTemplateId, db) {

    let totalDaysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
    let startDate = moment(`${year}-${month}-01`).format('YYYY-MM-DD');
    let endDate = moment(`${year}-${month}-${totalDaysInMonth}`).format('YYYY-MM-DD');

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

const getMonthlyAttendanceReportExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        // console.log(decodedToken);
        
        // let db1 = sequelize()

        // const tokenUserId = '29'
        // const tokenCompanyId = '59'
        // const tokenBranchId = '75'
        // let db = sequelize('59')
        // let db1 = sequelize()

        let data = req.body
        const { year, month, branchId, empCode, empname, locationId, subCompanyId } = data


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
                         select a.id,a.employeeName,
                         a.employeeSubCompanyId,
                         a.employeeCode,
                         a.employeeDoj,
                         a.locationID,
                         a.employeeBranchId,
                         a.isOvertimeApplicable,
                         a.salaryTemplateId,a.multipleClockInClockOut

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

                            ORDER BY a.employeeName asc
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

        const daysInCurrentMonth = myFunc.getDaysInMonth(year, month)
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        let startDate = moment(`${year}-${month}-01`).format('YYYY-MM-DD');
        let endDate = moment(`${year}-${month}-${NoOfdaysInMonth}`).format('YYYY-MM-DD');

        //  const app = [];
        //     for (let i = 1; i <= NoOfdaysInMonth; i++) {

        //         let number = i.toString().padStart(2, '0');
        //         let newObj = {
        //             crtDate: `${year}-${month}-${number}`,
        //             day: moment(`${year}-${month}-${number}`).format('dddd'),
        //             inTime: '--',
        //             outTime: '--',
        //             workingHrs: '--',
        //             breakHours:'--',
        //             type: '--',
        //             attStatus: '--',
        //             isSunday: false,
        //             deviceName: '',
        //         };

        //         app.push(newObj);
        //     }

        await Promise.all(getData.map(async (e, i) => {
            e.slno = i + 1

            e.locationName = await myFunc.getLocationNameById(e.locationID, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            const app = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    day: moment(`${year}-${month}-${number}`).format('dddd'),
                    inTime: '--',
                    outTime: '--',
                    workingHrs: '--',
                    breakHours: '--',
                    type: '--',
                    attStatus: '--',
                    isSunday: false,
                    deviceName: '',
                };

                app.push(newObj);
            }


            e.app = app

            const attendanceModel = await db.query(

                `
                    select date,intime,outTime,lensDeviceName,startLunch,endLunch
                    from eve_acc_employee_attendence
                    where status='A'
                    
                    and empId=:empId
                    and month(date)=:month
                    and year(date)=:year
                    -- and (intime is not null and outTime is not null)
                    `, {
                replacements: {
                    empId: e.id,
                    year: year,
                    month: month,


                }, type: QueryTypes.SELECT
            }
            )

            const attendanceApproveModel = await db.query(

                `
                    select date,type,remarks,leaveTypeId,flagRemarks
                    from eve_acc_employee_attendence_approved
                    where status='A'
                    
                    and employeeId=:employeeId
                    and month(date)=:month
                    and year(date)=:year
                    `, {
                replacements: {
                    employeeId: e.id,
                    year: year,
                    month: month,


                }, type: QueryTypes.SELECT
            }
            )
            const companyHolidayModel = await db.query(
                `
                    select date
                    from eve_acc_company_holiday
                    where status='A'
                    and branchId=:branchId
                    and month(date)=:month
                    and year(date)=:year

                    `, {
                replacements: {

                    branchId: e.employeeBranchId,
                    year: year,
                    month: month,

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



            //additionalWeeklyOffDay
            e.additionalWeeklyOffDay = {
                day: null,
                weeklyHolidayArray: []
            }


            const companyWeeklyHolidayDb = await db.query(
                `
                    select day,weeks from eve_acc_company_weekly_holiday where status="A"
                    and branchId=:branchId
                    `, {
                replacements: {
                    branchId: e.employeeBranchId,

                }, type: QueryTypes.SELECT
            })

            if (companyWeeklyHolidayDb.length > 0) {
                e.additionalHoliday = companyWeeklyHolidayDb[0].day
            }
            if (companyWeeklyHolidayDb.length > 0) {


                let options = {
                    month: month,
                    year: year,
                    dayName: companyWeeklyHolidayDb[0].day
                        ? companyWeeklyHolidayDb[0].day.toLowerCase()
                        : '',
                }
                e.additionalWeeklyOffDay.day = companyWeeklyHolidayDb[0].day
                // e.additionalWeeklyOffDay=companyWeeklyHolidayDb[0].day
                if (typeof (companyWeeklyHolidayDb[0].weeks) == "string" && companyWeeklyHolidayDb[0].weeks !== "null") {
                    let weeksArray = companyWeeklyHolidayDb[0].weeks.split(',')


                    for (let k = 0; k < weeksArray.length; k++) {

                        options.dayNoStr = weeksArray[k]
                        e.additionalWeeklyOffDay.weeklyHolidayArray.push(myFunc.weeklyHolidayArrayFn(options))

                    }

                }
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
            e.totalPaidHoliday = 0
            let num_sundays = 0
            let fixWeeklyOffDay = await myFunc.getFixWeeklyOffDay(e.id, e.employeeBranchId, db)
            let additionalWeeklyOffDay = await myFunc.additionalWeeklyOffDay(e.employeeBranchId, year, month, db)
            let getRoasterWiseOffday = await myFunc.getRoasterWiseOffday(e.id, startDate, endDate, db)


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

                    const schedule = await myFunc.getEmployeeWiseOfficeSchedule(e.id, record.date, db);




                    if (record.intime && record.outTime) {
                        if (e.multipleClockInClockOut === 'yes') {

                            // if (!schedule) return;

                            let { clockInTime, clockOutTime, lunchIn, lunchOut, minWorkingHour } = schedule;
                            const baseDate = record.date;

                            const toMillis = time => new Date(`${baseDate} ${time}`).getTime();

                            lunchIn = lunchIn === ':' ? 0 : lunchIn
                            lunchOut = lunchOut === ':' ? 0 : lunchOut

                            const officeIn = toMillis(clockInTime);
                            const officeOut = toMillis(clockOutTime);
                            let lunchInMillis = toMillis(lunchIn);
                            let lunchOutMillis = toMillis(lunchOut);

                            let totalWorkMillis = officeOut > officeIn ? officeOut - officeIn : 0;
                            if (lunchOutMillis > lunchInMillis) totalWorkMillis -= (lunchOutMillis - lunchInMillis);

                            const officetotalWorkHours = moment.utc(totalWorkMillis).format("HH:mm");

                            const multi = await myFunc.getMultiAttendanceWorkingHour(
                                e.id, record.date, officetotalWorkHours,
                                lunchInMillis, lunchOutMillis, minWorkingHour,
                                record.intime, record.outTime, record.startLunch, record.endLunch, db
                            );


                            // console.log(multi);
                            let workingHrs, breakHrs;
                            let validate

                            if (multi.startLunch !== null && multi.endLunch !== null) {

                                validate = isLunchInBetween(multi.outime, multi.endLunch)
                                if (!validate) {
                                    multi.totalBreakHourMillis = 0
                                    lunchOutMillis = 0
                                    lunchInMillis = 0
                                }
                                //      let a=isLunchInBetween1(multi.intime,multi.outime,multi.startLunch)


                                // if(a==false){
                                //     multi.totalBreakHourMillis = 0
                                //     lunchOutMillis=0
                                //     lunchInMillis=0
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


                            x.workingHrs = workingHrs;
                            if (multi.key === 'single') {

                                x.breakHours = breakHrs;
                                breakArr.push(breakHrs);
                            }
                            else {
                                let inOutDiff = myFunc.calculateWorkingHours(record.intime, record.outTime)
                                let break1 = myFunc.calculateWorkingHours(workingHrs, inOutDiff)
                                x.breakHours = break1
                                breakArr.push(break1);
                            }

                            timeArr.push(workingHrs);
                        }
                        else {
                            x.workingHrs = myFunc.calculateWorkingHours(x.inTime, x.outTime);
                            timeArr.push(x.workingHrs);
                            breakArr.push(x.breakHours);
                        }
                    }
                    if (record.lensDeviceName) {
                        x.deviceName = record.lensDeviceName
                    }

                }

                if (attendanceApproveMap.has(x.crtDate)) {
                    let record = attendanceApproveMap.get(x.crtDate)
                    if (record.type === 'full') {
                        x.title = 'Present'
                        x.attStatus = 'P'
                        e.totalPresent++
                    }
                    else if (record.type == "reject" && record.remarks != "AB LEAVE" && record.remarks != "First Half" && record.remark != "Second Half") {
                        x.title = 'Absent'
                        x.attStatus = 'AB'
                        e.totalReject++
                        e.totalAbsent++
                    }
                    else if (record.type == "half") {
                        x.attStatus = "H"
                        x.title = "Halfday";
                        e.totalHalfDay++
                    }
                    else if (record.leaveTypeId && record.type === 'holiday' && record.remarks === 'L LEAVE' && record.leaveTypeId !== '') {
                        let leaveResult = await myFunc.leaveType(record.leaveTypeId, db)
                        x.attStatus = leaveResult.prefix
                        x.title = leaveResult.name
                        e.totalPaidLeave++

                        if (record.flagRemarks == "ForLateClockIn") {
                            x.title = " For Late ClockIn";

                        }
                    }
                    else if (record.type == "holiday" && record.remarks == "L LEAVE" && record.leaveTypeId == '') {
                        x.attStatus = "D-PL"
                        x.title = "Default Paid Leave";
                        e.totalPaidLeave++
                    }
                    else if (record.type == "reject" && record.remarks == "AB LEAVE") {
                        x.attStatus = "UL"
                        x.title = "Unpaid Leave";
                        e.totalUnpaidLeave++
                    }
                    else if (record.type == 'holiday' && record.remarks == 'First Half' || record.remarks == 'Second Half') {
                        x.attStatus = 'HD-PL'
                        x.title = 'Halfday Paid Leave';
                        e.totalHalfdayPaidLeave++
                    }
                    else if (record.type == 'reject' && record.remarks == 'First Half' || record.remarks == 'Second Half') {
                        x.attStatus = 'HD-UL'
                        x.title = 'Halfday unpaid Leave';
                        e.totalHalfdayunpaidLeave++
                    }
                    else if (record.type == 'holiday' && record.remarks != 'L LEAVE' && record.remarks != 'First Half' && record.remarks != 'Second Half') {
                        x.attStatus = 'MHD'
                        x.title = 'Marked as Holiday';
                        e.totalMarkedAsHoliday++
                    }
                    else if (record.type == "sunday reject") {
                        x.attStatus = "AB"
                        x.title = "Absent";
                        e.totalReject++
                        e.totalAbsent++
                    }

                }
                else {

                    x.attStatus = "-";
                    x.title = "";
                    if (companyHolidayModel.some(obj => obj.date === x.crtDate)) {
                        x.attStatus = 'CH'
                        x.title = 'Company Holiday'
                        e.totalPaidHoliday++
                    }
                    else if (sqlFixHodiday.some(obj => obj.day === x.day)) {
                        x.attStatus = 'fixWeeklyOffDay'
                        x.title = 'Off Day'
                        e.totalPaidHoliday++
                        // sundayCount++

                    }
                    else if (e.additionalWeeklyOffDay.weeklyHolidayArray.includes(moment(x.crtDate).format('DD'))) {
                        x.attStatus = '-'
                        x.title = 'Off Day'
                        e.totalPaidHoliday++
                        // sundayCount++
                    }

                }

            }))

            let totalDays = myFunc.getDaysPassedInMonth(year, month)






            e.totalWorkingHrs = myFunc.addTimes(timeArr)
            e.totalBreakHrs = myFunc.addTimes(breakArr)






            const rejectSundayModel = await db.query(

                `   select count(*) as totalRejectSundays
                    from eve_acc_employee_attendence_approved
                    where status='A'
                    and employeeId=:employeeId
                    and month(date)=:month
                    and year(date)=:year
                    and isRejectSunday='yes'
                              `, {
                replacements: {
                    employeeId: e.id,
                    year: year,
                    month: month,

                }, type: QueryTypes.SELECT
            }
            )

            let totalRejectedSundays = rejectSundayModel[0].totalRejectSundays
            let totalNonPayableDay = e.totalReject + ((e.totalHalfDay) / 2) + e.totalUnpaidLeave + ((e.totalHalfdayunpaidLeave) / 2) + totalRejectedSundays
            let totalNetPaidDays = totalDays - totalRejectedSundays - totalNonPayableDay
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
                    and month(date)=:month
                    and year(date)=:year
                    `, {
                replacements: {
                    employeeId: e.id,
                    year: year,
                    month: month,
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


            for (let i = 0; i < totalDays && i < app.length; i++) {
                const x = app[i];
                if (x.isSunday === true) {
                    num_sundays++
                }

            }
            attendanceCount += num_sundays


            // attendanceCount += sundayCount
            e.extraDutySalary = await myFunc.getExtraDutyAmountByEmployeeId(e.id, month, year, e.salaryTemplateId, db)
            e.overtimeAmount = await myFunc.getOvertimeAmountByEmployeeId(e.id, month, year, e.salaryTemplateId, db) || ''



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




            let totalMonthlySalary = fixedTotal;

            let amount = totalMonthlySalary / NoOfdaysInMonth * attendanceCount

            e.dailyEarning = myFunc.formatAmount((parseFloat(amount)) + (e.extraDutySalary) + (e.overtimeAmount))

        }))


        const excelData = getData.map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Location': e.locationName,

            'App': e.app,
            'Total Work Hrs': e.totalWorkingHrs,
            'Total Break Hours': e.totalBreakHrs,
            'Present': e.totalPresent,
            'Half Day': e.totalHalfDay,
            'Absent': e.totalAbsent,
            'Paid Leave': e.totalPaidLeave,
            'Unpaid Leave': e.totalUnpaidLeave,
            'Halfday Paid Leave': e.totalHalfdayPaidLeave,

            'Halfday Unpaid Leave': e.totalHalfdayunpaidLeave,
            'Paid Holidays': e.totalPaidHoliday,
            'Net Paid Days': e.totalNetPaidDays,
            'Total Credit': e.totalCredit,
            'Total Used': e.totalUsed,
            'Daily Earning': e.dailyEarning,
        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo,
            totalData: totalData,
            // totalData: totalData,
            // totalApprove: myFunc.formatAmount(totalApprove),
            // totalPaid: myFunc.formatAmount(totalPaid),
            // totalUnpaid: myFunc.formatAmount(totalUnpaid),
            // employee: getData,
            employee: myFunc.replaceEmptyValues(excelData)
        })
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, year, month, branchId, empCode, empname, locationId, subCompanyId }) {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                // 'Cookie': `x-cross-auth=${(token)}`
                'x-cross-auth': token
            },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMonthlyAttendanceReportExcel`,

            data: { token, year, month, branchId, empCode, empname, locationId, subCompanyId }
        }
        const response = await axios(config)
        return response.data;
    } catch (error) {
        throw error;
    }
}
function getColumnLetter(columnNumber) {
    let columnName = '';
    while (columnNumber > 0) {
        let remainder = (columnNumber - 1) % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
}


async function createExcelFile(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = []
    let employee = data.employee
    let header = Object.keys(employee[0])
    let subHeader = []
    let midHeader = []

    let appIndex = header.indexOf('App')



    let mergeColumn = []



    employee[0].App.forEach((e, i) => {
        midHeader.push(e.crtDate, '', '')
        subHeader.push('In Time', 'Out Time', 'Device Name')

        let startColumn = (appIndex + 1) + (i * 3)
        let endColumn = (startColumn + 2)


        // let endRow = 1
        // let startRow = 1
        mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
        // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
    })



    header.splice(appIndex, 1, ...midHeader)

    subHeader.unshift(...new Array(appIndex).fill(''))


    values.push(header)
    values.push(subHeader)

    employee.forEach(e => {
        let value = Object.values(e)
        let row = []
        value.forEach((x, i) => {
            if (Array.isArray(x)) {
                x.forEach((z, k) => {
                    row.push(z.inTime, z.outTime, z.deviceName)
                })
            }
            else {
                row.push(x)
            }
        })


        values.push(row)

    });
    //    // Assuming 'header' is defined and contains the correct headers

    // // Get indices for the required columns
    // let totalWorkIndex = header.indexOf('Total Work Hours') + 1; // Add 1 because ExcelJS uses 1-based index
    // let totalActualIndex = header.indexOf('Actual Shift Hours') + 1;
    // let totalPresent = header.indexOf('Present') + 1;
    // let totalHalfDay = header.indexOf('Half Day') + 1;
    // let totalAbsent = header.indexOf('Absent') + 1;
    // let totalPaidLeave = header.indexOf('Paid Leave') + 1;
    // let totalUnpaidLeave = header.indexOf('Unpaid Leave') + 1;
    // let status = header.indexOf('Status') + 1;
    // let total = header.indexOf('Sl. No.') + 1; // Adjusted as ExcelJS is 1-based

    // // Log indices for debugging


    // // Prepare data row with appropriate length
    // let len = header.length;
    // let row = new Array(len).fill('');

    // // Assign data values to their respective indices
    // row[totalWorkIndex - 1] = data['totalWork']; // Use 0-based for array
    // row[totalActualIndex - 1] = data['totalActualShift'];
    // row[totalPresent - 1] = data['totalPresent'];
    // row[totalHalfDay - 1] = data['totalHalfDay'];
    // row[totalAbsent - 1] = data['totalAbsent'];
    // row[totalPaidLeave - 1] = data['totalPaidLeave'];
    // row[totalUnpaidLeave - 1] = data['totalUnpaidLeave'];
    // row[total - 1] = 'TOTAL';

    // // Push the row into values array
    // values.push(row);

    // Add the values to the worksheet
    worksheet.addRows(values);

    // Merge cells as required
    mergeColumn.forEach((e) => {
        worksheet.mergeCells(e);
    });

    // //Setting cell values using calculated indices
    worksheet.getCell(2, header.indexOf('Total Work Hrs') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Present') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Half Day') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Absent') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Paid Leave') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Unpaid Leave') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Halfday Paid Leave') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Halfday Unpaid Leave') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Paid Holidays') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Net Paid Days') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Total Credit') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Total Used') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Daily Earning') + 1).value = '';
    worksheet.getCell(2, header.indexOf('Total Break Hours') + 1).value = '';



    const headerRow = worksheet.getRow(1);
    const headerRow2 = worksheet.getRow(2);

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            row.height = 15

        });
    });
    headerRow.eachCell(cell => {
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });
    headerRow2.eachCell(cell => {
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    worksheet.columns.forEach(column => {
        column.width = 20;
    });


    // const lastRow = worksheet.lastRow;
    // lastRow.eachCell((cell, colNumber) => {
    //     cell.font = { bold: true };
    // });


    return workbook.xlsx
}

async function getMonthlyAttendanceReportExcelSheet(req, res) {
    try {
        // let token = req.cookies["x-cross-auth"] || req.query["x-cross-auth"]
         let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { year, month, branchId, empCode, empname, locationId, subCompanyId } = data

        let apiData = await fetchData({ token, year, month, branchId, empCode, empname, locationId, subCompanyId })
        let getExcel = createExcelFile(apiData)


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="monthlyAttendanceWc Report.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMonthlyAttendanceReportExcel, getMonthlyAttendanceReportExcelSheet }

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