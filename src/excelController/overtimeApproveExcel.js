let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const moment = require('moment')

const axios = require('axios')

const ExcelJS = require('exceljs')

// const md = require('../middleWare/auth')

const jwt = require('jsonwebtoken');





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



function getDaysInMonth(year, month) {

    return new Date(year, month, 0).getDate();

}



function decode(token) {



    for (let i = 0; i < 3; i++) {

        token = Buffer.from(token, 'base64').toString('utf-8');

    }

    return token

}



function encode(token) {

    for (let i = 0; i < 3; i++) {

        token = Buffer.from(token, 'base64').toString('utf-8');

    }

    return token

}



function validateToken(token) {

    // Example: Check if the token follows a specific pattern or meets certain criteria

    // Replace this with your own validation logic

    const isValid = token.startsWith('Wlhs') && token.length > 20;



    return isValid;

}





function convertMinutesToHHMM(minutes) {

    // Calculate hours and remaining minutes

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;



    // Format hours and minutes with leading zeros

    const formattedHours = String(hours).padStart(2, '0');

    const formattedMinutes = String(remainingMinutes).padStart(2, '0');



    // Combine hours and minutes in the "hh:mm" format

    const formattedTime = `${formattedHours}:${formattedMinutes}`;



    return formattedTime;

}







//case 'getEmployeeOvertimeApprove'



