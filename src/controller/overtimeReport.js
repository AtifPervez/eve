
let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')





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

const getLocationNameByLocationId = async (id, db) => {
    let location = await db.query('select location from eve_acc_locationmaster where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (location[0]) {
        let res = Object.values(location[0])
        let newRes = res.toString()
        return newRes
    }
}


//api
const getOvertimeReport = async (req, res) => {

    try {
        let data = req.body
        let { DB_NAME, month, year } = data

        let db = sequelize(DB_NAME)

        // limit = limit || 100

        if (!(month && year)) {
            return res.status(400).send({ status: false, msg: 'enter year and month' })
        }




        let getData = await sequelize(DB_NAME).query('select distinct  eve_acc_employee.id as empId, eve_acc_employee.employeeName as empName ,eve_acc_employee.employeeCode as empCode,eve_acc_employee.employeeBranchId as branchName ,eve_acc_employee.employeeBranchId as branchId,eve_acc_employee.employeeSubCompanyId as subCompanyName,eve_acc_employee.employeeSubCompanyId as subCompanyId,eve_acc_employee.employeeDepartmentId as departmentName,eve_acc_employee.employeeDepartmentId as deptId,eve_acc_employee.employeeDesignationId as designName,eve_acc_employee.employeeDesignationId as designId,eve_acc_employee.employeeSubDepartmentId as subDepartmentName, eve_acc_employee.employeeSubDepartmentId as subDepartmentId,eve_acc_employee.locationID as location,eve_acc_employee.employeeType,eve_acc_locationmaster.location as locationName                  from eve_acc_employee LEFT JOIN eve_acc_employee_attendence ON eve_acc_employee.id=eve_acc_employee_attendence.empId LEFT JOIN eve_acc_employee_compensatoryoff_alocation ON eve_acc_employee.id=eve_acc_employee_compensatoryoff_alocation.empId LEFT JOIN eve_acc_company_branch ON eve_acc_employee.employeeBranchId=eve_acc_company_branch.branchId  LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id=eve_hrm_employee_details.employeeId LEFT JOIN eve_acc_locationmaster on eve_acc_employee.locationID=eve_acc_locationmaster.id   where eve_acc_employee.status="A"', {
            replacements:
            {

            },
            type: QueryTypes.SELECT
        })



        /************************************************************************************** */
        //Case==creditSetting of employees



        let eve_self_registration = await sequelize(DB_NAME).query('select * from  eve_self_registration where status="A"', {
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData.length; i++) {
            let e = getData[i]
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
            if (e.locationName == null) {
                e.locationName = ''
            }
            if (e.location == null) {
                e.location = ''
            }
            if (e.empCode == null) {
                e.empCode = ''
            }
            if (e.subDepartmentId == null) {
                e.subDepartmentId = ''
            }

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
        let monthlySalaryDb = await sequelize(DB_NAME).query('select * from eve_acc_set_monthly_salary_employee_wise where status="A"', {
            type: QueryTypes.SELECT
        })

        let extra_duty_off_paid = await sequelize(DB_NAME).query('select * from  eve_acc_module_activation_master where status="A" && name=:name', {
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


            let eve_acc_extra_duty_encashment_calculation_setting = await sequelize(DB_NAME).query('select * from eve_acc_extra_duty_encashment_calculation_setting where status="A"', {
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

        let fixedWeeklyHolidayDb = await sequelize(DB_NAME).query('select * from eve_acc_company_fix_weekly_holiday where status="A"', {
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


        let companyWeeklyHolidayDb = await sequelize(DB_NAME).query('select * from eve_acc_company_weekly_holiday where status="A"', { type: QueryTypes.SELECT })


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
        let sandwich_leave = await sequelize(DB_NAME).query('select * from eve_acc_module_activation_master where status="A" && name="sandwich_leave"', { type: QueryTypes.SELECT })

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

            let empleaveType = await sequelize(DB_NAME).query('select * from eve_acc_leave_type where status="A" && id=:id', {
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
                intime: "-",
                outTime: "-",
                // workingHour: '',
                attStatus: "-",
                empDtStr: `${timestamp}`,
                backcolor: "-",
                title: "-",
                dayWiseEditOT: '',
                dayWiseRejHours: '',
                dayWisePendingHours: '',
                overTime: '',
                overtimeStatus: '',


            };
            appDetailsObj.push(newObj);
        }

        let employeeAttendance = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence where status="A"', {
            type: QueryTypes.SELECT
        })

        let employeeAttendanceApproved = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence_approved where status="A" ', {
            type: QueryTypes.SELECT
        })

        let eve_acc_company_holiday = await sequelize(DB_NAME).query('select * from eve_acc_company_holiday where status="A" ', {
            type: QueryTypes.SELECT
        })
        let overtimeReport = await sequelize(DB_NAME).query('select * from eve_acc_employee_overtime_approved where status="A" ', {
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

                if (value.branchId == x.branchId) {
                    return true
                }
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

                        _appDetail.title = 'Approved'


                        _appDetail.backcolor = '#a4eab0'

                        _appDetail.dayWiseEditOT = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour



                        _appDetail.overTime = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour

                        _appDetail.overtimeStatus = 'A'

                    }

                    else if (targetObjOfOvertime.type == 'Reject') {

                        _appDetail.title = 'Rejected'

                        _appDetail.backcolor = '#f1bcbc'

                        _appDetail.dayWiseRejHours = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour



                        _appDetail.overTime = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour

                        _appDetail.overtimeStatus = 'C'

                    }


                    else if (targetObjOfOvertime.type == 'Pending') {

                        _appDetail.title = 'Pending'

                        _appDetail.backcolor = '#eadc94'

                        _appDetail.dayWisePendingHours = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour

                        // _appDetail.backcolor='#EADC94'

                        _appDetail.overTime = targetObjOfOvertime.editOTday = targetObjOfOvertime.editOTday !== null ? targetObjOfOvertime.editOTday : targetObjOfOvertime.workingHour

                        _appDetail.overtimeStatus = 'W'
                    }


                    if (targetObjOfOvertime.workingHour !== null) {
                        _appDetail.workingHour = targetObjOfOvertime.workingHour
                    }


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

                        // _appDetail.workingHour = `${differenceHours}:${differenceMinutes}`
                    }
                }

                // if ((targetObjOfApproved) && (sandwich_leave.length > 0)) {

                //     if (targetObjOfApproved.type == "full") {
                //         _appDetail.backcolor = "#a4eab0"
                //         _appDetail.title = "Present";
                //         _appDetail.attStatus = "P"
                //         getData[i].totalFullDay++

                //     }



                //     else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remark != "Second Half") {
                //         _appDetail.attStatus = "AB"
                //         _appDetail.backcolor = "#f1bcbc"
                //         _appDetail.title = "Absent";
                //         getData[i].totalReject++
                //     }




                //     else if (targetObjOfApproved.type == "half") {
                //         _appDetail.attStatus = "H"
                //         _appDetail.backcolor = "#b1b82c"
                //         _appDetail.title = "Halfday";
                //         getData[i].totalHalfDay++

                //     }




                //     else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {


                //         let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId)

                //         // _appDetail.backcolor = leaveResult.colorCode
                //         // _appDetail.title = leaveResult.name
                //         // _appDetail.attStatus = leaveResult.prefix
                //         // getData[i].totalPaidLeave++

                //         if (targetObjOfApproved.flagRemarks == "ForLateClockIn") {
                //             _appDetail.title = " For Late ClockIn";
                //             _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"

                //         }

                //     }




                //     else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE" && targetObjOfApproved.leaveTypeId == '') {
                //         _appDetail.attStatus = "D-PL"
                //         _appDetail.backcolor = "#85eaea"
                //         _appDetail.title = "Default Paid Leave";
                //         getData[i].totalPaidLeave++
                //     }





                //     else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {
                //         _appDetail.attStatus = "UL"
                //         _appDetail.backcolor = "#f17171"
                //         _appDetail.title = "Unpaid Leave";
                //         getData[i].totalUnpaidLeave++
                //     }



                //     else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
                //         _appDetail.attStatus = 'HD-PL'
                //         _appDetail.backcolor = '#ffa742'
                //         _appDetail.title = 'Halfday Paid Leave';
                //         getData[i].totalHalfdayPaidLeave++;
                //     }




                // else if (targetObjOfApproved.type == 'reject' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
                //     _appDetail.attStatus = 'HD-UL'
                //     _appDetail.backcolor = '#b0f320'
                //     _appDetail.title = 'Halfday unpaid Leave';
                //     getData[i].totalHalfdayunpaidLeave++;
                // }



                // else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks != 'L LEAVE' && targetObjOfApproved.remarks != 'First Half' && targetObjOfApproved.remarks != 'Second Half') {
                //     _appDetail.attStatus = 'MHD'
                //     _appDetail.backcolor = '#ccffcc'
                //     _appDetail.title = 'Marked as Holiday';
                //     getData[i].totalMarkedAsHoliday++
                // }




                //     else if (targetObjOfApproved.type == "sunday reject") {
                //         _appDetail.attStatus = "AB"
                //         _appDetail.backcolor = "#f1bcbc"
                //         _appDetail.title = "Absent";
                //         getData[i].totalReject++
                //     }
                // }


                // else {

                //     _appDetail.attStatus = "-";
                //     _appDetail.backcolor = "#fff";
                //     _appDetail.title = "";

                //     if (targetObjOfCompanyHoliday) {
                //         _appDetail.backcolor = "#09ff00";
                //         getData[i].totalPaidHoliday++
                //     }

                //     else if (moment(_appDetail.crtDate).format('dddd') == getData[i].fixedWeeklyOffDay) {
                //         _appDetail.attStatus = "-";
                //         _appDetail.backcolor = "#e8e4e4";
                //         _appDetail.title = "Off Day";

                //         // getData[i].totalOffDay++
                //         getData[i].totalPaidHoliday++
                //     }

                //     else if (
                //         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[0]
                //         ||
                //         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[1]
                //         ||
                //         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[2]
                //         ||
                //         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[3]
                //         ||
                //         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[4]

                //     ) {
                //         _appDetail.attStatus = "-";
                //         _appDetail.backcolor = "#e8e4e4";
                //         _appDetail.title = "Off Day";
                //         // getData[i].totalOffDay++
                //         getData[i].totalPaidHoliday++
                //     }
                // }

                value.appDetails = _appDetailsObj
            }
        }


        // TotalWorkingHours
        // let formattedHours
        // let formattedMinutes

        for (let i = 0; i < getData.length; i++) {
            //     let value = []
            //     for (let j = 0; j < NoOfdaysInMonth; j++) {
            //         if (getData[i].appDetails[j].workingHour != '') {
            //             value.push(getData[i].appDetails[j].workingHour)
            //         }

            //     }

            //     const totalMinutes = value.reduce((sum, time) => {
            //         const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
            //         return sum + hours * 60 + minutes;
            //     }, 0);

            //     const hours = Math.floor(totalMinutes / 60)
            //     const minutes = totalMinutes % 60;
            //     formattedHours = String(hours).padStart(2, "0");
            //     formattedMinutes = String(minutes).padStart(2, "0")

            //     getData[i].totalWorkingHour = `${formattedHours}:${formattedMinutes}`;






            //TOTAL APPROVE HOURS

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

            if (getData[i].totalApprovehours == 'NaN:NaN') {
                getData[i].totalApprovehours = '00.00'
            }

            //TOTAL REJECTED HOURS
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

            //Total pending hours

            let value3 = []
            for (let j = 0; j < NoOfdaysInMonth; j++) {
                if (getData[i].appDetails[j].dayWisePendingHours != '') {
                    value3.push(getData[i].appDetails[j].dayWisePendingHours)
                }

            }
            const totalMinutes3 = value3.reduce((sum, time) => {
                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
                return sum + hours * 60 + minutes;
            }, 0);

            const hours3 = Math.floor(totalMinutes3 / 60)
            const minutes3 = totalMinutes3 % 60;
            let formattedHours3 = String(hours3).padStart(2, "0");
            let formattedMinutes3 = String(minutes3).padStart(2, "0")

            getData[i].totalPendinghours = `${formattedHours3}:${formattedMinutes3}`;

            let value4 = []
            for (let j = 0; j < NoOfdaysInMonth; j++) {
                if (getData[i].appDetails[j].overTime != '') {
                    value4.push(getData[i].appDetails[j].overTime)
                }

            }
            const totalMinutes4 = value4.reduce((sum, time) => {
                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
                return sum + hours * 60 + minutes;
            }, 0);

            const hours4 = Math.floor(totalMinutes4 / 60)
            const minutes4 = totalMinutes4 % 60;
            let formattedHours4 = String(hours4).padStart(2, "0");
            let formattedMinutes4 = String(minutes4).padStart(2, "0")

            getData[i].totalOvertime = `${formattedHours4}:${formattedMinutes4}`;

            //******************************************************************************************************************************** */
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
        
          getData.map((e)=>{

            delete e.totalFullDay
            delete e.totalHalfDay
            delete e.totalReject
            delete e.totalRejectedSunday
            delete e.totalPaidLeave
            delete e.totalUnpaidLeave
            delete e.totalHalfdayPaidLeave
            delete e.totalHalfdayunpaidLeave
            delete e.totalMarkedAsHoliday
            delete e.totalWorkingHour
            // delete e.totalFullDay
            // delete e.totalFullDay
            // delete e.totalFullDay
            delete e.totalPaidHoliday

        })

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
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = searchEmp.slice(startIndex, endIndex);

        searchEmp.map((e, i) => {
            e.slno = Number(i + 1)

        })
        // console.log(paginatedData);
        return res.status(200).send({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: getData.length,
            employee: paginatedData
        })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getOvertimeReport }



