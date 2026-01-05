let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const phpUnserialize = require('php-serialize');

const moment = require('moment')





const getEmpMaster = async (req, res) => {

    try {

        let data = req.query

        let { DB_NAME } = req.body

        let { page, employeeGender, limit, employeeName } = data

        limit = limit || 100



        let name = await sequelize(DB_NAME).query('SELECT employeeName from eve_acc_employee LIMIT 100 OFFSET 0 ')



        name = name[0].map((value) => {

            return value.employeeName



        })



        let getData = await sequelize(DB_NAME).query('SELECT DISTINCT eve_acc_employee.id,eve_acc_employee.employeeName as name, eve_acc_employee.employeeAddress as address,eve_acc_employee.employeePincode as pincode,eve_acc_employee.employeeEmail as email,eve_acc_employee.employeeMobile as mobile ,eve_acc_employee.employeeGender as gender,eve_acc_employee.employeeDob as dob,eve_acc_employee.employeeDoj as doj,eve_acc_employee.employeeDesignation as designationNew,eve_acc_employee.employeeDesignationId as designationNewId,eve_acc_employee.employeeDepartment as departmentName,eve_acc_employee.employeeDepartmentid as departmentNameId,eve_acc_employee.employeeSubDepartmentId as subDepartment,eve_acc_employee.employeeSubCompanyId as subCompanyId,eve_acc_employee.employeeSubcompanyName as subCompanyName,eve_acc_employee.	employeeBranchName as empBranchName,eve_acc_employee.employeeBranchId,eve_acc_employee.createdDate as date,eve_acc_employee.employeeCode as employeeId,eve_hrm_employee_details.biometricAttendanceId,eve_hrm_employee_details.isBonusApplicable,eve_hrm_employee_details.isESICApplicable,eve_hrm_employee_details.isLabourLawApplicable, eve_hrm_employee_details.isOvertimeApplicable,eve_hrm_employee_details.isPFApplicable,eve_hrm_employee_details.isVCApplicable,eve_hrm_employee_details.attendanceType as haveAttendanceType,eve_hrm_employee_details.jobLocation as location,eve_acc_employee.firstPaymentStatus as madePayment,eve_acc_employee.employeeCurrentStatus as empStatus,eve_acc_employee.employeeCurrentStatus     FROM eve_acc_employee LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id=eve_hrm_employee_details.employeeId LEFT JOIN eve_acc_employee_salary ON eve_acc_employee.id=eve_acc_employee_salary.employeeId LEFT JOIN eve_hrm_employee_type_master ON eve_acc_employee.id=eve_hrm_employee_type_master.employeeId LEFT JOIN eve_acc_user_type ON eve_acc_employee. employeeSubCompanyId=eve_acc_user_type.companyId LEFT JOIN eve_acc_locationmaster ON eve_acc_employee.employeeSubCompanyId=eve_acc_locationmaster.subCompanyId  LEFT JOIN eve_acc_company_branch ON eve_acc_employee.employeeBranchId=eve_acc_company_branch.branchId LEFT JOIN eve_hrm_employee_status_details ON eve_acc_employee.id= eve_hrm_employee_status_details.empId  WHERE     employeeName IN(:name)   LIMIT :limit OFFSET :offset',





            {

                replacements:

                {

                    gender: employeeGender || ['male', 'female'],

                    name: employeeName || name,

                    // limit: +limit || 1000, offset: (2 * ((page || 1) - 1)),

                    limit: +limit || 1000, offset: (100 * ((page || 1) - 1)),

                },

                type: QueryTypes.SELECT

            })

        getData = getData.map((value, index) => {

            value.slno = Number(index) + 1

            return value

        })





        getData = getData.map((value, index) => {

            if (getData[index].attendanceType != '')

                value.haveAttendanceType = "yes"

            else {

                value.haveAttendanceType = "no"

            }

            return value

        })





        getData = getData.map((value) => {

            value.hasSalary = 'no'

            return value

        })





        getData = getData.map((value) => {

            value.subscription = ''

            return value

        })



        return res.status(200).send({

            recordedPerPage: limit || 100,

            totalData: getData.length,

            currentPage: page,

            employee: getData

        })

    }



    catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const getEmployeeAttendanceNewReport = async (req, res) => {



    try {

        let data=req.body

        

        

        let {  DB_NAME ,pageNo,limit,month, year} = data

        limit = limit || 100



        if (!(month && year)) {

            return res.status(400).send({ status: false, msg: 'enter year and month' })

        }



        let getData = await sequelize(DB_NAME).query('select distinct  eve_acc_employee_attendence.empId, eve_acc_employee.employeeName as empName ,eve_acc_employee.employeeCode as empCode,eve_acc_company_branch.branchName ,eve_acc_employee.employeeSubcompanyName as subCompanyName,eve_acc_employee.employeeBranchId as branchId    from eve_acc_employee LEFT JOIN eve_acc_employee_attendence ON eve_acc_employee.id=eve_acc_employee_attendence.empId LEFT JOIN eve_acc_employee_compensatoryoff_alocation ON eve_acc_employee.id=eve_acc_employee_compensatoryoff_alocation.empId LEFT JOIN eve_acc_company_branch ON eve_acc_employee.employeeBranchId=eve_acc_company_branch.branchId  LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id=eve_hrm_employee_details.employeeId where eve_acc_employee.status="A" LIMIT :limit OFFSET :offset', {

            replacements:

            {

               

                limit: +limit || 1000, offset: (100 * ((pageNo || 1) - 1)),

                

            },

            type: QueryTypes.SELECT

        })



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

        //!earningSalary

        //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise





        

        getData = getData.map((value) => {

            value.earningSalary = 0

            return value

        })

        let  monthlySalaryDb=   await sequelize(DB_NAME).query('select * from eve_acc_set_monthly_salary_employee_wise where status="A"', {

            type: QueryTypes.SELECT

        })

            

        

        // console.log(eve_acc_set_monthly_salary_employee_wise);





        for(let i=0;i<getData.length;i++){

            for(let j=0;j<monthlySalaryDb.length;j++){

                if(getData[i].empId==monthlySalaryDb[j].employeeId&&monthlySalaryDb[j].salaryAmount!=''&&monthlySalaryDb[j].type=='addition'){



                    getData[i].earningSalary+=parseFloat(monthlySalaryDb[j].salaryAmount)

                   

                }

                else if(getData[i].empId==monthlySalaryDb[j].employeeId&&monthlySalaryDb[j].salaryAmount!=''&&monthlySalaryDb[j].type=='deduction'){

                    getData[i].earningSalary-=parseFloat(monthlySalaryDb[j].salaryAmount)

                }

            



               

           

            }

        }

                                  

           //************************************************************************************************************//



           //getExtraDutyAmountByEmployeeId





                 async function getExtraDutyAmountByEmployeeId(){





                  }



                  async function moduleActivation (name){

                    let getData = await sequelize(DB_NAME).query('select * from  eve_acc_module_activation_master where status="A" && name=:name', {

                        replacements: {

                            name: name

                        },

                        type: QueryTypes.SELECT

                    })

                    return getData[0]

                  }

        

        

        



























        //********************************************************************//

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









        //******************************************************************//

        //additionalWeeklyOffDay



        function weeklyHolidayArrayFn(options) {



            let days = ['sunday', 'monday', 'tuesday', "wednesday", "thursday", 'friday', 'saturday']



            let { month, year, dayName, dayNoStr } = options

            let date = moment(`${year}-${month}-01`)

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











        //****************************************************************************//



        getData = getData.map((value) => {

            value.base64_empId = Buffer.from(value.empId || '').toString('base64')

            return value

        })





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





        let employeeAttendance = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence where status="A"', {

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











        let employeeAttendanceApproved = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence_approved where status="A" ', {

            type: QueryTypes.SELECT

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

            return value

        })

        getData = getData.map((value) => {

            value.totalHalfDay = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalReject = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalRejectedSunday = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalPaidLeave = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalUnpaidLeave = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalHalfdayPaidLeave = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalHalfdayPaidLeave = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalHalfdayunpaidLeave = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalMarkedAsHoliday = 0

            return value

        })

        getData = getData.map((value) => {

            value.totalWorkingHour = 0

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



            for (let j = 0; j < _appDetailsObj.length; j++) {

                let _appDetail = _appDetailsObj[j]



                let targetObj = employeeAttendanceId.find((e) => {

                    return (e.empId == value.empId && _appDetail.crtDate == e.date)

                })

                let targetObjOfApproved = empAttendanceIdOfApproved.find((e) => {

                    return (e.employeeId == value.empId && _appDetail.crtDate == e.date)

                })





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

                            workingHourInMin:''



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



                        _appDetail.workingHour = `${differenceHours}:${differenceMinutes}`

                    }

                }



                if (targetObjOfApproved) {

                    if (targetObjOfApproved.type == "full") {

                        _appDetail.backcolor = "#a4eab0"

                        _appDetail.title = "Present";

                        _appDetail.attStatus = "P"

                        getData[i].totalFullDay++



                    }



                    //*************************************************//



                    else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {





                        let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId)



                        _appDetail.backcolor = leaveResult.colorCode

                        _appDetail.title = leaveResult.name

                        _appDetail.attStatus = leaveResult.prefix

                        getData[i].totalPaidLeave++



                        if (targetObjOfApproved.flag == "ForLateClockIn") {

                            _appDetail.title = " For Late ClockIn";

                            _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"



                        }



                    }





                    else if (targetObjOfApproved.type == "half") {

                        _appDetail.backcolor = "#b1b82c"

                        _appDetail.title = "Halfday";

                        _appDetail.attStatus = "H"

                        getData[i].totalHalfDay++



                    }



                    else if (targetObjOfApproved.type == "sunday reject") {

                        _appDetail.backcolor = "#f1bcbc"

                        _appDetail.title = "Absent";

                        _appDetail.attStatus = "AB"

                    }

                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remark != "Second Half") {

                        _appDetail.backcolor = "#f1bcbc"

                        _appDetail.title = "Absent";

                        _appDetail.attStatus = "AB"

                        getData[i].totalReject++

                    }

                    else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE") {

                        _appDetail.attStatus = "D-PL"

                        _appDetail.backcolor = "#85eaea"

                        _appDetail.title = "Default Paid";

                        getData[i].totalPaidLeave++

                    }

                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {

                        _appDetail.attStatus = "UL"

                        _appDetail.backcolor = "#f17171"

                        _appDetail.title = "Unpaid";

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

                        _appDetail.attStatus = 'MHD'

                        _appDetail.backcolor = '#ccffcc'

                        _appDetail.title = 'Marked as Holiday';

                        getData[i].totalMarkedAsHoliday++

                    }



                    else {

                        _appDetail.attStatus = "-"

                        _appDetail.backcolor = '#fff'

                        _appDetail.title = "";



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

            // getData[i].inOutArr[j].workingHourInMin = `${formattedHours}:${formattedMinutes}`;



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

          

        for(let i=0;i<getData.length;i++){

            

            let n=getData[i].inOutArr.length



            for(let j=0;j<n;j++){



                let time1=getData[i].inOutArr[j].outTime

                let time2=getData[i].inOutArr[j].inTime



                getData[i].inOutArr[j].workingHourInMin=subtractTime(time1, time2)

                getData[i].inOutArr[j].workingHourInMin=convertTimeToMinutes(getData[i].inOutArr[j].workingHourInMin)



                

                

            }

        }



        

        //NetPaidDays

        getData = getData.map((value) => {

            value.NetPaidDays = NoOfdaysInMonth.toString()

            return value

        })











        let count = getData.length









        return res.status(200).send({  recordedPerPage: limit || 100,

            totalData: count,

            currentPage: pageNo,

            employee: getData })

    }

    catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_employee_attendence = async (req, res) => {

    try {

        let { DB_NAME } = req.body

        let getData = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })







    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}