const getEmployeeOvertimeApproveExcel = async (req, res) => {

    try {



        let data = req.body

        let { DB_NAME, month, year } = data

        let db = sequelize(DB_NAME)

        // let token = req.headers["x-cross-auth"]



        // if (!token) {

        //     return res.status(400).send({ status: false, msg: 'token must be present' })

        // }

        // {

        //     companyId: '59',

        //     userId: '29',

        //     branchId: '1',

        //     mainUserId: '1705',

        //     platform: 'web',

        //     loginStatus: 'true'

        //   }

        // let decodedToken = JSON.parse(decode(token))













        // const sessionUserId = decodedToken.userId

        const sessionUserId ='29'

        // const sessionCompanyId = decodedToken.userId

        // const sessionBranchId = decodedToken.userId

        // const sessionMainUserId = decodedToken.userId



        let checkAuth = await db.query('select * from eve_acc_employee where status="A" && id=:userId', {

            replacements: {

                userId: sessionUserId

            },

            type: QueryTypes.SELECT



        })





        // let getData = await db.query

        //     ('select distinct  eve_acc_employee.id as empId, eve_acc_employee.employeeName as empName ,eve_acc_employee.employeeCode as empCode,eve_acc_employee.employeeBranchId as branchName ,eve_acc_employee.employeeBranchId as branchId,eve_acc_employee.employeeSubCompanyId as subCompanyName,eve_acc_employee.employeeSubCompanyId as subCompanyId,eve_acc_employee.employeeDepartmentId as departmentName,eve_acc_employee.employeeDepartmentId as deptId,eve_acc_employee.employeeDesignationId as designName,eve_acc_employee.employeeDesignationId as designId,eve_acc_employee.employeeSubDepartmentId as subDepartmentName, eve_acc_employee.employeeSubDepartmentId as subDepartmentId,eve_acc_employee.locationID as location,eve_acc_employee.employeeType,eve_acc_locationmaster.location as locationName    from eve_acc_employee LEFT JOIN eve_acc_employee_attendence ON eve_acc_employee.id=eve_acc_employee_attendence.empId LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id=eve_hrm_employee_details.employeeId LEFT JOIN eve_acc_locationmaster on eve_acc_employee.locationID=eve_acc_locationmaster.id   where eve_acc_employee.status="A"', {

        //         replacements:

        //         {



        //         },

        //         type: QueryTypes.SELECT

        //     })







 let getData = await db.query

            ('select distinct  eve_acc_employee.id as empId, eve_acc_employee.employeeName as empName ,eve_acc_employee.employeeCode as empCode,eve_acc_employee.employeeBranchId as branchName ,eve_acc_employee.employeeBranchId as branchId,eve_acc_employee.employeeSubCompanyId as subCompanyName,eve_acc_employee.employeeSubCompanyId as subCompanyId,eve_acc_employee.employeeDepartmentId as departmentName,eve_acc_employee.employeeDepartmentId as deptId,eve_acc_employee.employeeDesignationId as designName,eve_acc_employee.employeeDesignationId as designId,eve_acc_employee.employeeSubDepartmentId as subDepartmentName, eve_acc_employee.employeeSubDepartmentId as subDepartmentId,eve_acc_employee.locationID as location,eve_acc_employee.employeeType,eve_acc_locationmaster.location as locationName    from eve_acc_employee LEFT JOIN eve_acc_employee_attendence ON eve_acc_employee.id=eve_acc_employee_attendence.empId LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id=eve_hrm_employee_details.employeeId LEFT JOIN eve_acc_locationmaster on eve_acc_employee.locationID=eve_acc_locationmaster.id   where eve_acc_employee.status="A" AND (eve_acc_employee.employeeCurrentStatus="" OR eve_acc_employee.employeeCurrentStatus IS NULL OR eve_acc_employee.employeeCurrentStatus="joining" OR eve_acc_employee.employeeCurrentStatus="offerletter" )', {

                replacements:

                {



                },

                type: QueryTypes.SELECT

            })

        await Promise.all(getData.map(async (e, i) => {



            // if (e.branchName != null && e.branchName != '') {

            //     e.branchName = await getBranchNameByBranchId(e.branchName, db)

            // }

            e.branchName = e.branchName != null ? await getBranchNameByBranchId(e.branchName, db) : ''

            e.branchName = !e.branchName ? '' : e.branchName





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

            // if (e.employeeType == null) {

            //     e.employeeType = ''

            // }

             if (e.employeeType == null) {

                e.employeeType = 'White Collar'

            }

            if(e.employeeType==''){

                e.employeeType='White Collar'

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

            e.slno = Number(i + 1)

        }))



        const daysInCurrentMonth = getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)



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

                empDtStr: `${timestamp}`,

                backcolor: "-",

                title: "-",

                overTime: '',

                overtimeStatus: '',





            };

            appDetailsObj.push(newObj);

        }



        let employeeAttendance = await sequelize(DB_NAME).query('select * from eve_acc_employee_attendence where status="A"', {

            type: QueryTypes.SELECT

        })



        let eve_acc_employee_overtime_history = await db.query('select * from eve_acc_employee_overtime_history where status="A" && (appriserId=:appriserId || reviewerId=:reviewerId || managerId=:managerId )', {

            replacements: {

                appriserId: sessionUserId,

                reviewerId: sessionUserId,

                managerId: sessionUserId,

            },

            type: QueryTypes.SELECT



        })



        let overTimeHistory = eve_acc_employee_overtime_history



        getData.map((value, i) => {



            let _appDetailsObj = JSON.parse(JSON.stringify(appDetailsObj))



            let employeeAttendanceId = employeeAttendance.filter((x) => {

                return value.empId == x.empId

            })



            let empOverTimeHistoryId = overTimeHistory.filter((x) => {

                return value.empId == x.empId

            })







            for (let j = 0; j < _appDetailsObj.length; j++) {



                let _appDetail = _appDetailsObj[j]



                let targetObj = employeeAttendanceId.find((e) => {

                    return (e.empId == value.empId && _appDetail.crtDate == e.date)

                })

                let OtHistoryObj = empOverTimeHistoryId.find((e) => {

                    return (e.empId == value.empId && _appDetail.crtDate == e.date)

                })

                if (targetObj) {

                    _appDetail.intime = targetObj.intime

                    _appDetail.outTime = targetObj.outTime

                }

                if (OtHistoryObj) {



                    _appDetail.overTime = convertMinutesToHHMM(OtHistoryObj.overTime_InMinute)



                    if (OtHistoryObj.overtimeStatus == 'A') {

                        _appDetail.overtimeStatus = 'A'

                        _appDetail.backcolor = '#f1bcbc'

                        _appDetail.title = 'Approved'

                    }

                    else if (OtHistoryObj.overtimeStatus == 'C') {

                        _appDetail.overtimeStatus = 'C'

                        _appDetail.backcolor = '#a4eab0'

                        _appDetail.title = 'Rejected'

                    }

                    else if (OtHistoryObj.overtimeStatus == 'W' || OtHistoryObj.overtimeStatus=='' && ((OtHistoryObj.appriserId == sessionUserId && OtHistoryObj.isAppriserAccepted == 'yes') || (OtHistoryObj.reviewerId == sessionUserId && OtHistoryObj.isReviewerAccepted == 'yes') || (OtHistoryObj.managerId == sessionUserId && OtHistoryObj.isManagerAccepted == 'yes'))) {

                        _appDetail.overtimeStatus = 'W'

                        _appDetail.backcolor = '#eadc94'

                        _appDetail.title = 'Pending'

                    }

                    else {

                        _appDetail.overtimeStatus = '-'

                        _appDetail.backcolor = '#fff'

                        _appDetail.title = ''



                    }





                }

                value.appDetails = _appDetailsObj

            }



        })

        let eve_acc_employee_overtime_report = await db.query('select empId from eve_acc_employee_overtime_report where status="A" && (appriserId=:appriserId || reviewerId=:reviewerId || managerId=:managerId )', {

            replacements: {

                appriserId: sessionUserId,

                reviewerId: sessionUserId,

                managerId: sessionUserId,

            },

            type: QueryTypes.SELECT



        })



        const empIdOtRprt = eve_acc_employee_overtime_report





        let result = getData.filter(data => empIdOtRprt.some(id => parseInt(id.empId) === data.empId));







        for (let i = 0; i < result.length; i++) {

            let e = result[i]





            //TOTAL PENDING

            let value = [];

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (result[i].appDetails[j].title == 'Pending') {

                    value.push(result[i].appDetails[j].overTime);

                }

            }

            const totalMinutes = value.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0];

                return sum + hours * 60 + minutes;

            }, 0);



            const hours = Math.floor(totalMinutes / 60);

            const minutes = totalMinutes % 60;

            const formattedHours = String(hours).padStart(2, "0");

            const formattedMinutes = String(minutes).padStart(2, "0");



            e.totalPending = `${formattedHours}:${formattedMinutes}`;





            //TOTAL APPROVED



            let value1 = [];

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (result[i].appDetails[j].title == 'Approved') {

                    value1.push(result[i].appDetails[j].overTime);

                }

            }

            const totalMinutes1 = value1.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0];

                return sum + hours * 60 + minutes;

            }, 0);



            const hours1 = Math.floor(totalMinutes1 / 60);

            const minutes1 = totalMinutes1 % 60;

            const formattedHours1 = String(hours1).padStart(2, "0");

            const formattedMinutes1 = String(minutes1).padStart(2, "0");



            e.totalApproved = `${formattedHours1}:${formattedMinutes1}`;



            //TOTAL REJECTED



            let value2 = [];

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (result[i].appDetails[j].title == 'Rejected') {

                    value2.push(result[i].appDetails[j].overTime);

                }

            }

            const totalMinutes2 = value2.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0];

                return sum + hours * 60 + minutes;

            }, 0);



            const hours2 = Math.floor(totalMinutes2 / 60);

            const minutes2 = totalMinutes2 % 60;

            const formattedHours2 = String(hours2).padStart(2, "0");

            const formattedMinutes2 = String(minutes2).padStart(2, "0");



            e.totalRejected = `${formattedHours2}:${formattedMinutes2}`;



            let value3 = [];

            for (let j = 0; j < NoOfdaysInMonth; j++) {

                if (result[i].appDetails[j].overTime !== '') {

                    value3.push(result[i].appDetails[j].overTime);

                }

            }

            const totalMinutes3 = value3.reduce((sum, time) => {

                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0];

                return sum + hours * 60 + minutes;

            }, 0);



            const hours3 = Math.floor(totalMinutes3 / 60);

            const minutes3 = totalMinutes3 % 60;

            const formattedHours3 = String(hours3).padStart(2, "0");

            const formattedMinutes3 = String(minutes3).padStart(2, "0");



            e.total = `${formattedHours3}:${formattedMinutes3}`;

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



        let searchEmp = result.filter((e, i) => {

            let boo = true

            for (let key in searchData) {

                if (searchData[key] && searchData[key] != e[key]) {

                    boo = false

                    break

                }

            }

            return boo

        })











        searchEmp.sort((a, b) => a.empName.localeCompare(b.empName));



        searchEmp.map((e, i) => {

            e.slno = Number(i + 1)



        })

        let limit = parseInt(req.body.limit) || getData.length

        let pageNo = parseInt(req.body.pageNo) || 1

        let startIndex = (pageNo - 1) * limit;

        let endIndex = startIndex + limit;

        let paginatedData = searchEmp.slice(startIndex, endIndex);





        let employeeByAuthentication = getData.filter((e, i) => {

            if (sessionUserId == e.empId) {

                return true

            }

        })



        if (paginatedData.length === 0) {

            return res.status(404).send({ status: false, msg: 'no data found', totalData: 0, employee: [], })

        }



        let excelSheetData=paginatedData.map((e,i)=>

        ({

            'Sl No': Number(i + 1),

            'Employee Name': e.empName,

            'Employee Code': e.empCode,

            'Sub Company': e.subCompanyName,

            'Branch Name': e.branchName,

            // 'Designation':e.designation,

            'Department': e.departmentName,

            'SubDepartment': e.subDepartmentName,

            'Location': e.locationName,

            'Type': e.employeeType,

            'App': e.appDetails,

            // 'Actual Total OT Hours': e.actualTotalOtHours,

            // 'Actual Total OT Hours': e.actualOvertimeHours,

            // 'Monthly Approved OT Hours': e.monthyAprroveOtHours,

            'Approved': e.totalApproved,

            'Rejected': e.totalRejected,

            'Pending': e.totalPending,

            'Total': e.total,

        })

        )

        





        return res.status(200).send({

            status: true,

            recordedPerPage: limit,

            currentPage: pageNo,

            totalData: paginatedData.length,

            // employee: paginatedData,

            employee: excelSheetData,

          

        

        })







    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}





