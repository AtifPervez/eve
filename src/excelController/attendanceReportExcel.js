
let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const axios = require('axios')
const ExcelJS = require('exceljs')


function formatAmount(numericString) {

    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
}
const departmentNameByDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
}
const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (employeeName[0]) {

        let res = Object.values(employeeName[0])
        let newRes = (res.toString());
        return newRes
    }
}


const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if (branchName[0]) {

        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    }
    )

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
}

const getSubCompanyNameById = async (id, db) => {
    let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subCompanyName[0]) {
        let res = Object.values(subCompanyName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
}

const getAttendanceReportExcel = async (req, res) => {

    try {
        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        const companyId = decodedToken.companyId
        const branchId = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let db = sequelize(companyId)

        // const userId = '29'
        // let db = sequelize('59')

        let data = req.body
        let { month, year } = data

       

        if (!(month && year)) {
            return res.status(400).send({ status: false, msg: 'enter year and month' })
        }

        let getData = await db.query(`
        SELECT 
        eve_acc_employee.id AS empId,
        eve_acc_employee.employeeName AS empName,
        eve_acc_employee.employeeCode AS empCode,
        eve_acc_employee.employeeBranchId AS branchName,
        eve_acc_employee.employeeBranchId AS branchId,
        eve_acc_employee.employeeSubCompanyId AS subCompanyName,
        eve_acc_employee.employeeSubCompanyId AS subCompanyId,
        eve_acc_employee.employeeDepartmentId AS departmentName,
        eve_acc_employee.employeeDepartmentId AS deptId,
        eve_acc_employee.employeeDesignationId AS designName,
        eve_acc_employee.employeeDesignationId AS designId,
        eve_acc_employee.employeeSubDepartmentId AS subDepartmentName,
        eve_acc_employee.employeeSubDepartmentId AS subDepartmentId,
        eve_acc_employee.locationID AS location,
        eve_acc_locationmaster.location AS locationName,
        eve_acc_employee.employeeType AS type,
        eve_acc_employee_attendance_reporting_system.appriserId,
        eve_acc_employee_attendance_reporting_system.reviewerId,
        eve_acc_employee_attendance_reporting_system.managerId,
        eve_acc_employee_attendance_reporting_system.approvalRequired
        FROM eve_acc_employee
        RIGHT JOIN
        eve_acc_employee_attendance_reporting_system
        ON eve_acc_employee.id=eve_acc_employee_attendance_reporting_system.empId
        LEFT JOIN eve_acc_locationmaster on eve_acc_employee.locationID=eve_acc_locationmaster.id
        WHERE
        eve_acc_employee.status = 'A'
          AND eve_acc_employee.employeeType='Blue Collar'
        AND (eve_acc_employee_attendance_reporting_system.appriserId = :userId 
            OR eve_acc_employee_attendance_reporting_system.reviewerId = :userId 
            OR eve_acc_employee_attendance_reporting_system.managerId = :userId)
            AND DATE_FORMAT(eve_acc_employee.employeeDoj, "%Y-%m") <= :yearMonth

             AND (DATE_FORMAT(eve_acc_employee.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR eve_acc_employee.employeeLastWorkingDate IS NULL )

            AND (eve_acc_employee.employeeCurrentStatus = '' 
                                       OR eve_acc_employee.employeeCurrentStatus IS NULL 
                                       OR eve_acc_employee.employeeCurrentStatus = 'Active'
                                       
                                       OR eve_acc_employee.employeeCurrentStatus = 'resignation'

                                       OR eve_acc_employee.employeeCurrentStatus = 'joining'
                                       
                                        
                                       OR eve_acc_employee.employeeCurrentStatus = 'offerletter')
        
`, {
            replacements: {
                userId: userId,
                yearMonth: year + '-' + month

            },
            type: QueryTypes.SELECT
        });

        await Promise.all(getData.map(async (e) => {
            if (e.branchName != null && e.branchName != '') {
                e.branchName = await getBranchNameByBranchId(e.branchName, db)
            }
            if (e.subCompanyName != null && e.subCompanyName != '') {
                e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
            }
            if (e.subCompanyName == null) {
                e.subCompanyName = ''
            }
            if (e.subCompanyId == null) {
                e.subCompanyId = ''
            }
            if (e.designName != null && e.designName != '') {
                e.designName = await getDesignationNameById(e.designName, db)
            }
            if (e.designName == null) {
                e.designName = ''
            }
            if (e.departmentName != null && e.departmentName != '') {
                e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
            }
            if (e.departmentName == null) {
                e.departmentName = ''
            }
            if (e.subDepartmentName != null && e.subDepartmentName != '') {
                e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)
            }
            if (e.subDepartmentName == null) {
                e.subDepartmentName = ''
            }
            if (e.subCompanyId != null) {

                e.subCompanyId = e.subCompanyId.toString()
            }
            if (e.employeeType == null) {
                e.employeeType = ''
            }
            if(e.location==null){
                e.location=''
            }

            if (e.locationName == null) {
                e.locationName = ''
            }

            if(e.empCode==null){
                e.empCode=''
            }
            if(e.type==null){
                e.type=''
            }
            if(e.branchName==null){
                e.branchName=''
            }
            

        }))
        /************************************************************************************** */
        //Case==creditSetting of employees



        let eve_self_registration = await db.query('select * from  eve_self_registration where status="A"', {
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData.length; i++) {
            for (let j = 0; j < eve_self_registration.length; j++) {
                if (getData[i].empId == eve_self_registration[j].empId && month == eve_self_registration[j].mm && year == eve_self_registration[j].yyyy) {
                    getData[i].creditSetting = [{
                        creditDay: eve_self_registration[j].creadit_month,
                        creditUsed: eve_self_registration[j].used,
                        employeeId: eve_self_registration[j].empId
                    }]
                }
            }
        }

        /******************************************************************************** */


        getData = getData.map((value) => {
            value.compOff = []
            return value
        })
        getData = getData.map((value) => {
            value.holidayArr = []
            return value
        })
        getData = getData.map((value) => {
            value.inOutArr = []
            return value
        })

        //***********************************************************************//

        //Case=EarningSalary

        //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise



        getData = getData.map((value) => {
            value.earningSalary = 0
            return value
        })

        //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise
        let monthlySalaryDb = await db.query('select * from eve_acc_set_monthly_salary_employee_wise where status="A"', {
            type: QueryTypes.SELECT
        })

        let extra_duty_off_paid = await db.query('select * from  eve_acc_module_activation_master where status="A" && name=:name', {
            replacements: {
                name: "extra_duty_off_paid"
            },
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData.length; i++) {

            for (let j = 0; j < monthlySalaryDb.length; j++) {



                if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'addition') {

                    getData[i].earningSalary += (parseFloat(monthlySalaryDb[j].salaryAmount))


                }
                else if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'deduction') {
                    getData[i].earningSalary -= (parseFloat(monthlySalaryDb[j].salaryAmount))



                }
            }
        }


        //extraDutyEmpById

        let totalDaysOfMOnth = getDaysInMonth(year, month);
        let startDate = `${year}-${month}-01`

        let endDate = `${year}-${month}-${totalDaysOfMOnth}`


        let totalCompOffDays = 0
        for (let i = 0; i < getData.length; i++) {
            getData[i].Amount = formatAmount((getData[i].earningSalary) / totalDaysOfMOnth)
            // getData[i].Amount = ((getData[i].earningSalary)/totalDaysOfMOnth)

            getData[i].earningSalary = formatAmount(getData[i].earningSalary)
            // getData[i].earningSalary = (getData[i].earningSalary)


        }

        if ((extra_duty_off_paid.length) > 0) {


            let eve_acc_extra_duty_encashment_calculation_setting = await db.query('select * from eve_acc_extra_duty_encashment_calculation_setting where status="A"', {
                type: QueryTypes.SELECT
            })

            let extraDuty = eve_acc_extra_duty_encashment_calculation_setting



            let tempSalaryAmount = 0

            for (let i = 0; i < extraDuty.length; i++) {
                for (let j = 0; j < monthlySalaryDb.length; j++) {

                    if (extraDuty[i].salaryTemplateId == monthlySalaryDb[j].salaryTempId && extraDuty[i].salaryComponents) {

                    }
                }
            }


        }

        //fixedWeeklyHoliday

        getData = getData.map((value) => {
            value.fixedWeeklyOffDay = ''
            return value
        })

        let fixedWeeklyHolidayDb = await db.query('select * from eve_acc_company_fix_weekly_holiday where status="A"', {
            type: QueryTypes.SELECT
        })



        for (let i = 0; i < getData.length; i++) {
            for (let j = 0; j < fixedWeeklyHolidayDb.length; j++) {


                if (getData[i].branchId == fixedWeeklyHolidayDb[j].branchId) {
                    getData[i].fixedWeeklyOffDay = fixedWeeklyHolidayDb[j].day
                }

            }
        }

        //******************************************************************//
        //additionalWeeklyOffDay

        function weeklyHolidayArrayFn(options) {

            let days = ['sunday', 'monday', 'tuesday', "wednesday", "thursday", 'friday', 'saturday']

            let { month, year, dayName, dayNoStr } = options
            let date = moment(`${year}-${month}-01`)
            // console.log(date);
            let dayIndex = days.indexOf(dayName)
            let currentDay = date.format('dddd').toLowerCase()
            let currentDayIndex = days.indexOf(currentDay)
            let firstDayNo = '01'

            if (dayIndex > currentDayIndex) {

                firstDayNo = (dayIndex - currentDayIndex) + 1

            }
            else if (dayIndex < currentDayIndex) {

                let diffAfterCurrentDay = (days.length) - (currentDayIndex)
                let diffBeforeDay = dayIndex + 1
                firstDayNo = diffAfterCurrentDay + diffBeforeDay
            }

            else if (dayIndex == currentDayIndex) {
                firstDayNo = 1
            }

            let dayNo = dayNoStr.toString().replace(/(?![0-9])./g, '') * 1
            if (dayNo > 1) {

                firstDayNo += (7 * (dayNo - 1))

            }
            // return firstDayNo
            return (firstDayNo < 10 ? `0${firstDayNo}` : `${firstDayNo}`)
        }


        getData = getData.map((value) => {
            value.additionalWeeklyOffDay = {
                day: null,
                weeklyHolidayArray: []
            }
            return value
        })


        let companyWeeklyHolidayDb = await db.query('select * from eve_acc_company_weekly_holiday where status="A"', { type: QueryTypes.SELECT })


        for (let i = 0; i < getData.length; i++) {

            for (let j = 0; j < companyWeeklyHolidayDb.length; j++) {

                if (getData[i].branchId == companyWeeklyHolidayDb[j].branchId) {

                    let options = {
                        month: month,
                        year: year,
                        dayName: companyWeeklyHolidayDb[j].day.toLowerCase(),
                    }

                    getData[i].additionalWeeklyOffDay.day = companyWeeklyHolidayDb[j].day
                    if (typeof (companyWeeklyHolidayDb[j].weeks) == "string" && companyWeeklyHolidayDb[j].weeks !== "null") {
                        let weeksArray = companyWeeklyHolidayDb[j].weeks.split(',')


                        for (let k = 0; k < weeksArray.length; k++) {

                            options.dayNoStr = weeksArray[k]
                            getData[i].additionalWeeklyOffDay.weeklyHolidayArray.push(weeklyHolidayArrayFn(options))

                        }
                    }
                }
            }
        }
        //****************************************************************************//


        getData = getData.map((value) => {
            value.empId = value.empId.toString()
            return value
        })

        getData = getData.map((value) => {
            value.base64_empId = Buffer.from(value.empId || '').toString('base64')
            return value
        })

        //sandwich_leave


        let sandwich_leave = await db.query('select * from eve_acc_module_activation_master where status="A" && name="sandwich_leave"', { type: QueryTypes.SELECT })

        //appDetails

        function getDaysInMonth(year, month) {
            return new Date(year, month, 0).getDate();
        }

        const daysInCurrentMonth = getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)


        getData = getData.map((value) => {
            value.totalDays = NoOfdaysInMonth
            return value
        })


        let employeeAttendance = await db.query('select * from eve_acc_employee_attendence where status="A"', {
            type: QueryTypes.SELECT
        })

        const appDetailsObj = [];

        for (let i = 1; i <= NoOfdaysInMonth; i++) {
            let number = i.toString().padStart(2, '0');
            // console.log(number);
            let empDtStrdate = new Date(`${year}-${month}-${number}`);

            let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

            let newObj = {
                crtDate: `${year}-${month}-${number}`,
                intime: "--",
                outTime: "--",
                workingHour: "--",
                attStatus: "--",
                empDtStr: `${timestamp}`,
                backcolor: "--",
                title: "--"
            };


            appDetailsObj.push(newObj);
        }

        let employeeAttendanceApproved = await db.query('select * from eve_acc_employee_attendence_approved where status="A" ', {
            type: QueryTypes.SELECT
        })

        let eve_acc_company_holiday = await db.query('select * from eve_acc_company_holiday where status="A" ', {
            type: QueryTypes.SELECT
        })

        const leaveType = async (leaveTypeId) => {

            let empleaveType = await db.query('select * from eve_acc_leave_type where id=:id', {
                replacements: {
                    id: leaveTypeId
                },
                type: QueryTypes.SELECT
            })
            return empleaveType[0]
        }

        getData = getData.map((value) => {
            value.totalFullDay = 0
            value.totalPresentDay = 0
            value.totalAbsent = 0
            value.totalHalfDay = 0
            value.totalReject = 0
            value.totalRejectedSunday = 0
            value.totalPaidLeave = 0
            value.totalUnpaidLeave = 0
            value.totalHalfdayPaidLeave = 0
            value.totalHalfdayPaidLeave = 0
            value.totalHalfdayunpaidLeave = 0
            value.totalMarkedAsHoliday = 0
            value.totalWorkingHour = 0
            value.totalPaidHoliday = 0
            return value
        })

        for (let i = 0; i < getData.length; i++) {

            let value = getData[i]

            let _appDetailsObj = JSON.parse(JSON.stringify(appDetailsObj))


            let employeeAttendanceId = employeeAttendance.filter((x) => {
                return value.empId == x.empId
            })
            let empAttendanceIdOfApproved = employeeAttendanceApproved.filter((x) => {
                return value.empId == x.employeeId
            })
            /************************************************** */
            let employeeBranchId = eve_acc_company_holiday.filter((x) => {
                return value.branchId = x.branchId
            })

            // console.log(employeeBranchId);

            /*****************************************/

            for (let j = 0; j < _appDetailsObj.length; j++) {
                let _appDetail = _appDetailsObj[j]

                let targetObj = employeeAttendanceId.find((e) => {
                    return (e.empId == value.empId && _appDetail.crtDate == e.date)
                })
                let targetObjOfApproved = empAttendanceIdOfApproved.find((e) => {
                    return (e.employeeId == value.empId && _appDetail.crtDate == e.date)
                })

                let targetObjOfCompanyHoliday = employeeBranchId.find((e) => {
                    return (e.branchId == value.branchId && _appDetail.crtDate == e.date)
                })


                if (targetObj) {
                    if(targetObj.intime!="--:undefined"){

                        _appDetail.intime = targetObj.intime
                    }

                    if(targetObj.outTime!="--:undefined"){

                        _appDetail.outTime = targetObj.outTime
                    }
                    if(targetObj.intime==''){
                                 _appDetail.intime='--'
                    }
                    if(targetObj.outTime==''){
                                 _appDetail.outTime='--'
                    }


                    //inOutArr

                    if (targetObj.intime != null && targetObj.outTime != null && targetObj.intime != '' && targetObj.outTime != '') {
                        getData[i].inOutArr.push({
                            date: _appDetail.crtDate,
                            inTime: targetObj.intime,
                            outTime: targetObj.outTime,
                            intimeStatus: '0',
                            outtimeStatus: '0',
                            workingHourInMin: ''

                        })


                    }

                    const time1 = targetObj.outTime
                    const time2 = targetObj.intime

                    const timeMoment1 = moment(time1, "HH:mm");
                    const timeMoment2 = moment(time2, "HH:mm");
                    const hour1 = timeMoment1.hour();
                    const hour2 = timeMoment2.hour();


                    if(hour1>hour2){

                    const duration = moment.duration(moment(time1, 'HH:mm').diff(moment(time2, 'HH:mm')));

                    let differenceHours = duration.hours();

                    let differenceMinutes = duration.minutes();


                    if (differenceHours < 10) {
                        differenceHours = `0${differenceHours}`
                    }

                    if (differenceMinutes < 10) {
                        differenceMinutes = `0${differenceMinutes}`
                    }
                    if (_appDetail.intime && _appDetail.outTime != ":" && _appDetail.outTime) {

                        _appDetail.workingHour = `${differenceHours}:${differenceMinutes}`
                    }
                }
            }

                if ((targetObjOfApproved) && (sandwich_leave.length > 0)) {
                    if (targetObjOfApproved.type == "full") {
                        _appDetail.backcolor = "#a4eab0"
                        _appDetail.title = "Present";
                        _appDetail.attStatus = "Fullday"
                        getData[i].totalFullDay++
                        getData[i].totalPresentDay++

                    }



                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remark != "Second Half") {
                        _appDetail.attStatus = "Absent"
                        _appDetail.backcolor = "#f1bcbc"
                        _appDetail.title = "Absent";
                        getData[i].totalReject++
                        getData[i].totalAbsent++
                    }




                    else if (targetObjOfApproved.type == "half") {
                        _appDetail.attStatus = "Halfday"
                        _appDetail.backcolor = "#b1b82c"
                        _appDetail.title = "Halfday";
                        getData[i].totalHalfDay++

                    }




                    else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {


                        let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId)

                        _appDetail.backcolor = leaveResult.colorCode
                        _appDetail.title = leaveResult.name
                        _appDetail.attStatus = leaveResult.prefix
                        getData[i].totalPaidLeave++

                        if (targetObjOfApproved.flagRemarks == "ForLateClockIn") {
                            _appDetail.title = " For Late ClockIn";
                            _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"

                        }

                    }




                    else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE" && targetObjOfApproved.leaveTypeId == '') {
                        _appDetail.attStatus = "D-PL"
                        _appDetail.backcolor = "#85eaea"
                        _appDetail.title = "Default Paid Leave";
                        getData[i].totalPaidLeave++
                    }





                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {
                        _appDetail.attStatus = "UL"
                        _appDetail.backcolor = "#f17171"
                        _appDetail.title = "Unpaid Leave";
                        getData[i].totalUnpaidLeave++
                    }



                    else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
                        _appDetail.attStatus = 'HD-PL'
                        _appDetail.backcolor = '#ffa742'
                        _appDetail.title = 'Halfday Paid Leave';
                        getData[i].totalHalfdayPaidLeave++;
                    }




                    else if (targetObjOfApproved.type == 'reject' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
                        _appDetail.attStatus = 'HD-UL'
                        _appDetail.backcolor = '#b0f320'
                        _appDetail.title = 'Halfday unpaid Leave';
                        getData[i].totalHalfdayunpaidLeave++;
                    }



                    else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks != 'L LEAVE' && targetObjOfApproved.remarks != 'First Half' && targetObjOfApproved.remarks != 'Second Half') {
                        _appDetail.attStatus = 'Marked as Holiday'
                        _appDetail.backcolor = '#ccffcc'
                        _appDetail.title = 'Marked as Holiday';
                        getData[i].totalMarkedAsHoliday++
                    }




                    else if (targetObjOfApproved.type == "sunday reject") {
                        _appDetail.attStatus = "Absent"
                        _appDetail.backcolor = "#f1bcbc"
                        _appDetail.title = "Absent";
                        getData[i].totalReject++
                        getData[i].totalAbsent++
                    }


                }

                /***********************************************************/

                else {

                    _appDetail.attStatus = "-";
                    _appDetail.backcolor = "#fff";
                    _appDetail.title = "";

                    if (targetObjOfCompanyHoliday) {
                        _appDetail.backcolor = "#09ff00";

                        // getData[i].totalHoliDay++
                        getData[i].totalPaidHoliday++



                    }

                    else if (moment(_appDetail.crtDate).format('dddd') == getData[i].fixedWeeklyOffDay) {
                        _appDetail.attStatus = "Off Day";
                        _appDetail.backcolor = "#e8e4e4";
                        _appDetail.title = "Off Day";

                        // getData[i].totalOffDay++
                        getData[i].totalPaidHoliday++
                    }

                    else if (
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[0]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[1]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[2]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[3]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[4]

                    ) {
                        _appDetail.attStatus = "Off Day";
                        _appDetail.backcolor = "#e8e4e4";
                        _appDetail.title = "Off Day";
                        // getData[i].totalOffDay++
                        getData[i].totalPaidHoliday++

                    }
                }
                value.appDetails = _appDetailsObj
            }
        }

        // TotalWorkingHours
        let formattedHours
        let formattedMinutes

        for (let i = 0; i < getData.length; i++) {
            let value = []
            for (let j = 0; j < NoOfdaysInMonth; j++) {
                if (getData[i].appDetails[j].workingHour != '--') {
                    value.push(getData[i].appDetails[j].workingHour)
                }
            }
            // console.log(value);
            const totalMinutes = value.reduce((sum, time) => {
                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
                return sum + hours * 60 + minutes;
            }, 0);

            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60;
            formattedHours = String(hours).padStart(2, "0");
            formattedMinutes = String(minutes).padStart(2, "0")

            getData[i].totalWorkingHour = `${formattedHours}:${formattedMinutes}`;


        }


        //workingHour

        function subtractTime(time1, time2) {
            // Parse time strings into hour and minute components
            const [hour1, minute1] = time1.split(':').map(Number);
            const [hour2, minute2] = time2.split(':').map(Number);

            // Convert hour and minute components into total minutes
            const totalMinutes1 = hour1 * 60 + minute1;
            const totalMinutes2 = hour2 * 60 + minute2;

            // Subtract the total minutes of the second time from the first time
            let diffMinutes = totalMinutes1 - totalMinutes2;

            if (diffMinutes < 0) {
                // If the result is negative, assume we are crossing midnight and add 24 hours worth of minutes
                diffMinutes += 24 * 60;
            }

            // Convert the result back to the "hh:mm" format
            const diffHours = Math.floor(diffMinutes / 60);
            const diffMins = diffMinutes % 60;

            // Add leading zeros for single-digit hours/minutes
            const formattedDiff = `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
            return formattedDiff;
        }




        function convertTimeToMinutes(time) {
            const [hour, minute] = time.split(':').map(Number);
            const totalMinutes = hour * 60 + minute;
            return totalMinutes;
        }

        for (let i = 0; i < getData.length; i++) {

            let n = getData[i].inOutArr.length

            for (let j = 0; j < n; j++) {

                let time1 = getData[i].inOutArr[j].outTime
                let time2 = getData[i].inOutArr[j].inTime

                getData[i].inOutArr[j].workingHourInMin = subtractTime(time1, time2)
                getData[i].inOutArr[j].workingHourInMin = convertTimeToMinutes(getData[i].inOutArr[j].workingHourInMin)



            }
        }


        //NetPaidDays
        getData = getData.map((value) => {
            value.NetPaidDays = NoOfdaysInMonth.toString()
            return value
        })

        //count total fixed holiday in a month of employee

        function countDayInMonth(year, month, targetDay) {

            const firstDayOfMonth = new Date(year, month - 1, 1);
            const firstDayOfWeek = firstDayOfMonth.getDay();
            const daysInMonth = new Date(year, month, 0).getDate();
            let targetDayCount = 0;
            const targetDayOfWeek = (targetDay - firstDayOfWeek + 7) % 7;

            for (let day = 0; day < daysInMonth; day++) {
                const currentDayOfWeek = (firstDayOfWeek + day) % 7;
                if (currentDayOfWeek === targetDayOfWeek) {

                    targetDayCount++;
                }
            }
            return targetDayCount;
        }
        let totalSalaryExpenses = 0
        for (let i = 0; i < getData.length; i++) {
            getData[i].totalPaidHoliday = (getData[i].totalPaidHoliday) - (getData[i].totalRejectedSunday)
            getData[i].totalPaidHoliday = `0${getData[i].totalPaidHoliday.toString()}`
            let e = getData[i]
            for (let j = 0; j < NoOfdaysInMonth; j++) {

                e.appDetails[j].crtDate = moment(e.appDetails[j].crtDate).format("DD/MM/YYYY");
            }
        }


        let searchData = {
            empCode: req.body.empCode,
            empName: req.body.empName,
            branchId: req.body.branchId,
            deptId: (req.body.deptId),
            designId: (req.body.designId),
            subCompanyId: (req.body.subCompanyId),
            subDepartmentId: (req.body.subDepartmentId),
            location: req.body.location
        }

        let searchEmp = getData.filter((e, i) => {
            let boo = true
            for (let key in searchData) {
                if (searchData[key] && searchData[key] != e[key]) {
                    boo = false
                    break
                }
            }
            return boo
        })



        searchEmp.sort((a, b) => a.empName.localeCompare(b.empName))

        let count = searchEmp.length
        
        let limit = parseInt(req.body.limit) || getData.length
        let maxPage = Math.ceil(count / limit)//kitne page h
        let pageNo = parseInt(req.body.pageNo) || 1
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = searchEmp.slice(startIndex, endIndex);

       

        let attendanceReportExcel = paginatedData.map((e, i) => ({
             'Sl. No.': Number(i + 1),
            'Employee Name': e.empName,
            'Employee Code': e.empCode,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Location': e.locationName,
            'Type':e.type,
            'App': e.appDetails,
            'Total Work Hours': e.totalWorkingHour,
            'Present': e.totalPresentDay,
            'Half Day': e.totalHalfDay,
            'Absent': e.totalAbsent,
            'Paid Leave': e.totalPaidLeave,
            'Unpaid Leave': e.totalUnpaidLeave,
        }))

        return res.status(200).send({
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: getData.length,
            listingData: searchEmp.length,
            totalSalaryExpenses: totalSalaryExpenses,
            // employee: paginatedData,
            employee: attendanceReportExcel,

        })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
async function fetchData({ token,year, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json',
                'x-cross-auth':token,
             },
            method: 'POST',
            // url: 'http://localhost:5000/report/getAttendanceReportExcel',
            // url:'https://www.ntest.eveserver.ind.in/report/getAttendanceReportExcel',
            url: `${process.env.BASE_URL}/report/getAttendanceReportExcel`,
            data: {token,year, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location }
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
        midHeader.push(e.crtDate, '', '', '')
        subHeader.push( 'In Time', 'Out Time', 'Working hr.','Status')

        let startColumn = (appIndex + 1) + (i * 4)
        let endColumn = (startColumn + 3)
        let endRow = 1
        let startRow = 1
        mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
        // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
    })

    // console.log(mergeColumn);

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
                    row.push( z.intime, z.outTime, z.workingHour,z.attStatus)
                })
            }
            else {
                row.push(x)
            }
        })


        values.push(row)

    })
   

    worksheet.addRows(values)

    mergeColumn.forEach((e, i) => {
        worksheet.mergeCells(e)
    })

    worksheet.getCell(2, 134).value = ''
    worksheet.getCell(2, 135).value = ''
    worksheet.getCell(2, 136).value = ''
    worksheet.getCell(2, 137).value = ''
    worksheet.getCell(2, 138).value = ''
    worksheet.getCell(2, 139).value = ''
  
    
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

            row.height = 30

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

    return workbook.xlsx




}

async function getAttendanceReportExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let year = (req.body.year || req.query.year)
        let month = (req.body.month || req.query.month)
        let limit = (req.body.limit || req.query.limit)
        let pageNo = (req.body.pageNo || req.query.pageNo)
        let empCode = (req.body.empCode || req.query.empCode)
        let empName = (req.body.empName || req.query.empName)
        let branchId = (req.body.branchId || req.query.branchId)
        let deptId = (req.body.deptId || req.query.deptId)
        let designId = (req.body.designId || req.query.designId)
        let subCompanyId = (req.body.subCompanyId || req.query.subCompanyId)
        let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
        let location = (req.body.location || req.query.location)

        let apiData = await fetchData({ token,year, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location })
        if (apiData.employee.length == 0) {
            return res.status(400).send({ status: false, msg: 'no data found' })
        }


        let getExcel = createExcelFile(apiData)

       



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="attendanceApproval ${month}-${year}.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { getAttendanceReportExcel, getAttendanceReportExcelSheet }