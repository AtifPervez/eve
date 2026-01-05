let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

const getLeaveReportsWagesExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId) 
        let data = req.body
        let { year, month, api,empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID, designationId, sortOrder } = data
        sortOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        let countQuery = await db.query(`
        SELECT COUNT(*) AS total
        FROM eve_acc_employee
        WHERE status='A'
        AND employeeType='Blue Collar'
        AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
        AND (:id IS NULL OR id=:id)
        AND (:employeeSubCompanyId IS NULL OR employeeSubCompanyId=:employeeSubCompanyId)
        AND (:employeeBranchId IS NULL OR employeeBranchId=:employeeBranchId)
        AND (:employeeDepartmentId IS NULL OR employeeDepartmentId=:employeeDepartmentId)
        AND (:employeeSubDepartmentId IS NULL OR employeeSubDepartmentId=:employeeSubDepartmentId)
        AND (:employeeDesignationId IS NULL OR employeeDesignationId=:employeeDesignationId)
        AND (:locationID IS NULL OR locationID=:locationID)
        AND (employeeCurrentStatus = '' 
        OR employeeCurrentStatus IS NULL 
        OR employeeCurrentStatus = 'Active'
        OR employeeCurrentStatus = 'resignation' 
        OR employeeCurrentStatus = 'joining'
        OR employeeCurrentStatus = 'termination'
        OR employeeCurrentStatus = 'release' 
        OR employeeCurrentStatus = 'offerletter')`,
            {
                replacements: {
                    employeeCode: empCode || null,
                    id: empId || null,
                    employeeSubCompanyId: subCompId || null,
                    employeeBranchId: branchId || null,
                    employeeDepartmentId: departmentId || null,
                    employeeSubDepartmentId: subDepartmentId || null,
                    employeeDesignationId: designationId || null,
                    locationID: locationID || null,
                },
                type: QueryTypes.SELECT
            })
        const totalCount = countQuery[0].total

        if (totalCount === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalCount;
        let maxPage = Math.ceil(totalCount / limit)
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
                            employeeDesignationId,
                            locationID,
                            employeeType,
                            employmentLeaveType

                            FROM eve_acc_employee
                            CROSS JOIN (SELECT @row_number := :offset) AS init
                            WHERE status='A'

                            AND employeeType='Blue Collar'
                            AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
                            AND (:id IS NULL OR id=:id)
                            AND (:employeeSubCompanyId IS NULL OR employeeSubCompanyId=:employeeSubCompanyId)
                            AND (:employeeBranchId IS NULL OR employeeBranchId=:employeeBranchId)
                            AND (:employeeDepartmentId IS NULL OR employeeDepartmentId=:employeeDepartmentId)
                            AND (:employeeSubDepartmentId IS NULL OR employeeSubDepartmentId=:employeeSubDepartmentId)
                            AND (:employeeDesignationId IS NULL OR employeeDesignationId=:employeeDesignationId)
                            AND (:locationID IS NULL OR locationID=:locationID)
                            AND (employeeCurrentStatus = '' 
                            OR employeeCurrentStatus IS NULL 
                            OR employeeCurrentStatus = 'Active'
                            OR employeeCurrentStatus = 'resignation' 
                            OR employeeCurrentStatus = 'joining'
                            OR employeeCurrentStatus = 'termination'
                            OR employeeCurrentStatus = 'release' 
                            OR employeeCurrentStatus = 'offerletter')
                            ORDER BY employeeName  ${sortOrder}
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
                    employeeDesignationId: designationId || null,
                    locationID: locationID || null,
                },
                type: QueryTypes.SELECT
            })

        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        await Promise.all(getData.map(async e => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.locationName = await myFunc.getLocationNameById(e.locationID, db)

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let empDtStrdate = new Date(`${year}-${month}-${number}`);
                let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    attStatus: "--",
                    empDtStr: `${timestamp}`,
                    backcolor: "--",
                    title: "--",
                    type: '--',
                    remarks: '--',
                    leaveTypeId: '--',
                    leaveStatus: '--'
                };

                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            let empAttendanceApproved = await db.query(`
             SELECT employeeId,date,type,remarks,leaveTypeId
             FROM eve_acc_employee_attendence_approved
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

            let leaveAprovedHistory = await db.query(`
                                    SELECT empId,leaveTypeId,fromDate,toDate,leaveStatus
                                    FROM  eve_acc_employee_leave_history
                                    WHERE status='A'
                                    AND empId=:empId
                                    AND YEAR(fromDate)=:year               
                                    AND YEAR(toDate)=:year
                                    AND MONTH(fromDate)=:month               
                                    AND MONTH(toDate)=:month `, {
                replacements: {
                    empId: e.empId,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            let attendanceMap = new Map()
            let leaveMap = new Map()
            let leaveMap1 = new Map()
            empAttendanceApproved.map(x => attendanceMap.set(x.date, x))
            leaveAprovedHistory.map(x => leaveMap.set(x.fromDate, x))
            leaveAprovedHistory.map(x => leaveMap1.set(x.toDate, x))

            await Promise.all(e.appDetails.map(async x => {
                x.day = moment(x.crtDate).format('dddd')
                x.date = moment(x.crtDate).format('D')

                if (attendanceMap.has(x.crtDate)) {
                    let leaveRecord = attendanceMap.get(x.crtDate)
                    x.type = leaveRecord.type
                    x.remarks = leaveRecord.remarks
                    x.leaveTypeId = leaveRecord.leaveTypeId

                    if (x.type == "full") {
                        x.title = "Present";
                        x.attStatus = "P"
                    }

                    else if (x.type == "reject" && x.remarks != "AB LEAVE" && x.remarks != "First Half" && x.remark != "Second Half") {
                        x.attStatus = "AB"

                        x.title = "Absent";

                    }
                    else if (x.type == "half") {
                        x.attStatus = "HD"

                        x.title = "Halfday";


                    }
                    else if (x.leaveTypeId && x.type == 'holiday' && x.remarks == 'L LEAVE' && x.leaveTypeId != null) {
                        let leaveResult = await myFunc.leaveType(x.leaveTypeId, db)
                        x.attStatus = leaveResult.prefix
                        x.title = leaveResult.name

                    }
                    else if (x.type == 'holiday' && x.remarks == 'L LEAVE' && x.leaveTypeId == '') {
                        x.attStatus = 'D-PL'
                        x.title = 'Default Paid Leave'
                    }
                    else if (x.type == 'reject' && x.remarks == 'AB LEAVE') {
                        x.attStatus = 'UL'
                        x.title = 'Unpaid Leave'
                    }
                    else if (x.type == 'holiday' && x.remarks == 'First Half' || x.remarks == 'Second Half') {
                        x.attStatus = 'HD-PL'
                        x.title = 'Halfday Paid Leave';
                    }
                    else if (x.type == 'reject' && x.remarks == 'First Half' || x.remarks == 'Second Half') {
                        x.attStatus = 'HD-UL'
                        x.title = 'Halfday unpaid Leave';
                    }
                    else if (x.type == 'holiday' && x.remarks != 'L LEAVE' && x.remarks != 'First Half' && x.remarks != 'Second Half') {
                        x.attStatus = 'MHD'
                        x.title = 'Marked as Holiday';
                    }
                    else if (x.type == "sunday reject") {
                        x.attStatus = "AB"
                        x.title = "Absent";
                    }
                    else {
                        x.attStatus = "--";
                        x.title = "--";
                    }

                }

                if (leaveMap.has(x.crtDate)) {
                    let leaveDetails = leaveMap.get(x.crtDate)
                    let leaveResult = await myFunc.leaveType(leaveDetails.leaveTypeId, db)

                    x.attStatus = leaveResult.prefix

                    x.title = leaveResult.name
                    x.leaveTypeId = leaveDetails.leaveTypeId
                    x.leaveStatus = leaveDetails.leaveStatus

                    if (leaveDetails.leaveStatus === 'C') {
                        x.backcolor = '#ffa7a5'
                    }
                    else if (leaveDetails.leaveStatus === 'W') {
                        x.backcolor = '#ADD8E6'
                    }
                    else if (leaveDetails.leaveStatus === 'A') {
                        x.backcolor = '#90EE90'
                    }

                }

                if (leaveMap1.has(x.crtDate)) {
                    let leaveDetails = leaveMap1.get(x.crtDate)
                    let leaveResult = await myFunc.leaveType(leaveDetails.leaveTypeId, db)

                    x.attStatus = leaveResult.prefix

                    x.title = leaveResult.name

                    x.leaveTypeId = leaveDetails.leaveTypeId
                    x.leaveStatus = leaveDetails.leaveStatus

                    if (leaveDetails.leaveStatus === 'C') {
                        x.backcolor = '#ffa7a5'
                    }
                    else if (leaveDetails.leaveStatus === 'W') {
                        x.backcolor = '#ADD8E6'
                    }
                    else if (leaveDetails.leaveStatus === 'A') {
                        x.backcolor = '#90EE90'
                    }
                }

            }))


            let leaveDb = await db.query(`
                                          SELECT prefix, colorCode 
                                          FROM eve_acc_leave_type
                                          WHERE status='A'`,
                {
                    type: QueryTypes.SELECT
                });


            let totalLeaveCounts = {};
            let pendingCounts = {};
            let appliedCount = {};
            let approvedCounts = {};
            let rejectCounts = {};
            let closingBalanceCount = {};

            leaveDb.forEach(x => {
                totalLeaveCounts[x.prefix] = 0;
                pendingCounts[x.prefix] = 0;
                approvedCounts[x.prefix] = 0;
                rejectCounts[x.prefix] = 0;
                appliedCount[x.prefix] = 0;
                closingBalanceCount[x.prefix] = 0;
            });

            e.appDetails.forEach(x => {
                if (totalLeaveCounts[x.attStatus] !== undefined) {
                    totalLeaveCounts[x.attStatus]++;
                }
                if (closingBalanceCount[x.attStatus] !== undefined) {
                    closingBalanceCount[x.attStatus]++;
                }

                if (pendingCounts[x.attStatus] !== undefined && x.leaveStatus === 'W') {
                    pendingCounts[x.attStatus]++;
                }

                if (approvedCounts[x.attStatus] !== undefined && x.leaveStatus === 'A') {
                    approvedCounts[x.attStatus]++;
                }

                if (rejectCounts[x.attStatus] !== undefined && x.leaveStatus === 'C') {
                    rejectCounts[x.attStatus]++;
                }
                if (appliedCount[x.attStatus] !== undefined && x.leaveStatus === 'A' || x.leaveStatus === 'C' || x.leaveStatus === 'W') {
                    appliedCount[x.attStatus]++;
                }
            });


            let leaveSetting = await db.query(`
                SELECT 
                subCompanyId,
                leaveTypeId,
                allocateLeaveDays,
                leaveTypeId AS prefix
                FROM eve_acc_leave_setting 
                WHERE status='A'
                AND subCompanyId=:subCompanyId               
                AND employmentLeaveTypeId=:employmentLeaveTypeId               
                          
             `, {
             replacements: {
                 subCompanyId: e.employeeSubCompanyId,
                 employmentLeaveTypeId: e.employmentLeaveType
             },
             type: QueryTypes.SELECT
         })

         const leaveMapData = new Map()

         await Promise.all(leaveSetting.map(async (x) => {
             x.prefix = await getleaveNameById(x.prefix, db);
             leaveMapData.set(x.prefix, parseFloat(x.allocateLeaveDays));
         }));

         e.total = leaveDb.map(leaveType => ({
             ...leaveType,
             total: leaveMapData.get(leaveType.prefix) || 0
         }));



            e.pending = leaveDb.map(leaveType => ({
                ...leaveType,
                total: pendingCounts[leaveType.prefix] || 0
            }));
            e.totalApplied = leaveDb.map(leaveType => ({
                ...leaveType,
                total: appliedCount[leaveType.prefix] || 0
            }));


            e.totalApproved = leaveDb.map(leaveType => ({
                ...leaveType,
                total: approvedCounts[leaveType.prefix] || 0
            }));


            e.totalRejected = leaveDb.map(leaveType => ({
                ...leaveType,
                total: rejectCounts[leaveType.prefix] || 0
            }));
            e.totalClosingBalance = leaveDb.map(leaveType => ({
                ...leaveType,
                total: leaveMapData.get(leaveType.prefix)-approvedCounts[leaveType.prefix] || 0
            }));

        }))
        if(api==='raw'){
            return res.status(200).json({
                status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalCount,
                employee: getData 
            })
        }
                       
        let leaveExcel = getData.map(e => ({
            'Sl. No.': e.slno,
            'Employee Name': e.employeeName,
            'Employee Code': e.employeeCode,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'App': e.appDetails,
            'Total': e.total,
            'Pending': e.pending,
            'Total Applied': e.totalApplied,
            'Total Approved': e.totalApproved,
            'Total Rejected': e.totalRejected,
            'Total Closing Balance': e.totalClosingBalance
        }))

if(api==='excel'){

    return res.status(200).json({
        status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalCount,
        employee: leaveExcel
    })
}
 const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = [];
    let employee = myFunc.replaceEmptyValues(leaveExcel);
    let subHeader = [];
    let header = Object.keys(employee[0]);
    let midHeader = [];
    let colorInfo = []; // To store color information

    let appIndex = header.indexOf('App');



    // Add the "App" headers to the midHeader array
    employee[0].App.forEach((e, i) => {
        midHeader.push(e.day);
        subHeader.push(e.date);
    });

    // Add the "App" headers into the header array
    header.splice(appIndex, 1, ...midHeader);

    // Insert empty strings into the subheader array to align with the "App" headers
    subHeader.unshift(...new Array(appIndex).fill(''));
    employee.forEach((e, rowIndex) => {
        let value = Object.values(e);
        let row = [];
        let colorRow = []; // To store color info for this row

        value.forEach((x, i) => {
            if (Array.isArray(x)) {
                x.forEach((z, k) => {
                    row.push(z.attStatus);
                    colorRow.push(z.backcolor || '--'); // Store backcolor or '--'
                });

            } else {
                row.push(x);
                colorRow.push(null); // No color for non-App columns
            }
        });

        values.push(row);
        colorInfo.push(colorRow); // Store the color info
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const totalData = employee[0].Total;
    const pendingData = employee[0].Pending;
    const totalAppliedData = employee[0]['Total Applied'];
    const totalApporvedData = employee[0]['Total Approved'];
    const totalRejectedData = employee[0]['Total Rejected'];
    const totalClosingBalance = employee[0]['Total Closing Balance'];
    const totalPrefixes = totalData.map(item => item.prefix);

    subHeader.push(...totalPrefixes);// Insert the "Total" prefixes as subheaders under the "Total" header
    subHeader.push(...totalPrefixes);// Insert the "Total" prefixes as subheaders under the "Total" header
    subHeader.push(...totalPrefixes);// Insert the "Total" prefixes as subheaders under the "Total" header
    subHeader.push(...totalPrefixes);// Insert the "Total" prefixes as subheaders under the "Total" header
    subHeader.push(...totalPrefixes);// Insert the "Total" prefixes as subheaders under the "Total" header
    subHeader.push(...totalPrefixes);// Insert the "Total" prefixes as subheaders under the "Total" header
    const totalStartIndex = header.indexOf('Total')
    const headerRowOne = worksheet.getRow(1); // Add the main header to the first row


    header = header.slice(0, totalStartIndex)
        .concat(['Total']).concat(new Array(totalData.length - 1))
        .concat(['Pending']).concat(new Array(pendingData.length - 1))
        .concat(['Total Applied']).concat(new Array(totalAppliedData.length - 1))
        .concat(['Total Approved']).concat(new Array(totalApporvedData.length - 1))
        .concat(['Total Rejected']).concat(new Array(totalRejectedData.length - 1))
        .concat(['Total Closing Balance']).concat(new Array(totalClosingBalance.length - 1))

    headerRowOne.values = header
    headerRowOne.commit();


    // Add the subheader to the second row
    const subHeaderRow = worksheet.getRow(2);
    subHeaderRow.values = subHeader;
    subHeaderRow.commit();
    worksheet.addRows(values);

    employee.map((e, i) => {

        e.Total.map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Total') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i == 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total

        });
        e.Pending.map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Pending') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i == 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total

        });
        e['Total Applied'].map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Total Applied') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i == 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total

        });
        e['Total Approved'].map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Total Approved') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i == 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total

        });
        e['Total Rejected'].map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Total Rejected') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i == 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total

        });
        e['Total Closing Balance'].map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Total Closing Balance') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i == 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total

        });
    })

    let mergeData = ['Total', 'Pending', 'Total Applied', 'Total Approved', 'Total Rejected', 'Total Closing Balance']
    mergeData.map(e => {
        worksheet.mergeCells(`${getColumnLetter(headerRowOne.values.indexOf(e))}1:${getColumnLetter(employee[0][e].length - 1 + headerRowOne.values.indexOf(e))}1`);
    })

   

    // Apply formatting to header rows
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

            row.height = 30;
        });
    });

    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
        cell.font = { bold: true };
    });

    headerRow2.eachCell(cell => {
        cell.font = { bold: true };
    });

    // Set column widths
    for (let i = 1; i <= header.length; i++) {
        const column = worksheet.getColumn(i);
        column.width = 20; // Set the desired width in characters
    }

    // Apply colors to cells based on z.backcolor
    colorInfo.forEach((colorRow, rowIndex) => {
        const row = worksheet.getRow(rowIndex + 3); // +3 to account for headers
        colorRow.forEach((color, colIndex) => {
            if (color && color !== '--') {
                const cell = row.getCell(colIndex + 1);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: color.replace('#', '') },
                };
            }
        });
    });
    worksheet.views = [
        { state: 'normal', zoomScale: 80 }
    ];

    // return workbook.xlsx;
      const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
            const fileName = `leaveStatusReport_${year}_${month}_${Date.now()}.xlsx`;
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
                                 INSERT INTO eve_blue_all_report_download_log 
                                 (createdDate, createdSession, createdIp, excelFileUrl, status,expiryDate,excelName,type)
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
                        type: 'Leave Status Report'
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
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
 // Function to convert column index to Excel column letter
    function getColumnLetter(colIndex) {
        let letter = '';
        while (colIndex > 0) {
            let modulo = (colIndex - 1) % 26;
            letter = String.fromCharCode(modulo + 65) + letter;
            colIndex = Math.floor((colIndex - modulo) / 26);
        }
        return letter;
    }
    const getleaveNameById = async (leaveTypeId, db) => {

    let empleaveType = await db.query(`
                                      SELECT prefix
                                      FROM eve_acc_leave_type 
                                      WHERE id=:id`,
        {

            replacements: {
                id: leaveTypeId
            },
            type: QueryTypes.SELECT
        })
    if (empleaveType[0]) {
        let res = Object.values(empleaveType[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}

module.exports = { getLeaveReportsWagesExcel }
















