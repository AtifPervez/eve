let sequelize = require("../../../config/db")
const { QueryTypes, NUMBER } = require('sequelize')
const moment = require('moment')
const axios = require('axios')
const ExcelJS = require('exceljs')
const myFunc = require('../../../functions/functions');



//php code - eve/hr_api/model/overtime-edit.php

const attendanceStatus = status => ({
    'P': 'Present',
    'AB': 'Absent',
    'H': 'Half Day',
    'D-PL': 'Default Paid Leave',
    'UL': 'Unpaid Leave',
    'HD-PL': 'Half Paid Leave',
    'HD-UL': 'Halfday unpaid Leave',
    'MHD': 'Marked as Holiday'
}[status] || '');

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
const convertDateDDMMYYYY = date => moment(date).format('DD-MM-YYYY')
const changeSign = x => x === '00:00' ? '--' : x

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

const getHrOvertimeEditExcel = async (req, res) => {

    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const userId = '29'
        // let db = sequelize('59')
        let data = req.body
        const { month, year, branchId, department, empId, employeeCode, location, subCompanyId, subDepart } = data
        const countQuery = await db.query(
            `
                                        SELECT COUNT(*) AS total
                                        FROM eve_acc_employee 
                                        
                                        WHERE status='A'  
                                            AND employeeType='Blue Collar'
                                       AND (:empId IS NULL OR REPLACE(id,'  ',' ')=REPLACE(:empId,'  ',' '))
                                       AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
                                       AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
                                       AND (:branchId IS NULL OR employeeBranchId=:branchId)
                                       AND (:department IS NULL OR employeeDepartmentId=:department)
                                          AND (:subDepart IS NULL OR employeeSubDepartmentId=:subDepart)
                                             AND (:location IS NULL OR locationID=:location)
                  
                
                        AND isOvertimeApplicable='yes'
                        AND (employeeCurrentStatus = '' 
                        OR employeeCurrentStatus IS NULL 
                        OR employeeCurrentStatus = 'Active' 
                        OR employeeCurrentStatus = 'joining' 
                        OR employeeCurrentStatus = 'offerletter')
                                    
                                     
                                    
                                      
            `, {
            replacements: {

                empId: empId || null,
                employeeCode: employeeCode || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                department: department || null,
                subDepart: subDepart || null,
                location: location || null,

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

        if (!(month && year)) {
            return res.status(400).send({ status: false, msg: 'enter year and month' })
        }

        let getData = await db.query(`
                                     SELECT
                      (@row_number:=@row_number + 1) AS 'slno',
                      id AS empId,
                      employeeName,
                      employeeDesignationId,
                      employeeSubDepartmentId,
                      employeeDepartmentId,
                      employeeCode,
                      employeeBranchId,
                      employeeSubCompanyId,
                      employeeBranchId ,
                      employeeType,
                      locationID

                    
                      FROM eve_acc_employee
                     
                       CROSS JOIN (SELECT @row_number := :offset) AS init
                      where status='A'
                      AND employeeType='Blue Collar'
                         AND (:empId IS NULL OR REPLACE(id,'  ',' ')=REPLACE(:empId,'  ',' '))
                         AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
                             AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
                                     AND (:branchId IS NULL OR employeeBranchId=:branchId)
                                         AND (:department IS NULL OR employeeDepartmentId=:department)
                                         AND (:subDepart IS NULL OR employeeSubDepartmentId=:subDepart)
                                         AND (:location IS NULL OR locationID=:location)
                  
                    AND isOvertimeApplicable='yes'
                    
                        AND (employeeCurrentStatus = '' 
                        OR employeeCurrentStatus IS NULL 
                        OR employeeCurrentStatus = 'Active' 
                        OR employeeCurrentStatus = 'joining' 
                        OR employeeCurrentStatus = 'offerletter')
                    ORDER BY employeeName
                        LIMIT   :limit
                                
                        OFFSET :offset

                        
                        `, {
            replacements:
            {
                offset: offset,
                limit: limit,
                empId: empId || null,
                employeeCode: employeeCode || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                department: department || null,
                subDepart: subDepart || null,
                location: location || null,
            },
            type: QueryTypes.SELECT
        })
        const sandwich_leave = await db.query(
            `
                                                 SELECT * FROM eve_acc_module_activation_master 
                                                 WHERE status='A' && name='sandwich_leave'
            `, { type: QueryTypes.SELECT })

        let totalDaysOfMOnth = getDaysInMonth(year, month);


        const daysInCurrentMonth = getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)


        await Promise.all(getData.map(async e => {
            const empShiftIdModel = await db.query(
                `
                                        SELECT shiftId FROM eve_hrm_employee_details
                                        WHERE status='A'
                                        AND employeeId=:employeeId   
                `, {
                replacements: {
                    employeeId: e.empId

                }, type: QueryTypes.SELECT
            }
            )

            if (empShiftIdModel.length > 0) {
                e.shiftId = empShiftIdModel[0]['shiftId']
            }
            else {
                e.shiftId = ''
            }





            const shiftMasterModel = await db.query(
                `

                             SELECT clockInTime,clockOutTime,minWorkingHour,name,id
                             FROM eve_hrm_employee_shift_master
                             WHERE status='A'
                             AND subCompanyId=:subCompanyId
                             AND branchId=:branchId
                             AND departmentId=:departmentId
                             AND id=:id



             `, {
                replacements: {
                    id: e.shiftId,
                    subCompanyId: e.employeeSubCompanyId,
                    branchId: e.employeeBranchId,
                    departmentId: e.employeeDepartmentId

                }, type: QueryTypes.SELECT
            }
            )


            e.minWorkingHour = "00:00"


            if (shiftMasterModel.length > 0) {

                let clockIn = shiftMasterModel[0]['clockInTime']
                let clockOut = shiftMasterModel[0]['clockOutTime']

                let [inHours, inMinutes] = clockIn.split(':').map(Number);
                let [outHours, outMinutes] = clockOut.split(':').map(Number);

                let inDate = new Date();
                inDate.setHours(inHours, inMinutes, 0);
                let outDate = new Date();
                outDate.setHours(outHours, outMinutes, 0);


                let diffMs = outDate - inDate;
                let diffHours = Math.floor(diffMs / 3600000);

                let diffMinutes = Math.floor((diffMs % 3600000) / 60000);
                if (diffMinutes < 10) {
                    diffMinutes = `0${diffMinutes}`
                }

                if (diffHours < 10) {
                    diffHours = `0${diffHours}`
                }
                e.minWorkingHour = `${diffHours}:${diffMinutes}`
            }





            const [hours, minutes] = e.minWorkingHour.split(':').map(Number);
            let minWorkingInMin = hours * 60 + minutes;





            e.subdepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.departmentName = await myFunc.departmentNameByDepartmentId(e.employeeDepartmentId, db)

            e.designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.LocationName = await myFunc.getLocationNameById(e.locationID, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {
                let number = i.toString().padStart(2, '0');

                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    intime: "--",
                    outTime: "--",
                    workingHour: '',
                    attStatus: "--",
                    dayWiseEditOT: '--',
                    dayWiseRejHours: '--',
                    actualOtHrs: '--',
                    status: '--',

                };
                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            const attendanceModel = await db.query(
                `                                 SELECT intime,outTime,date
                                                    FROM eve_acc_employee_attendence
                                                    WHERE status='A'
                                                    AND empId=:empId 
                                                    AND intime IS NOT NULL
                                                    AND outTime IS NOT NULL
                                                    AND YEAR(date) = :year
                                                    AND MONTH(date) = :month
 
                  `
                , {
                    replacements: {
                        empId: e.empId,
                        year: year,
                        month: month,
                    },
                    type: QueryTypes.SELECT
                }
            )
            let attendanceModelMap = new Map()
            let totalActaulOtInMins = 0


            attendanceModel.map(record => attendanceModelMap.set(record.date, record))
            e.appDetails.map(detail => {
                if (attendanceModelMap.has(detail.crtDate)) {
                    let attendanceRecord = attendanceModelMap.get(detail.crtDate);
                    detail.intime = attendanceRecord.intime
                    detail.outTime = attendanceRecord.outTime
                }
                if (detail.intime < detail.outTime) {

                    let [inHours, inMinutes] = detail.intime.split(':').map(Number);
                    let [outHours, outMinutes] = detail.outTime.split(':').map(Number);

                    let inDate = new Date();
                    inDate.setHours(inHours, inMinutes, 0);
                    let outDate = new Date();
                    outDate.setHours(outHours, outMinutes, 0);


                    let diffMs = outDate - inDate;



                    let diffHours = Math.floor(diffMs / 3600000);

                    let diffMinutes = Math.floor((diffMs % 3600000) / 60000);

                    if (diffMinutes < 10) {
                        diffMinutes = `0${diffMinutes}`
                    }

                    if (diffHours < 10) {
                        diffHours = `0${diffHours}`
                    }
                    detail.workingHour = `${diffHours}:${diffMinutes}`
                    // if (diffHours > 9) {

                    //     detail.actualOtHrs = `${diffHours - 9}:${diffMinutes}`
                    //     // detail.dayWiseEditOT = detail.actualOtHrs
                    // }

                    // else if(detail.workingHour!='--'){
                    let totalWorkingInMin = 0
                    const [otHours, otMinutes] = detail.workingHour.split(':').map(Number);
                    totalWorkingInMin = otHours * 60 + otMinutes
                    let actualOtMin = totalWorkingInMin - minWorkingInMin
                    // console.log(e.minWorkingHour);

                    let hrs = Math.floor(actualOtMin / 60)
                    let min = actualOtMin % 60

                    const actualOtHrs = `${String(hrs).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

                    if (e.minWorkingHour < detail.workingHour) {

                        detail.actualOtHrs = actualOtHrs
                    }




                    if (detail.actualOtHrs != '--') {
                        const [otHours, otMinutes] = detail.actualOtHrs.split(':').map(Number);
                        totalActaulOtInMins += otHours * 60 + otMinutes;
                    }


                }

                let totalActaulOtHrs = Math.floor(totalActaulOtInMins / 60)
                let totalActualOtMin = totalActaulOtInMins % 60
                const totalActualOtHrs = `${String(totalActaulOtHrs).padStart(2, '0')}:${String(totalActualOtMin).padStart(2, '0')}`;
                e.totalActualOtHrs = totalActualOtHrs

            })

            let empAttendanceApproved = await db.query(`
                       SELECT editOTday,date,type
                       FROM eve_acc_employee_overtime_approved
                       WHERE status='A'
                       AND employeeId=:employeeId
                     
                       AND YEAR(date) = :year
                       AND MONTH(date) = :month
                       `, {
                replacements: {
                    employeeId: e.empId,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })


            let totalApprovedOtMinutes = 0
            let totalRejectOtMinutes = 0
            let attendanceApprovedMap = new Map()
            empAttendanceApproved.map(x => attendanceApprovedMap.set(x.date, x))

            e.appDetails.map(x => {

                if (attendanceApprovedMap.has(x.crtDate)) {

                    let attendanceApprovedRecord = attendanceApprovedMap.get(x.crtDate)
                    x.status = attendanceApprovedRecord.type
                    if (attendanceApprovedRecord.type === 'Approve' && attendanceApprovedRecord.editOTday != '' && attendanceApprovedRecord.editOTday != null) {
                        x.dayWiseEditOT = attendanceApprovedRecord.editOTday


                    }

                   else if (attendanceApprovedRecord.type === 'Reject' && attendanceApprovedRecord.editOTday != '' && attendanceApprovedRecord.editOTday != null) {
                        x.dayWiseRejHours = attendanceApprovedRecord.editOTday


                    }
                    else if (attendanceApprovedRecord.type === 'Approve' && attendanceApprovedRecord.editOTday == null ) {
                        x.dayWiseEditOT = x.actualOtHrs

                    }
                }
                if (x.dayWiseEditOT != '--') {
                    const [otHours, otMinutes] = x.dayWiseEditOT.split(':').map(Number);
                    totalApprovedOtMinutes += otHours * 60 + otMinutes;

                }



                if (x.dayWiseRejHours != '--') {

                    const [otHours, otMinutes] = x.dayWiseRejHours.split(':').map(Number)
                    totalRejectOtMinutes += otHours * 60 + otMinutes;



                }
            })
            const totalOtHours = Math.floor(totalApprovedOtMinutes / 60);
            const totalOtMinutes = totalApprovedOtMinutes % 60;
            const totalApprovedOtHrs = `${String(totalOtHours).padStart(2, '0')}:${String(totalOtMinutes).padStart(2, '0')}`;
            e.totalApprovedOtHrs = totalApprovedOtHrs;

            const totalRejOtHours = Math.floor(totalRejectOtMinutes / 60)
            const totalRejOtMinutes = totalRejectOtMinutes % 60
            const totalRejOtHrs = `${String(totalRejOtHours).padStart(2, '0')}:${String(totalRejOtMinutes).padStart(2, '0')}`;
            e.totalRejOtHours = totalRejOtHrs



            // if (totalRejectOtMinutes === totalApprovedOtMinutes) {
            //     e.totalApprovedOtHrs = ''
            // }
            // else if (totalApprovedOtMinutes > totalRejectOtMinutes) {
            //     const result = totalApprovedOtMinutes - totalRejectOtMinutes
            //     const totalHours = Math.floor(result / 60)
            //     const totalMinutes = result % 60
            //     const timeFormat = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}`;
            //     e.totalApprovedOtHrs = timeFormat
            // }
            // else if (totalRejectOtMinutes > totalApprovedOtMinutes) {
            //     e.totalApprovedOtHrs = ''
            // }






            const attendanceApprovedModel = await db.query(
                `
                                           SELECT employeeId,date,type,remarks,leaveTypeId,flagRemarks
                                           FROM eve_acc_employee_attendence_approved
                                           WHERE status='A'
                                           AND YEAR(date) = :year
                                           AND MONTH(date) = :month   
                                           AND employeeId=:employeeId     

    `, {
                replacements: {
                    employeeId: e.empId,
                    year: year,
                    month: month,

                }, type: QueryTypes.SELECT
            }
            )

            let attApprovedMap = new Map()
            attendanceApprovedModel.map(record => attApprovedMap.set(record.date, record))
            e.appDetails.map(async x => {

                if (attApprovedMap.has(x.crtDate)) {
                    let result = attApprovedMap.get(x.crtDate)
                    if (result.type === 'full') {
                        x.attStatus = 'P'
                    }
                    else if (result.type == "reject" && result.remarks != "AB LEAVE" && result.remarks != "First Half" && result.remark != "Second Half") {
                        x.attStatus = "AB"
                    }
                    else if (result.type == "half") {
                        x.attStatus = "H"
                    }
                    else if (result.remarks == 'L LEAVE') {
                        let leaveResult = await myFunc.leaveType(result.leaveTypeId, db)
                        x.attStatus = leaveResult.prefix
                    }
                    else if (result.type == "holiday" && result.remarks == "L LEAVE" && result.leaveTypeId == '') {
                        x.attStatus = "D-PL"
                    }
                    else if (result.type == "reject" && result.remarks == "AB LEAVE") {
                        x.attStatus = "UL"
                    }
                    else if (result.type == 'holiday' && result.remarks == 'First Half' || result.remarks == 'Second Half') {
                        x.attStatus = 'HD-PL'
                    }
                    else if (result.type == 'reject' && result.remarks == 'First Half' || result.remarks == 'Second Half') {
                        x.attStatus = 'HD-UL'
                    }
                    else if (result.type == 'holiday' && result.remarks != 'L LEAVE' && result.remarks != 'First Half' && result.remarks != 'Second Half') {
                        x.attStatus = 'MHD'
                    }
                    else if (result.type == "sunday reject") {
                        x.attStatus = "AB"
                    }
                    else {
                        x.attStatus = '-'
                    }

                }
            })


        }))

        const hrOverTimeEditExcel = getData.map((e, i) => ({
            'Sl. No.': e.slno,
            'Worker Name': e.employeeName,
            'Worker Code': e.employeeCode,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            // 'Designation':e.designation,
            'Department': e.departmentName,
            'Sub Department': e.subdepartmentName,
            'Location': e.LocationName,
            'Type': e.employeeType,
            'App': e.appDetails,
            // 'Actual Total OT Hours': e.actualTotalOtHours,
            // 'Actual Total OT Hours': e.actualOvertimeHours,
            // 'Monthly Approved OT Hours': e.monthyAprroveOtHours,
            'Actual Total OT Hours': changeSign(e.totalActualOtHrs),
            'Monthly Approved OT Hours': changeSign(e.totalApprovedOtHrs),
            // 'Monthly Approved OT Hours': '--',
        }))
        return res.status(200).send({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: totalData,
            // totalData: overTimeEditReportExcelSheet.length,
            // employee: paginatedData
            // employee: overTimeEditReportExcelSheet
            employee: myFunc.replaceEmptyValues(hrOverTimeEditExcel)
            // employee: getData
        })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}




async function fetchData({ token, month, year, branchId, department, empId, employeeCode, location, subCompanyId, subDepart }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',

            url: `${process.env.BASE_URL}/sprint2/getHrOvertimeEditExcel`,

            data: { token, month, year, branchId, department, empId, employeeCode, location, subCompanyId, subDepart }
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
        subHeader.push('Status', 'In Time', 'Out Time', 'Day Wise Edit OT', 'Day Wise Reject Hours')

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

        row.push(e['Sl. No.'], e['Worker Name'], e['Worker Code'], e['Sub Company'], e['Branch'], e['Department'], e['Sub Department'], e['Location'], e['Type'],)
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
                // 'attStatus': attendanceStatus(x['attStatus']),
                'attStatus': (x['attStatus']),
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
            row.height = 15
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


async function getHrOvertimeEditExcelSheet(req, res) {

    try {
        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body };
        let { month, year, branchId, department, empId, employeeCode, location, subCompanyId, subDepart } = data


        let apiData = await fetchData({ token, year, month, branchId, department, empId, employeeCode, location, subCompanyId, subDepart })
        if (apiData.employee.length == 0) {
            return res.status(400).send({ status: false, msg: 'no data found' })
        }
        let excelBuffer = await createExcelFile(apiData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="hrOvertimeEditReport.xlsx"`);


        // (await getExcel).write(res)
        res.end(excelBuffer);

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getHrOvertimeEditExcel, getHrOvertimeEditExcelSheet }



