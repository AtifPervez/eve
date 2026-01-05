let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')


const getOvertimeReportExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        // const tokenUserId = '29'
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // let db = sequelize('59')


        let data = req.body
        let { year, month, empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID } = data



        if (!year && !month) {
            return res.status(400).send({ status: false, msg: 'enter the month and year' })
        }

        let countQuery = await db.query(`
                                       SELECT COUNT(*) AS total
                                       FROM eve_acc_employee
                                       WHERE status='A'
                                       AND isOvertimeApplicable='yes'
                                       AND employeeType='Blue Collar'
                                       AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
                                       AND (:id IS NULL OR id=:id)
                                       AND (:employeeSubCompanyId IS NULL OR employeeSubCompanyId=:employeeSubCompanyId)
                                       AND (:employeeBranchId IS NULL OR employeeBranchId=:employeeBranchId)
                                       AND (:employeeDepartmentId IS NULL OR employeeDepartmentId=:employeeDepartmentId)
                                       AND (:employeeSubDepartmentId IS NULL OR employeeSubDepartmentId=:employeeSubDepartmentId)
                                       AND (:locationID IS NULL OR locationID=:locationID)
                                       AND (employeeCurrentStatus = '' 
                                       OR employeeCurrentStatus IS NULL 
                                       OR employeeCurrentStatus = 'Active'
                                       OR employeeCurrentStatus = 'resignation' 
                                       OR employeeCurrentStatus = 'joining'
                                       OR employeeCurrentStatus = 'termination'
                                       OR employeeCurrentStatus = 'release' 
                                       OR employeeCurrentStatus = 'offerletter')
                                       
                                       
        `, {
            replacements: {
                employeeCode: empCode || null,
                id: empId || null,
                employeeSubCompanyId: subCompId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                locationID: locationID || null,
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
        SELECT
        (@row_number:=@row_number + 1) AS slno,
        id AS empId,
        employeeName,
        employeeCode,
        employeeSubCompanyId,
        employeeBranchId,
        employeeDepartmentId,
        employeeSubDepartmentId,
        locationID,
        employeeType
        FROM eve_acc_employee
        CROSS JOIN (SELECT @row_number := :offset) AS init
        WHERE status='A'
        AND isOvertimeApplicable='yes'
        AND employeeType='Blue Collar'
        AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
        AND (:id IS NULL OR id=:id)
        AND (:employeeSubCompanyId IS NULL OR employeeSubCompanyId=:employeeSubCompanyId)
        AND (:employeeBranchId IS NULL OR employeeBranchId=:employeeBranchId)
        AND (:employeeDepartmentId IS NULL OR employeeDepartmentId=:employeeDepartmentId)
        AND (:employeeSubDepartmentId IS NULL OR employeeSubDepartmentId=:employeeSubDepartmentId)
        AND (:locationID IS NULL OR locationID=:locationID)
        AND (employeeCurrentStatus = '' 
        OR employeeCurrentStatus IS NULL 
        OR employeeCurrentStatus = 'Active'
        OR employeeCurrentStatus = 'resignation' 
        OR employeeCurrentStatus = 'joining'
        OR employeeCurrentStatus = 'termination'
        OR employeeCurrentStatus = 'release' 
        OR employeeCurrentStatus = 'offerletter')
        ORDER BY employeeName
        LIMIT :limit
        OFFSET :offset`,
            {
                replacements: {
                    limit: limit,
                    offset: offset,
                    employeeCode: empCode || null,
                    id: empId || null,
                    employeeSubCompanyId: subCompId || null,
                    employeeBranchId: branchId || null,
                    employeeDepartmentId: departmentId || null,
                    employeeSubDepartmentId: subDepartmentId || null,
                    locationID: locationID || null,
                },
                type: QueryTypes.SELECT
            })


        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        await Promise.all(getData.map(async (e, i) => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.locationName = await myFunc.getLocationNameById(e.locationID, db)
            e.employeeType = e.employeeType === null ? 'White Collar' : e.employeeType
            e.employeeCode = e.employeeCode === null ? '' : e.employeeCode

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let empDtStrdate = new Date(`${year}-${month}-${number}`);
                let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    intime: "--",
                    outTime: "--",
                    workingHour: '--',
                    attStatus: "--",
                    empDtStr: `${timestamp}`,
                    backcolor: "--",
                    title: "--",
                    approvedOtHrs: '--',
                    rejectOtHrs: '--',
                    actualOtHrs: '--',

                };
                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            let empAttendance = await db.query(`
                                            SELECT 
                                            empId,
                                            date,
                                            intime,
                                            outTime
                                           
                                            FROM eve_acc_employee_attendence 
                                            WHERE status='A' 
                                            AND empId=:empId
                                            AND intime IS NOT NULL
                                            AND outTime IS NOT NULL
                                            AND YEAR(date) = :year
                                            AND MONTH(date) = :month
                                            
                                            
                                            
            `, {
                replacements: {
                    empId: e.empId,
                    year: year,
                    month: month,
                },

                type: QueryTypes.SELECT
            })


            let totalWorkingMinutes = 0;

            let attendanceMap = new Map()

            empAttendance.map(record => attendanceMap.set(record.date, record))
            e.appDetails.map(detail => {
                if (attendanceMap.has(detail.crtDate)) {

                    let attendanceRecord = attendanceMap.get(detail.crtDate);
                    detail.intime = attendanceRecord.intime
                    detail.outTime = attendanceRecord.outTime
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
                        let totalDiffHrs
                        let totalDiffMins=diffMinutes

                       if (diffMinutes < 10) {
                           totalDiffMins=diffMinutes
                          
                           diffMinutes = `0${diffMinutes}`
                       }
                       
                       if(diffHours>9){
                           
                           
                           diffHours=diffHours-9
                           totalDiffHrs=diffHours
                           if(diffHours<10){
                               diffHours=`0${diffHours}`
                           }
                           detail.workingHour=`${diffHours}:${diffMinutes}`
                           detail.actualOtHrs=`${diffHours}:${diffMinutes}`

                           totalWorkingMinutes += totalDiffHrs * 60 + totalDiffMins;
                          
                       }
                    }

                }
                const totalHours = Math.floor(totalWorkingMinutes / 60);
                const totalMinutes = totalWorkingMinutes % 60;
                const totalWorkingHrs = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}`;

                e.totalActualOtHrs = totalWorkingHrs;

            })

            let empAttendanceApproved = await db.query(`
                       SELECT editOTday,date,type
                       FROM eve_acc_employee_overtime_approved
                       WHERE status='A'
                       AND employeeId=:employeeId
                       AND type IS NOT NULL
                       AND editOTday IS NOT NULL
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

                    if (attendanceApprovedRecord.type === 'Approve') {
                        x.approvedOtHrs = attendanceApprovedRecord.editOTday

                        const [otHours, otMinutes] = x.approvedOtHrs.split(':').map(Number);
                        totalApprovedOtMinutes += otHours * 60 + otMinutes;

                    }
                    else if (attendanceApprovedRecord.type === 'Reject') {
                        x.rejectOtHrs = attendanceApprovedRecord.editOTday
                        const [otHours, otMinutes] = x.rejectOtHrs.split(':').map(Number);
                        totalRejectOtMinutes += otHours * 60 + otMinutes;

                    }
                }

            })
            const totalOtHours = Math.floor(totalApprovedOtMinutes / 60);
            const totalOtMinutes = totalApprovedOtMinutes % 60;
            const totalApprovedOtHrs = `${String(totalOtHours).padStart(2, '0')}:${String(totalOtMinutes).padStart(2, '0')}`;
            e.totalApprovedOtHrs = totalApprovedOtHrs;

            let totalRejectOtHrs = Math.floor(totalRejectOtMinutes / 60)
            let totalRejectOtMins = totalRejectOtMinutes % 60
            let totalRejectedOtHrs = `${String(totalRejectOtHrs).padStart(2, '0')}:${String(totalRejectOtMins).padStart(2, '0')}`;
            e.totalRejectedOtHrs = totalRejectedOtHrs;

           

        }))
        let overtimeReportsExcel = getData.map(e => ({
            'Sl. No.': e.slno,
            'Employee Name': e.employeeName,
            'Employee Code':e.employeeCode,
            'Sub Company':e.subCompanyName,
            'Branch':e.branchName,
            'Department':e.departmentName,
            'Sub Department':e.subDepartmentName,
            'Location':e.locationName,
            'Type':e.employeeType,
            'App':e.appDetails,
            'Actual OT Hours':e.totalActualOtHrs,
            'Approved OT Hours':e.totalApprovedOtHrs,
            'Rejected OT Hours':e.totalRejectedOtHrs,
        }))




        return res.status(200).json({
            status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData, 
            // employee: getData
            employee: myFunc.replaceEmptyValues(overtimeReportsExcel)
        })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}


async function fetchData({ token, year, month,pageNo,limit,empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID  }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            
            url:`${process.env.BASE_URL}/reports/getOvertimeReportsExcel`,
            data: { token, year, month,pageNo,limit,empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID }
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
        midHeader.push(myFunc.convertDateDDMMYYYY(e.crtDate), '', '')
       
        subHeader.push('Actual', 'Approved', 'Rejected')

        let startColumn = (appIndex + 1) + (i * 3)
        let endColumn = (startColumn + 2)
       
        mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
       
    })

   

    header.splice(appIndex, 1, ...midHeader)

    subHeader.unshift(...new Array(appIndex).fill(''))
    subHeader.push('', '', '');  // Add three empty subheaders at the end

    values.push(header)
    values.push(subHeader)



    employee.forEach((e, i) => {
        let row = []

        row.push(e['Sl. No.'], e['Employee Name'], e['Employee Code'], e['Sub Company'], e['Branch'], e['Department'], e['Sub Department'], e['Location'], e['Type'],)
        e.App.forEach((x) => {
            let data = {
                'Actual':x['workingHour'],
                'Approved': x['approvedOtHrs'],
                'Rejected': x['rejectOtHrs'],
            }
            row.push(...Object.values(data))
              
        })
        row.push(e['Actual OT Hours'], e['Approved OT Hours'],e['Rejected OT Hours'])
        values.push(row)

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
            row.height = 30
        });
    });

   


    const headerRow = worksheet.getRow(1);

    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };

    });

    const headerRow2 = worksheet.getRow(2);


    headerRow2.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle'};
        cell.font = { bold: true };
       
    });

    worksheet.columns.forEach(column => {
        column.width = 20;
    });
   
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer

}

async function getOvertimeReportExcelSheet(req, res) {

    try {
        let token = req.headers["x-cross-auth"]
        let year = (req.body.year || req.query.year)
        let month = (req.body.month || req.query.month)
        let pageNo = (req.body.pageNo || req.query.pageNo)
        let limit = (req.body.limit || req.query.limit)
        let empCode = (req.body.empCode || req.query.empCode)
        let empId = (req.body.empId || req.query.empId)
        let subCompId = (req.body.subCompId || req.query.subCompId)
        let branchId = (req.body.branchId || req.query.branchId)
        let departmentId = (req.body.departmentId || req.query.departmentId)
        let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
        let locationID = (req.body.locationID || req.query.locationID)

        let apiData = await fetchData({ token, year, month,pageNo,limit,empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID })
        if (!year && !month) {
            return res.status(400).send({ status: false, msg: 'enter the month and year' })
        }
        if (apiData.employee.length == 0) {
            return res.status(400).send({ status: false, msg: 'no data found' })
        }
        let excelBuffer = await createExcelFile(apiData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="OvertimeReports.xlsx"`);

        res.end(excelBuffer);

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })
    }
}





module.exports = { getOvertimeReportExcel,getOvertimeReportExcelSheet }