async function fetchData({ token,year, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'POST',

        

            url:`${process.env.BASE_URL}/multiovertime/getEmployeeOvertimeApproveExcel`,

            data: {token, year, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location }

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

        // midHeader.push(e.crtDate, '', '', '', '')

        midHeader.push(e.crtDate, '', '', '')

        // midHeader.push(e.crtDate)

        // subHeader.push('Status', 'In Time', 'Out Time', 'dayWiseEditOT', 'dayWiseRejHours')

        // subHeader.push('Actual', 'Approved', 'Rejected')

        subHeader.push('In Time', 'Out Time', 'Over Time', 'Status')



        // let startColumn = (appIndex + 1) + (i * 5)

        let startColumn = (appIndex + 1) + (i * 4)

        console.log(startColumn);

        // let endColumn = (startColumn + 4)

        let endColumn = (startColumn + 3)

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



        row.push(e['Sl No'], e['Employee Name'], e['Employee Code'], e['Sub Company'], e['Branch Name'], e['Department'], e['SubDepartment'], e['Location'], e['Type'],)

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

                // 'attStatus': x['attStatus'],

                // 'crtDate': x['crtDate'],

                // 'intime': x['intime'],

                // 'outTime': x['outTime'],

                // 'In Time': x['workingHour'],

                'In Time': x['intime'],

                'Out Time': x['outTime'],

                'Over Time': x['overTime'],

                'Status': x['title']





            }

            row.push(...Object.values(data))





        })

        // 'Total OverTime': e.totalWorkingHour,

        // 'Total Approved Overtime': e.totalApprovehours,

        // 'Total Rejected Overtime':e.totalRejecthour

        // row.push(e['Actual OT Hours'], e['Approved OT Hours'],e['Rejected OT Hours'])

        row.push(e['Approved'], e['Rejected'], e['Pending'], e['Total'])

        values.push(row)



    })



    worksheet.addRows(values)



    mergeColumn.forEach((e, i) => {

        worksheet.mergeCells(e)

    })





    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }

        cell.alignment = { horizontal: 'center', vertical: 'middle' };

        cell.font = { bold: true };



    });



    const headerRow2 = worksheet.getRow(2);





    headerRow2.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }

        cell.alignment = { horizontal: 'center', vertical: 'middle' };

        cell.font = { bold: true };





    });



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

    for (let i = 1; i <= 1000; i++) {

        const column = worksheet.getColumn(i);

        column.width = 20; // Set the desired width in characters

    }





    // return workbook.xlsx

    const buffer = await workbook.xlsx.writeBuffer();

    // const blob = new Blob([buffer], { type: ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') });

    // return blob;

  

    return buffer

}





