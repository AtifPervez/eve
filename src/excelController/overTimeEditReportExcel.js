let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const moment = require('moment')

const axios = require('axios')

const ExcelJS = require('exceljs')



//php code - eve/hr_api/model/overtime-edit.php



function attendanceStatus(status){

    if(status=='P'){

        return 'Present'

    }

    else if(status=='AB'){

               return 'Absent'

    }

    else if(status=='H'){

        return 'Half Day'

    }

    else if(status=='D-PL'){

        return 'Default Paid Leave'

    }

    else if(status=='UL'){

        return 'Unpaid Leave'

    }

    else if (status=='HD-PL'){

        return 'Half Paid Leave'

    }

    else if (status=='HD-UL'){

        return 'Halfday unpaid Leave'

    }

    else if (status=='MHD'){

        return 'Marked as Holiday'

    }

    else{

        return ''

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



function convertDateDDMMYYYY(date) {

    let parsedDate = moment(date)

    let newDate = parsedDate.format('DD-MM-YYYY')

    return newDate

}

const changeSign = x => x === '00:00' ? '--' : x;





const getOvertimeEditReportExcel = async (req, res) => {



    try {

        const decodedToken = req.headerSession

        const userId = decodedToken.userId

        // const userId = '29'

        const companyId = decodedToken.companyId

        const branchId = decodedToken.branchId

        const mainUserId = decodedToken.mainUserId

        let db = sequelize(companyId)

        // let db = sequelize('59')

        let data = req.body

        let { month, year } = data



        if (!(month && year)) {

            return res.status(400).send({ status: false, msg: 'enter year and month' })

        }



        let getData = await db.query(`

                      SELECT distinct  

                      eve_acc_employee.employeeDesignationId AS designation,

                      eve_acc_employee.employeeSubDepartmentId AS SubdepartmentName,

                      eve_acc_employee.employeeDepartmentId AS departmentName,

                      eve_acc_employee.id AS empId, 

                      eve_acc_employee.employeeName AS empName ,

                      eve_acc_employee.employeeCode AS empCode,

                      eve_acc_employee.employeeBranchId AS branchName ,

                      eve_acc_employee.employeeSubCompanyId AS subCompanyName,

                      eve_acc_employee.employeeBranchId ,

                      eve_acc_employee.employeeType AS type,

                      eve_acc_locationmaster.location     

                      FROM eve_acc_employee

                      LEFT JOIN eve_acc_employee_overtime_report AS ot ON eve_acc_employee.id=ot.empId

                      LEFT JOIN eve_acc_locationmaster ON eve_acc_employee.locationID=eve_acc_locationmaster.id 

                      where eve_acc_employee.status="A"

                      AND eve_acc_employee.employeeType='Blue Collar'

                      AND eve_acc_employee.isOvertimeApplicable='yes'

                      AND ot.status='A'

                      AND (ot.appriserId = :userId 

                        OR ot.reviewerId = :userId 

                        OR ot.managerId = :userId)

                        AND (eve_acc_employee.employeeCurrentStatus = '' 

                        OR eve_acc_employee.employeeCurrentStatus IS NULL 

                        OR eve_acc_employee.employeeCurrentStatus = 'Active' 

                        OR eve_acc_employee.employeeCurrentStatus = 'joining' 

                        OR eve_acc_employee.employeeCurrentStatus = 'offerletter')  

                        

                        `, {

            replacements:

            {

                userId: userId

            },

            type: QueryTypes.SELECT

        })







        /************************************************************************************** */

        //Case==creditSetting of employees







        let eve_self_registration = await db.query('select * from  eve_self_registration where status="A"', {

            type: QueryTypes.SELECT

        })



        for (let i = 0; i < getData.length; i++) {

            let e = getData[i]



            if (e.SubdepartmentName != null && e.SubdepartmentName != '') {

                e.SubdepartmentName = await getSubDepartmentNameBySubDepartmentId(e.SubdepartmentName, db)

            }



            e.SubdepartmentName = (e.SubdepartmentName == null) ? '' : e.SubdepartmentName;



            if (e.departmentName != null && e.departmentName != '') {

                e.departmentName = await getSubDepartmentNameBySubDepartmentId(e.departmentName, db)

            }

            e.departmentName = (e.departmentName == null) ? '' : e.departmentName



            if (e.branchName != null && e.branchName != '') {

                e.branchName = await getBranchNameByBranchId(e.branchName, db)

            }

            e.branchName = (e.branchName == null) ? '' : e.branchName



            e.empCode = (e.empCode == null) ? '' : e.empCode



            if (e.designation != null && e.designation != '') {

                e.designation = await getDesignationNameById(e.designation, db)

            }

            e.designation = (e.designation == null) ? '' : e.designation



            if (e.subCompanyName != null && e.subCompanyName != '') {

                e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)

            }

            e.subCompanyName = (e.subCompanyName == null) ? '' : e.subCompanyName



            e.location = (e.location == null) ? '' : e.location

           



            



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





        //Case=EarningSalary



        //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise



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



                    // getData[i].earningSalary += (parseFloat(monthlySalaryDb[j].salaryAmount))





                }

                else if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'deduction') {

                    // getData[i].earningSalary -= (parseFloat(monthlySalaryDb[j].salaryAmount))







                }

            }

        }

        // for (let i = 0; i < getData.length; i++) {

        //     getData[i].Amount = getData[i].earningSalary

        //     getData[i].earningSalary = (getData[i].earningSalary).toFixed(2)





        // }



        //extraDutyEmpById



        let totalDaysOfMOnth = getDaysInMonth(year, month);

        let startDate = `${year}-${month}-01`



        let endDate = `${year}-${month}-${totalDaysOfMOnth}`





        let totalCompOffDays = 0



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

        const leaveType = async (leaveTypeId) => {



            let empleaveType = await db.query('select * from eve_acc_leave_type where status="A" && id=:id', {

                replacements: {

                    id: leaveTypeId

                },

                type: QueryTypes.SELECT

            })

            return empleaveType[0]

        }

        getData = getData.map((value) => {

            value.totalFullDay = 0

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

            value.totalApprovehours = 0

            value.totalRejecthour = 0

            return value

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

                workingHour: '',

                attStatus: "--",

                // empDtStr: `${timestamp}`,

                // backcolor: "--",

                // title: "--",

                dayWiseEditOT: '',

                dayWiseRejHours: '',

                actualOtHrs: '',



            };

            appDetailsObj.push(newObj);

        }



        let employeeAttendance = await db.query('select * from eve_acc_employee_attendence where status="A"', {

            type: QueryTypes.SELECT

        })



        let employeeAttendanceApproved = await db.query('select * from eve_acc_employee_attendence_approved where status="A" ', {

            type: QueryTypes.SELECT

        })



        let eve_acc_company_holiday = await db.query('select * from eve_acc_company_holiday where status="A" ', {

            type: QueryTypes.SELECT

        })

        let overtimeReport = await db.query('select * from eve_acc_employee_overtime_approved where status="A" ', {

            type: QueryTypes.SELECT

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



            let employeeBranchId = eve_acc_company_holiday.filter((x) => {

                return value.branchId = x.branchId

            })



            let overtimeReportRes = overtimeReport.filter((x) => {

                return value.empId == x.employeeId

            })



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



                let targetObjOfOvertime = overtimeReportRes.find((e) => {

                    return (e.employeeId == value.empId && _appDetail.crtDate == e.date)

                })



                if (targetObjOfOvertime) {





                    if (targetObjOfOvertime.type == 'Approve') {

                        _appDetail.dayWiseEditOT = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour

                    }

                    if (targetObjOfOvertime.editOTday == '00.00') {

                        _appDetail.dayWiseEditOT = ''

                    }

                    if (targetObjOfOvertime.editOTday != null) {



                        _appDetail.actualOtHrs = targetObjOfOvertime.editOTday

                    }

                    if (targetObjOfOvertime.editOTday == '00.00') {

                        _appDetail.actualOtHrs = ''

                    }



                    // value.actualTotalOtHours+=parseInt(targetObjOfOvertime.editOTday)



                    if (targetObjOfOvertime.type == 'Reject') {

                        _appDetail.dayWiseRejHours = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour



                    }



                    // if (targetObjOfOvertime.workingHour !== null) {

                    //     _appDetail.workingHour = targetObjOfOvertime.workingHour

                    // }

                }





                if (targetObj) {

                    _appDetail.intime = targetObj.intime

                    _appDetail.outTime = targetObj.outTime





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





  if (hour1 > hour2) {

                    const duration = moment.duration(moment(time1, 'HH:mm').diff(moment(time2, 'HH:mm')));



                    let differenceHours = duration.hours();



                    let differenceMinutes = duration.minutes();





                    // if (differenceHours < 10) {

                    //     differenceHours = `0${differenceHours}`

                    // }



                    if (differenceMinutes < 10) {

                        differenceMinutes = `0${differenceMinutes}`

                    }

                    if (_appDetail.intime && _appDetail.outTime != ":" && _appDetail.outTime) {



                        // _appDetail.workingHour = `${differenceHours}:${differenceMinutes}`

                        if(differenceHours>9){

                     



                 

                            let newDiffHr=differenceHours-9

                                    if (newDiffHr < 10) {

                                        newDiffHr = `0${newDiffHr}`

                    }

                             _appDetail.workingHour = `${newDiffHr}:${differenceMinutes}`

                            



                        }

                    }

                }

                }



                if ((targetObjOfApproved) && (sandwich_leave.length > 0)) {

                    if (targetObjOfApproved.type == "full") {

                        // _appDetail.backcolor = "#a4eab0"

                        // _appDetail.title = "Present";

                        _appDetail.attStatus = "P"

                        getData[i].totalFullDay++



                    }







                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remark != "Second Half") {

                        _appDetail.attStatus = "AB"

                        // _appDetail.backcolor = "#f1bcbc"

                        // _appDetail.title = "Absent";

                        getData[i].totalReject++

                    }









                    else if (targetObjOfApproved.type == "half") {

                        _appDetail.attStatus = "H"

                        // _appDetail.backcolor = "#b1b82c"

                        // _appDetail.title = "Halfday";

                        getData[i].totalHalfDay++



                    }









                    else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {





                        let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId)



                        // _appDetail.backcolor = leaveResult.colorCode

                        // _appDetail.title = leaveResult.name

                        // _appDetail.attStatus = leaveResult.prefix

                        // getData[i].totalPaidLeave++



                        if (targetObjOfApproved.flagRemarks == "ForLateClockIn") {

                            // _appDetail.title = " For Late ClockIn";

                            _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"



                        }



                    }









                    else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE" && targetObjOfApproved.leaveTypeId == '') {

                        _appDetail.attStatus = "D-PL"

                        // _appDetail.backcolor = "#85eaea"

                        // _appDetail.title = "Default Paid Leave";

                        getData[i].totalPaidLeave++

                    }











                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {

                        _appDetail.attStatus = "UL"

                        _appDetail.backcolor = "#f17171"

                        // _appDetail.title = "Unpaid Leave";

                        getData[i].totalUnpaidLeave++

                    }







                    else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {

                        _appDetail.attStatus = 'HD-PL'

                        // _appDetail.backcolor = '#ffa742'

                        // _appDetail.title = 'Halfday Paid Leave';

                        getData[i].totalHalfdayPaidLeave++;

                    }









                    else if (targetObjOfApproved.type == 'reject' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {

                        _appDetail.attStatus = 'HD-UL'

                        // _appDetail.backcolor = '#b0f320'

                        // _appDetail.title = 'Halfday unpaid Leave';

                        getData[i].totalHalfdayunpaidLeave++;

                    }







                    else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks != 'L LEAVE' && targetObjOfApproved.remarks != 'First Half' && targetObjOfApproved.remarks != 'Second Half') {

                        _appDetail.attStatus = 'MHD'

                        // _appDetail.backcolor = '#ccffcc'

                        // _appDetail.title = 'Marked as Holiday';

                        getData[i].totalMarkedAsHoliday++

                    }









                    else if (targetObjOfApproved.type == "sunday reject") {

                        _appDetail.attStatus = "AB"

                        // _appDetail.backcolor = "#f1bcbc"

                        // _appDetail.title = "Absent";

                        getData[i].totalReject++

                    }

                }





                else {



                    _appDetail.attStatus = "-";

                    // _appDetail.backcolor = "#fff";

                    // _appDetail.title = "";



                    if (targetObjOfCompanyHoliday) {

                        // _appDetail.backcolor = "#09ff00";

                        getData[i].totalPaidHoliday++

                    }



                    else if (moment(_appDetail.crtDate).format('dddd') == getData[i].fixedWeeklyOffDay) {

                        _appDetail.attStatus = "-";

                        // _appDetail.backcolor = "#e8e4e4";

                        // _appDetail.title = "Off Day";



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

                        _appDetail.attStatus = "-";

                        // _appDetail.backcolor = "#e8e4e4";

                        // _appDetail.title = "Off Day";

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

                if (getData[i].appDetails[j].workingHour != '') {

                    value.push(getData[i].appDetails[j].workingHour)

                }



            }



            const totalMinutes = value.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]

                return sum + hours * 60 + minutes;

            }, 0);



            const hours = Math.floor(totalMinutes / 60)

            const minutes = totalMinutes % 60;

            formattedHours = String(hours).padStart(2, "0");

            formattedMinutes = String(minutes).padStart(2, "0")



            getData[i].totalWorkingHour = `${formattedHours}:${formattedMinutes}`;



            //totalApproveHours





            let value1 = []

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (getData[i].appDetails[j].dayWiseEditOT != '') {

                    value1.push(getData[i].appDetails[j].dayWiseEditOT)

                }



            }

            const totalMinutes1 = value1.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]

                return sum + hours * 60 + minutes;

            }, 0);



            const hours1 = Math.floor(totalMinutes1 / 60)

            const minutes1 = totalMinutes1 % 60;

            let formattedHours1 = String(hours1).padStart(2, "0");

            let formattedMinutes1 = String(minutes1).padStart(2, "0")



            getData[i].totalApprovehours = `${formattedHours1}:${formattedMinutes1}`;



            //totalRejectHours

            let value2 = []

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (getData[i].appDetails[j].dayWiseRejHours != '') {

                    value2.push(getData[i].appDetails[j].dayWiseRejHours)

                }



            }

            const totalMinutes2 = value2.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]

                return sum + hours * 60 + minutes;

            }, 0);



            const hours2 = Math.floor(totalMinutes2 / 60)

            const minutes2 = totalMinutes2 % 60;

            let formattedHours2 = String(hours2).padStart(2, "0");

            let formattedMinutes2 = String(minutes2).padStart(2, "0")



            getData[i].totalRejecthour = `${formattedHours2}:${formattedMinutes2}`;





            //totalActualOvertimeHours

            let value3 = []

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (getData[i].appDetails[j].actualOtHrs != '') {

                    value3.push(getData[i].appDetails[j].actualOtHrs)

                }

            }

            const totalMinutes3 = value3.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]

                return sum + hours * 60 + minutes;

            }, 0);



            const hours3 = Math.floor(totalMinutes3 / 60)

            const minutes3 = totalMinutes3 % 60

            let formattedHours3 = String(hours3).padStart(2, "0");

            let formattedMinutes3 = String(minutes3).padStart(2, "0")

            getData[i].totalActualOtHrs = `${formattedHours3}:${formattedMinutes3}`;



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



        for (let i = 0; i < getData.length; i++) {

            getData[i].totalPaidHoliday = (getData[i].totalPaidHoliday) - (getData[i].totalRejectedSunday)

            getData[i].totalPaidHoliday = `0${getData[i].totalPaidHoliday.toString()}`

        }



        // let otArr = []

        // getData.filter((e, i) => {

        //     if (e.totalActualOtHrs != '00:00' || e.totalApprovehours != '00:00') {

        //         otArr.push(e)

        //     }

        // })





        getData.sort((a, b) => a.empName.localeCompare(b.empName))

        // let limit = parseInt(req.body.limit) || 100

        let limit = parseInt(req.body.limit) || getData.length

        let pageNo = parseInt(req.body.pageNo) || 1

        let startIndex = (pageNo - 1) * limit;

        let endIndex = startIndex + limit;

        let paginatedData = getData.slice(startIndex, endIndex);



        let overTimeEditReportExcelSheet = paginatedData.map((e, i) => ({

            'Sl. No.': Number(i + 1),

            'Employee Name': e.empName,

            'Employee Code': e.empCode,

            'Sub Company': e.subCompanyName,

            'Branch Name': e.branchName,

            // 'Designation':e.designation,

            'Department': e.departmentName,

            'Sub Department': e.SubdepartmentName,

            'Location': e.location,

            'Type': e.type,

            'App': e.appDetails,

            // 'Actual Total OT Hours': e.actualTotalOtHours,

            // 'Actual Total OT Hours': e.actualOvertimeHours,

            // 'Monthly Approved OT Hours': e.monthyAprroveOtHours,

            'Actual Total OT Hours': changeSign(e.totalWorkingHour),

            'Monthly Approved OT Hours': changeSign(e.totalApprovehours),

        }))

        return res.status(200).send({

            status: true,

            recordedPerPage: limit,

            currentPage: pageNo,

            totalData: getData.length,

            // totalData: overTimeEditReportExcelSheet.length,

            // employee: paginatedData

            employee: overTimeEditReportExcelSheet

            // employee: overTimeEditReportExcel

        })

    }

    catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}