const eve_acc_employee_attendence_approved = async (req, res) => {

    try {

        let { DB_NAME } = req.body

        let getData = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence_approved where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })







    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

const eve_acc_company_fix_weekly_holiday = async (req, res) => {

    try {

        let { DB_NAME } = req.body

        let getData = await sequelize(DB_NAME).query('select * from eve_acc_company_fix_weekly_holiday where status="A" ', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })







    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_leave_type = async (req, res) => {

    try {

        let { DB_NAME } = req.body

        let getData = await sequelize(DB_NAME).query('select * from eve_acc_leave_type where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_employee_salary = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_employee_salary where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_company_weekly_holiday = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_company_weekly_holiday where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_set_monthly_salary_employee_wise = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_set_monthly_salary_employee_wise where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_employee_overtime_approved = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_employee_overtime_approved where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_employee = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize('59').query('select * from  eve_acc_employee', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_department = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_department where status="A"', {

            type: QueryTypes.SELECT

        })



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_module_activation_master = async (req, res) => {

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_module_activation_master', {

            type: QueryTypes.SELECT

        })

        



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



const eve_acc_extra_duty_encashment_calculation_setting=async(req,res)=>{

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_extra_duty_encashment_calculation_setting where status="A"', {

            type: QueryTypes.SELECT

        })

        



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_incident_report=async(req,res)=>{

    try {

        let DB_NAME

        let getData = await sequelize('59').query('select * from  eve_incident_report where status="A"', {

            type: QueryTypes.SELECT

        })

        



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}







const eve_acc_employee_payslip_preview=async(req,res)=>{

    try {

        let DB_NAME

        let getData = await sequelize(DB_NAME).query('select * from  eve_acc_employee_payslip_preview where status="A"', {

            type: QueryTypes.SELECT

        })

        



        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_hrm_employee_asset_allotment_details=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_hrm_employee_asset_allotment_details where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })
        
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}

const eve_hrm_employee_asset_return_details=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_hrm_employee_asset_return_details where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_employee_resignation_list=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_employee_resignation_list where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_hrm_template_master=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_hrm_template_master where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}