async function getEmployeeOvertimeApproveExcelSheet(req, res) {



    try {

        let token = req.headers["x-cross-auth"]

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

      

        // if (apiData.employee.length == 0) {

        //     return res.status(400).send({ status: false, msg: 'no data found' })

        // }

        let excelBuffer = await createExcelFile(apiData);



        // const excelArrayBuffer = await excelBuffer.arrayBuffer();

        // const excelBufferCopy = Buffer.from(excelArrayBuffer);



        if (month == '01') {

            month = 'Jan'

        }

        else if (month == '02') {

            month = 'Feb'

        }

        else if (month == '03') {

            month = 'March'

        }

        else if (month == '04') {

            month = 'Apr'

        }

        else if (month == '05') {

            month = 'May'

        }

        else if (month == '06') {

            month = 'June'

        }

        else if (month == '07') {

            month = 'July'

        }

        else if (month == '08') {

            month = 'Aug'

        }

        else if (month == '09') {

            month = 'Sep'

        }

        else if (month == '10') {

            month = 'Oct'

        }

        else if (month == '11') {

            month = 'Nov'

        }

        else if (month == '12') {

            month = 'Dec'

        }







        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="OvertimeReport(${month} ${year}).xlsx"`);





        // (await getExcel).write(res)

        res.end(excelBuffer);



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = {getEmployeeOvertimeApproveExcel, getEmployeeOvertimeApproveExcelSheet }