async function fetchData({ token,year, month }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json','x-cross-auth': token },

            method: 'POST',

            // url: 'http://localhost:3000/report/getOvertimeEditReportExcel',

            url:`${process.env.BASE_URL}/report/getOvertimeEditReportExcel`,

            data: { token,year, month }

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

        midHeader.push(convertDateDDMMYYYY(e.crtDate), '', '', '', '')

        // midHeader.push(e.crtDate)

        subHeader.push('Status', 'In Time', 'Out Time','Day Wise Edit OT','Day Wise Reject Hours')



        let startColumn = (appIndex + 1) + (i * 5)

        let endColumn = (startColumn + 4)

        let endRow = 1

        let startRow = 1

        mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)

        // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)

        // console.log(startColumn, endColumn);

    })



    // console.log(mergeColumn);



    header.splice(appIndex, 1, ...midHeader)



    subHeader.unshift(...new Array(appIndex).fill(''))





    values.push(header)

    values.push(subHeader)







    employee.forEach((e, i) => {

        let row = []



        row.push(e['Sl. No.'], e['Employee Name'], e['Employee Code'], e['Sub Company'], e['Branch Name'], e['Department'], e['Sub Department'], e['Location'], e['Type'],)

        e.App.forEach((x) => {

            let data = {



                // 'Sl No': e['Sl No'],

                // 'Employee Name': e['Employee Name'],

                // 'Employee Code': e['Employee Code'],

                // 'Sub Company': e['Sub Company'],

                // 'Branch Name': e['Branch Name'],

                // 'SubDepartment': e['SubDepartment'],

                // 'Location': e['Location'],

                // 'Type': e['Type'],

                'attStatus': attendanceStatus(x['attStatus']),

                // 'crtDate': x['crtDate'],

                'intime': x['intime'],

                'outTime': x['outTime'],

                'dayWiseEditOT': x['dayWiseEditOT'],

                'dayWiseRejHours': x['dayWiseRejHours'],

                // 'Actual Total OT Hours': e['Actual Total OT Hours'],

                // 'Monthly Approved OT Hours': e['Monthly Approved OT Hours'],



            }

            row.push(...Object.values(data))





        })

        row.push(e['Actual Total OT Hours'], e['Monthly Approved OT Hours'])

        values.push(row)



    })

    employee.map((e) => {

        delete e['SubDepartment']

    })



    worksheet.addRows(values)



    mergeColumn.forEach((e, i) => {

        worksheet.mergeCells(e)

    })





    

    worksheet.eachRow((row) => {

        row.eachCell((cell) => {

            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

            cell.border = {

                top: { style: 'thin' },

                left: { style: 'thin' },

                bottom: { style: 'thin' },

                right: { style: 'thin' },

            };

            row.height = 40

        });

    });



    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }

        // cell.alignment = { horizontal: 'center', vertical: 'middle' };

        cell.font = { bold: true };



    });



    const headerRow2 = worksheet.getRow(2);





    headerRow2.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }

        // cell.alignment = { horizontal: 'center', vertical: 'middle'};

        cell.font = { bold: true };

        // cell.border{}

    });



    worksheet.columns.forEach(column => {

        column.width = 20;

    });

  





    // return workbook.xlsx

    const buffer = await workbook.xlsx.writeBuffer();

    // const blob = new Blob([buffer], { type: ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') });

    // return blob;

    return buffer

}





async function getOvertimeEditReportExcelSheet(req, res) {



    try {

        let token = req.headers["x-cross-auth"]

        let year = (req.body.year || req.query.year)

        let month = (req.body.month || req.query.month)



        let apiData = await fetchData({ token,year, month })

        if (apiData.employee.length == 0) {

            return res.status(400).send({ status: false, msg: 'no data found' })

        }

        let excelBuffer = await createExcelFile(apiData);



        // const excelArrayBuffer = await excelBuffer.arrayBuffer();

        // const excelBufferCopy = Buffer.from(excelArrayBuffer);



        







        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="OvertimeEditReport.xlsx"`);





        // (await getExcel).write(res)

        res.end(excelBuffer);



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getOvertimeEditReportExcel, getOvertimeEditReportExcelSheet }







