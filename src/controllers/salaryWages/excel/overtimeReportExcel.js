let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const getOvertimeReportExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { year, month, api, empId } = data

        if (!year && !month) {
            return res.status(400).send({ status: false, msg: 'enter the month and year' })
        }
        let countQuery = await db.query(`
                                       SELECT COUNT(*) AS total
                                       FROM eve_acc_employee
                                       WHERE status='A'
                                       AND isOvertimeApplicable='yes'
                                       AND employeeType='Blue Collar'
                                   
                                       AND (employeeCurrentStatus = '' 
                                       OR employeeCurrentStatus IS NULL 
                                       OR employeeCurrentStatus = 'Active'
                                       OR employeeCurrentStatus = 'resignation' 
                                       OR employeeCurrentStatus = 'joining'
                                       OR employeeCurrentStatus = 'termination'
                                       OR employeeCurrentStatus = 'release' 
                                       OR employeeCurrentStatus = 'offerletter')

                                       AND (:empId is null or id=:empId)                                       
        `, {
            replacements: {
                empId: empId || null

            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

       if (totalData === 0) {
          return res.status(200).json({ status: true, result:'error', alert: 'Payroll not generated'})
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
        employeeType,
        salaryTemplateId
        FROM eve_acc_employee
        CROSS JOIN (SELECT @row_number := :offset) AS init
        WHERE status='A'
        AND isOvertimeApplicable='yes'
        AND employeeType='Blue Collar'
      
        AND (employeeCurrentStatus = '' 
        OR employeeCurrentStatus IS NULL 
        OR employeeCurrentStatus = 'Active'
        OR employeeCurrentStatus = 'resignation' 
        OR employeeCurrentStatus = 'joining'
        OR employeeCurrentStatus = 'termination'
        OR employeeCurrentStatus = 'release' 
        OR employeeCurrentStatus = 'offerletter')

          AND (:empId is null or id=:empId)

        ORDER BY employeeName
        LIMIT :limit
        OFFSET :offset`,
            {
                replacements: {
                    limit: limit,
                    offset: offset,
                    empId: empId || null

                },
                type: QueryTypes.SELECT
            })


        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)


        await Promise.all(getData.map(async (e, i) => {

            e.fixedWeeklyHoliday = await myFunc.getFixWeeklyOffDay(e.empId, e.employeeBranchId, db)
            e.additionalWeeklyHoliday = await myFunc.additionalWeeklyOffDay(e.empId, e.employeeBranchId, year, month, db)


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
                    date: moment(`${year}-${month}-${number}`).format('dddd'),
                    intime: "--",
                    outTime: "--",
                    workingHour: '--',
                    attStatus: "--",
                    empDtStr: `${timestamp}`,
                    backcolor: "--",
                    title: "--",
                    approvedOtHrs: '--',
                    approvedOtHrsFrTotal: '--',
                    rejectOtHrs: '--',
                    actualOtHrs: '--',
                    officeSchedulehrs: '--',
                    editOtHrs:'--'

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
                                            AND intime != ''
                                            AND outTime != ''
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


            let totalActualOtHrsArr = [];

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

                    // else {
                    //     detail.officeSchedulehrs = '00:00'; // or any default value
                    // }

                    // detail.officeSchedulehrs=myFunc.calculateWorkingHours(a.clockInTime,a.clockOutTime)



                    detail.workingHour = myFunc.calculateWorkingHours(detail.intime, detail.outTime)

                    if (detail.workingHour > detail.officeSchedulehrs) {

                        if (detail.workingHour !== '--' && detail.officeSchedulehrs !== '--') {




                            detail.actualOtHrs = myFunc.subtractTime(detail.workingHour, detail.officeSchedulehrs)

                        }


                    }

                    if (detail.date === e.fixedWeeklyHoliday) {
                        detail.actualOtHrs = detail.workingHour
                    }


                    e.additionalWeeklyHoliday.map(holiday => {
                        if (detail.crtDate === holiday) {
                            detail.actualOtHrs = detail.workingHour
                        }
                    })
                    if (detail.actualOtHrs !== '--') {

                        totalActualOtHrsArr.push(detail.actualOtHrs)
                    }
                }
            }))
            e.totalActualOtHrs = myFunc.addTimes(totalActualOtHrsArr)


            let empAttendanceApproved = await db.query(`
                       SELECT editOTday,date,type,workingHour
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

                    // if (attendanceApprovedRecord.type === 'Approve') {
                    //     approvedOtHrsFrTotal = x.approvedOtHrs
                    // }
                    if (attendanceApprovedRecord.editOTday) {
                        x.approvedOtHrs = attendanceApprovedRecord.editOTday
                        x.editOtHrs = attendanceApprovedRecord.editOTday

                    }
                    else if (attendanceApprovedRecord.workingHour) {
                        x.approvedOtHrs = attendanceApprovedRecord.workingHour
                    }
                    else if (attendanceApprovedRecord.type === 'Approve' && attendanceApprovedRecord.editOTday === null && attendanceApprovedRecord.workingHour === null) {

                        x.approvedOtHrs = x.actualOtHrs
                    }

                    if (attendanceApprovedRecord.type === 'Approve') {
                        x.approvedOtHrsFrTotal = x.approvedOtHrs
                    }

                    if (x.approvedOtHrsFrTotal != '--') {

                        const [otHours, otMinutes] = x.approvedOtHrsFrTotal.split(':').map(Number);
                        totalApprovedOtMinutes += otHours * 60 + otMinutes;
                    }

                    if (attendanceApprovedRecord.type === 'Reject') {
                        if (attendanceApprovedRecord.editOTday) {
                            x.rejectOtHrs = attendanceApprovedRecord.editOTday
                        }
                        else if (attendanceApprovedRecord.workingHour) {
                            x.rejectOtHrs = attendanceApprovedRecord.workingHour
                        }
                        if (x.rejectOtHrs != '--' && x.rejectOtHrs != '00.00') {
                            const [otHours, otMinutes] = x.rejectOtHrs.split(':').map(Number);
                            totalRejectOtMinutes += otHours * 60 + otMinutes;
                        }

                    }
                }

            })
            const totalOtHours = Math.floor(totalApprovedOtMinutes / 60);
            const totalOtMinutes = totalApprovedOtMinutes % 60;
            const totalApprovedOtHrs = `${String(totalOtHours).padStart(2, '0')}:${String(totalOtMinutes).padStart(2, '0')}`;
            e.totalApprovedOtHrs = await myFunc.getCalculateRoundOffOvertimeEdit(totalApprovedOtHrs, db)

            let totalRejectOtHrs = Math.floor(totalRejectOtMinutes / 60)
            let totalRejectOtMins = totalRejectOtMinutes % 60
            let totalRejectedOtHrs = `${String(totalRejectOtHrs).padStart(2, '0')}:${String(totalRejectOtMins).padStart(2, '0')}`;
            e.totalRejectedOtHrs = totalRejectedOtHrs;



        }))
        let excelData = getData.map(e => ({
            'Sl. No.': e.slno,
            'Worker Name': e.employeeName,
            'Worker Code': e.employeeCode,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Location': e.locationName,
            'Type': e.employeeType,
            'App': e.appDetails,
            'Actual OT Hours': e.totalActualOtHrs,
            'Approved OT Hours': (e.totalApprovedOtHrs),
            'Rejected OT Hours': e.totalRejectedOtHrs,
        }))



        if (api === 'raw') {

            return res.status(200).json({
                status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData,
                employee: getData

            })
        }
        else if (api === 'excel') {

            return res.status(200).json({
                status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData,

                employee: myFunc.replaceEmptyValues(excelData)
            })
        }

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
            midHeader.push(myFunc.convertDateDDMMYYYY(e.crtDate), '', '', '', '', '')

            subHeader.push(
                'In Time',
                'Out Time',
                'Daily OT Hours',
                'Edited OT Hours',
                'Approved OT Hours',
                'Rejected OT Hours',
            )

            let startColumn = (appIndex + 1) + (i * 6)
            let endColumn = (startColumn + 5)

            mergeColumn.push(`${myFunc.getColumnLetter(startColumn)}1:${myFunc.getColumnLetter(endColumn)}1`)

        })

        header.splice(appIndex, 1, ...midHeader)

        subHeader.unshift(...new Array(appIndex).fill(''))
        subHeader.push('', '', '');  // Add three empty subheaders at the end

        values.push(header)
        values.push(subHeader)



        employee.forEach((e, i) => {
            let row = []

            row.push(e['Sl. No.'], e['Worker Name'], e['Worker Code'], e['Sub Company'], e['Branch'], e['Department'], e['Sub Department'], e['Location'], e['Type'],)
            e.App.forEach((x) => {
                let data = {
                    'In Time': x['intime'],
                    'Out Time': x['outTime'],
                    'Daily OT Hours': x['actualOtHrs'],
                    'Edited OT Hours': x['editOtHrs'],
                    // 'Edited OT Hours': x['approvedOtHrs'],
                    'Approved OT Hours': x['approvedOtHrsFrTotal'],
                    'Rejected OT Hours': x['rejectOtHrs'],
                }
                row.push(...Object.values(data))

            })
            row.push(e['Actual OT Hours'], e['Approved OT Hours'],
                e['Rejected OT Hours']
            )
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


        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `OvertimeReport_${year}_${month}_${Date.now()}.xlsx`;
        const customPathToDisplay = `${process.env.CUSTUM_PATH_DISPLAY}\\${fileName}`




        if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
        }

        const filePath = path.join(customPath, fileName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Save the file
        await workbook.xlsx.writeFile(filePath);

        // Insert file info into DB
        await db.query(
            `
                      INSERT INTO eve_blue_all_report_download_log (createdDate, createdSession, createdIp, excelFileUrl, status,expiryDate,excelName,type)
                      VALUES (NOW(), :session, :ip, :file,:status,:expiryDate, :excelName,:type)
                      `,
            {
                replacements: {

                    session: `${moment(month, 'MM').format('MMMM')} ${year}`,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    file: customPathToDisplay, // or use filePath if you want to store full path
                    status: 'A',
                    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days                                                   
                    // expiryDate: new Date(Date.now() + 1000 * 60), // 1 min                                                    
                    excelName: fileName,
                    type: 'Overtime Report'
                },
                type: QueryTypes.INSERT
            }
        );
        return res.status(200).json({
            status: true,
            result: "success",
            alert: 'Excel file generated successfully',
            filePath: `${customPathToDisplay}`, // Return path if needed on front-end
        });


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getOvertimeReportExcel }