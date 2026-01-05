let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const getOvertimeReportsHrWcExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        const tokenUserId = decodedToken.userId
        // const tokenUserId = '29'
        // let db = sequelize('59')

        let sqlQuery = await db.query(
            `
               SELECT employeeSubCompanyId,employeeBranchId
               FROM eve_acc_employee
               WHERE status='A'
               AND id=:id 
            `, {
            replacements: { id: tokenUserId }, type: QueryTypes.SELECT
        }
        )
        const tokenSubCompanyId = sqlQuery[0]['employeeSubCompanyId']
        const tokenBranchUserId = sqlQuery[0]['employeeBranchId']


        let data = { ...req.body, ...req.query }
        let { year, month, empCode, empname, subCompanyId, branchId, departmentId, subDepartmentId, locationID, sortOrder, designation, api } = data

        sortOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        let countQuery = await db.query(`
                                       SELECT COUNT(*) AS total
                                       FROM eve_acc_employee AS a
        LEFT JOIN eve_acc_employee_overtime_report AS b ON (b.empId=a.id)
      
        WHERE a.status='A'

           -- AND a.employeeSubCompanyId=:tokenSubCompanyId
             -- AND a.employeeBranchId=:tokenBranchUserId

        -- AND a.isOvertimeApplicable='yes'
        AND (a.employeeType ='' OR a.employeeType IS NULL OR a.employeeType='White Collar')
        AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
        -- AND (:id IS NULL OR a.id=:id)
        AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
        AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
        AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
        AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
        AND (:designation  IS NULL OR a.employeeDesignationId=:designation )
        AND (:locationID IS NULL OR a.locationID=:locationID)
        AND (employeeCurrentStatus = '' OR employeeCurrentStatus IS NULL OR employeeCurrentStatus = 'Active' OR employeeCurrentStatus = 'joining' OR employeeCurrentStatus = 'offerletter')
        AND (:empname IS NULL OR a.employeeName=:empname)

          AND (
             b.appriserId=:tokenUserId
              OR
              b.appriserId=:tokenUserId
              OR
              b.managerId=:tokenUserId
               )

                                     
                                       
                                       
        `, {
            replacements: {
                employeeCode: empCode || null,
                employeeSubCompanyId: subCompanyId || null,
                empname: empname || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                locationID: locationID || null,
                designation: designation || null,
                tokenSubCompanyId: tokenSubCompanyId,
                tokenBranchUserId: tokenBranchUserId,
                tokenUserId: tokenUserId
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;




        let getData = await db.query(`
        SELECT 
        (@row_number := @row_number + 1) AS slno,
        empId,
        employeeName,
        employeeCode,
        employeeSubCompanyId,
        employeeBranchId,
        employeeDepartmentId,
        employeeSubDepartmentId,
        employeeDesignationId,
        locationID,
        employeeType,
        appriserId,
        reviewerId,
        managerId
        FROM (
        SELECT 
            a.id AS empId,
            a.employeeName,
            a.employeeCode,
            a.employeeSubCompanyId,
            a.employeeBranchId,
            a.employeeDepartmentId,
            a.employeeSubDepartmentId,
            a.employeeDesignationId,
            a.locationID,
            a.employeeType,
            b.appriserId,
            b.reviewerId,
            b.managerId
        FROM eve_acc_employee AS a
        LEFT JOIN eve_acc_employee_overtime_report AS b ON b.empId = a.id
        WHERE a.status = 'A'

          -- AND a.employeeSubCompanyId = :tokenSubCompanyId
          -- AND a.employeeBranchId = :tokenBranchUserId

          AND (
             b.appriserId=:tokenUserId
              OR
              b.appriserId=:tokenUserId
              OR
              b.managerId=:tokenUserId
               )

         -- AND a.isOvertimeApplicable = 'yes'
          AND (
              a.employeeType = '' OR a.employeeType IS NULL OR a.employeeType = 'White Collar'
          )
          AND (:employeeCode IS NULL OR a.employeeCode = :employeeCode)
          -- AND (:id IS NULL OR a.id = :id)
          AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId = :employeeSubCompanyId)
           AND (:designation  IS NULL OR a.employeeDesignationId=:designation )
          AND (:employeeBranchId IS NULL OR a.employeeBranchId = :employeeBranchId)
          AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId = :employeeDepartmentId)
          AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId = :employeeSubDepartmentId)
          AND (:locationID IS NULL OR a.locationID = :locationID)
            AND (:empname IS NULL OR a.employeeName=:empname)

            AND (employeeCurrentStatus = '' OR employeeCurrentStatus IS NULL OR employeeCurrentStatus = 'Active' OR employeeCurrentStatus = 'joining' OR employeeCurrentStatus = 'offerletter')

        ORDER BY a.employeeName ${sortOrder}
        LIMIT :limit OFFSET :offset
    ) AS sub
    CROSS JOIN (SELECT @row_number := 0) AS init
    ORDER BY slno
`, {
            replacements: {
                limit,
                offset,
                employeeCode: empCode || null,
                empname: empname || null,
                employeeSubCompanyId: subCompanyId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                locationID: locationID || null,
                designation: designation || null,
                tokenSubCompanyId,
                tokenBranchUserId,
                tokenUserId
            },
            type: QueryTypes.SELECT
        });




        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        await Promise.all(getData.map(async (e, i) => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.employeeType = e.employeeType === null ? 'White Collar' : e.employeeType
            e.employeeCode = e.employeeCode === null ? '' : e.employeeCode

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let empDtStrdate = new Date(`${year}-${month}-${number}`)
                let timestamp = Math.floor(empDtStrdate.getTime() / 1000)

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
                    officeSchedulehrs: '--',
                    approve: '--',
                    reject: '--',
                    pending: '--'

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


            // let totalWorkingMinutes = 0;
            // let totalActualOtHrsArr = [];

            let attendanceMap = new Map()

            empAttendance.map(record => attendanceMap.set(record.date, record))
            await Promise.all(e.appDetails.map(async detail => {
                if (attendanceMap.has(detail.crtDate)) {

                    let attendanceRecord = attendanceMap.get(detail.crtDate);
                    detail.intime = attendanceRecord.intime
                    detail.outTime = attendanceRecord.outTime

                    let a = await myFunc.getEmployeeWiseOfficeScheduleWages(e.empId, detail.crtDate, db)

                    if (a && a.clockInTime && a.clockOutTime) {
                        detail.officeSchedulehrs = myFunc.calculateWorkingHours(a.clockInTime, a.clockOutTime);
                    }
                    if (detail.intime != '' && detail.outTime != '')
                        detail.workingHour = myFunc.calculateWorkingHours(detail.intime, detail.outTime)

                    if (detail.workingHour > detail.officeSchedulehrs) {

                        if (detail.workingHour !== '--' && detail.officeSchedulehrs !== '--') {
                            detail.actualOtHrs = myFunc.subtractTime(detail.workingHour, detail.officeSchedulehrs)

                        }
                    }
                    // if (detail.actualOtHrs !== '--') {

                    // totalActualOtHrsArr.push(detail.actualOtHrs)

                    // }

                }


            }))
            // e.totalActualOtHrs = myFunc.addTimes(totalActualOtHrsArr)


            let empAttendanceApproved = await db.query(`
                       SELECT *
                       FROM eve_acc_employee_overtime_history
                       WHERE status='A'
                       AND empId=:empId
                        -- AND type IS NOT NULL
                        -- AND editOTday IS NOT NULL
                       AND YEAR(date) = :year
                       AND MONTH(date) = :month
                       `, {
                replacements: {
                    empId: e.empId,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            let approveArr = []
            let pendingArr = []
            let rejectArr = []
            let totalArr = []

            let attendanceApprovedMap = new Map()
            empAttendanceApproved.map(x => attendanceApprovedMap.set(x.date, x))

            e.appDetails.map(x => {

                if (attendanceApprovedMap.has(x.crtDate)) {

                    let attendanceApprovedRecord = attendanceApprovedMap.get(x.crtDate)




                    if (attendanceApprovedRecord.overtimeStatus === 'A') {
                        x.approve = myFunc.convertMinutesToHHMM(attendanceApprovedRecord.overTime_InMinute)
                        approveArr.push(x.approve)
                        totalArr.push(x.approve)
                    }
                    else if (attendanceApprovedRecord.overtimeStatus === 'W') {
                        x.pending = myFunc.convertMinutesToHHMM(attendanceApprovedRecord.overTime_InMinute)
                        pendingArr.push(x.pending)
                        totalArr.push(x.pending)

                    }
                    else if (attendanceApprovedRecord.overtimeStatus === 'C') {
                        x.reject = myFunc.convertMinutesToHHMM(attendanceApprovedRecord.overTime_InMinute)
                        rejectArr.push(x.reject)
                        totalArr.push(x.reject)
                    }

                }
            })

            e.totalApprove = myFunc.addTimes(approveArr)
            e.totalPending = myFunc.addTimes(pendingArr)
            e.totalReject = myFunc.addTimes(rejectArr)
            e.total = myFunc.addTimes(totalArr)

        }))
        if (api === 'raw') {

            return res.status(200).json({
                status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData, employee: getData
            })
        }
        let excelData = getData.map(e => ({
            'Sl. No.': e.slno,
            'Employee Name': e.employeeName,
            // 'Employee Code': e.employeeCode,
            'Sub Company': e.subCompanyName,
            // 'Branch': e.branchName,
            // 'Department': e.departmentName,
            // 'Sub Department': e.subDepartmentName,
            // 'Location': e.locationName,
            // 'Type': e.employeeType,
            'App': e.appDetails,
            'Approved': e.totalApprove,
            'Rejected': e.totalReject,
            'Pending': e.totalPending,
            'Total': e.total,
        }))

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Overtime Report');
        let values = []

        let header = Object.keys(excelData[0]);
        // worksheet.addRow(headers);
        let employee = myFunc.replaceEmptyValues(excelData)
        let subHeader = []
        let midHeader = []

        let appIndex = header.indexOf('App')

        let mergeColumn = []


        employee[0].App.forEach((e, i) => {
            midHeader.push(myFunc.convertDateDDMMYYYY(e.crtDate), '', '', '', '')

            subHeader.push(
                'In Time',
                'Out Time',
                'Approve',
                'Reject',
                'Pending',
            )


            let startColumn = (appIndex + 1) + (i * 5)
            let endColumn = (startColumn + 4)

            mergeColumn.push(`${myFunc.getColumnLetter(startColumn)}1:${myFunc.getColumnLetter(endColumn)}1`)

        })

        header.splice(appIndex, 1, ...midHeader)

        subHeader.unshift(...new Array(appIndex).fill(''))
        subHeader.push('', '', '');  // Add three empty subheaders at the end

        values.push(header)
        values.push(subHeader)



        employee.forEach((e, i) => {
            let row = []

            row.push(
                e['Sl. No.'],
                e['Employee Name'],
                // e['Worker Code'],
                e['Sub Company'],
                // e['Branch'],
                // e['Department'],
                // e['Sub Department'],
                // e['Location'],
                // e['Type'],
            )

            e.App.forEach((x) => {
                let data = {
                    'In Time': x['intime'],
                    'Out Time': x['outTime'],
                    'Approve': x['approve'],
                    'Rejected': x['reject'],
                    // 'Edited OT Hours': x['approvedOtHrs'],
                    'Pending': x['pending'],
                    // 'Rejected OT Hours': x['rejectOtHrs'],
                }
                row.push(...Object.values(data))

            })
            row.push(e['Approved'], e['Rejected'], e['Pending'], e['Total'])
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
                row.height = 20
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
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true };

        });

        worksheet.columns.forEach(column => {
            column.width = 30
        });
        // const lastRow = worksheet.lastRow;
        // lastRow.eachCell((cell, colNumber) => {
        //     cell.font = { bold: true };
        // });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Overtime Approvehr.xlsx');

        await workbook.xlsx.write(res);
        res.end();


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getOvertimeReportsHrWcExcel }


function roundDownToHour(timeStr) {
    const [hours, _] = timeStr.split(":");
    return `${hours.padStart(2, '0')}:00`;
}