const eve_acc_blue_coller_employee_payslip_preview=async(req,res)=>{

    try {

        let DB_NAME

        let getData = await sequelize('59').query('select * from eve_acc_blue_coller_employee_payslip_preview where status="A"',{



            type: QueryTypes.SELECT

        })

        getData.map((e)=>{

            e.salary_types=phpUnserialize.unserialize(e.salary_types)

            // e.employeeDetails=phpUnserialize.unserialize(e.employeeDetails)

            // e.daySummary=phpUnserialize.unserialize(e.daySummary)

            // e.allLeave=phpUnserialize.unserialize(e.allLeave)

            // e.otherAdvance=phpUnserialize.unserialize(e.otherAdvance)

            // e.allMediclaim=phpUnserialize.unserialize(e.allMediclaim)

            // e.allLoan=phpUnserialize.unserialize(e.allLoan)

            // e.salary_summary=phpUnserialize.unserialize(e.salary_summary)



        })

        let count = getData.length

        res.status(200).send({ totalData: count, data: getData })





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}





const eve_acc_custom_salary_set_payroll=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_acc_custom_salary_set_payroll where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_blue_employee_tds_amount=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_blue_employee_tds_amount where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_acc_leave_deduction_log=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_acc_leave_deduction_log where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}
const eve_hrm_employee_shift_master=async(req,res)=>{

    try {
        let DB_NAME
        let getData = await sequelize('59').query('select * from  eve_hrm_employee_shift_master where status="A"', {
            type: QueryTypes.SELECT
        })
        let count = getData.length
        res.status(200).send({ totalData: count, data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }

}







module.exports = {

    getEmpMaster,eve_incident_report,eve_hrm_employee_asset_allotment_details,eve_hrm_employee_asset_return_details,eve_hrm_employee_shift_master,

   
    eve_employee_resignation_list,eve_hrm_template_master,eve_acc_custom_salary_set_payroll,eve_blue_employee_tds_amount,

    eve_acc_employee_attendence,eve_acc_leave_deduction_log,

    eve_acc_company_fix_weekly_holiday,

    eve_acc_employee_attendence_approved,

    eve_acc_leave_type,

    eve_acc_employee_salary,

    eve_acc_company_weekly_holiday,

    eve_acc_set_monthly_salary_employee_wise,

    eve_acc_employee_overtime_approved,

    eve_acc_employee,

    eve_acc_department,

    eve_acc_module_activation_master,

    eve_acc_extra_duty_encashment_calculation_setting,

    eve_acc_employee_payslip_preview,

    eve_acc_blue_coller_employee_payslip_preview

}



















