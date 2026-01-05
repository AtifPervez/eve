let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const getAdvanceReportExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()

        let data = { ...req.body, ...req.query }

        const { year, month, api } = data

        if (!year) {
            return res.status(400).send({ status: false, msg: 'Year is required' })
        }

        if (!month) {
            return res.status(400).send({ status: false, msg: 'Month is required' })
        }

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_blue_acc_employee_other_advance_payment AS a
            LEFT JOIN eve_blue_acc_employee_other_advance_payment_details AS b  ON a.employeeId=b.employeeId
            LEFT JOIN eve_acc_employee AS c  ON a.employeeId=c.id

            WHERE a.status='A'
            AND a.yearNumber=:year
          
            AND      
                LPAD(
                    CASE 
                    WHEN a.monthNumber = 'January' THEN 1
                    WHEN a.monthNumber = 'February' THEN 2
                    WHEN a.monthNumber = 'March' THEN 3
                    WHEN a.monthNumber = 'April' THEN 4
                    WHEN a.monthNumber = 'May' THEN 5
                    WHEN a.monthNumber = 'June' THEN 6
                    WHEN a.monthNumber = 'July' THEN 7
                    WHEN a.monthNumber = 'August' THEN 8
                    WHEN a.monthNumber = 'September' THEN 9
                    WHEN a.monthNumber = 'October' THEN 10
                    WHEN a.monthNumber = 'November' THEN 11
                    WHEN a.monthNumber = 'December' THEN 12
                    ELSE a.monthNumber END, 2, '0')=:month         
            `, {
            replacements: {
                year: year,
                month: month,
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total
        if (totalData === 0) {
            return res.status(200).json({ status: true, result: 'error', alert: 'Payroll not generated' })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        const sqlData = await db.query(`
            SELECT

            (@row_number:=@row_number + 1) AS slno,
            
            a.employeeId,
            c.employeeName,
            c.employeeCode,
            c.employeeSubCompanyId,
            c.employeeBranchId,
            c.employeeDepartmentId,
            c.employeeSubDepartmentId,
            c.employeeDesignationId,
                            
           -- a.yearNumber,
            a.createdBy,

           LPAD(
                CASE 
                WHEN a.monthNumber = 'January' THEN 1
                WHEN a.monthNumber = 'February' THEN 2
                WHEN a.monthNumber = 'March' THEN 3
                WHEN a.monthNumber = 'April' THEN 4
                WHEN a.monthNumber = 'May' THEN 5
                WHEN a.monthNumber = 'June' THEN 6
                WHEN a.monthNumber = 'July' THEN 7
                WHEN a.monthNumber = 'August' THEN 8
                WHEN a.monthNumber = 'September' THEN 9
                WHEN a.monthNumber = 'October' THEN 10
                WHEN a.monthNumber = 'November' THEN 11
                WHEN a.monthNumber = 'December' THEN 12
                ELSE a.monthNumber END, 2, '0') AS monthNumber,

            a.openingAmount AS 'Opening Balance',
            a.claimedAmnt AS 'EMI/Deduction',
            a.closingAmnt AS 'Closing Balance',
            a.description AS 'Description',
            b.totalAmount AS 'Advance Amount (₹)',
            DATE_FORMAT(b.createdDate,'%d-%m-%Y') AS 'Advance Taken On'
                
            
            
            FROM eve_blue_acc_employee_other_advance_payment AS a
            LEFT JOIN eve_blue_acc_employee_other_advance_payment_details AS b  ON a.employeeId=b.employeeId
            LEFT JOIN eve_acc_employee AS c  ON a.employeeId=c.id

            CROSS JOIN (SELECT @row_number := :offset) AS init
          
         
            WHERE a.status='A'
          
            AND a.yearNumber=:year
            

            AND      
                LPAD(
                    CASE 
                    WHEN a.monthNumber = 'January' THEN 1
                    WHEN a.monthNumber = 'February' THEN 2
                    WHEN a.monthNumber = 'March' THEN 3
                    WHEN a.monthNumber = 'April' THEN 4
                    WHEN a.monthNumber = 'May' THEN 5
                    WHEN a.monthNumber = 'June' THEN 6
                    WHEN a.monthNumber = 'July' THEN 7
                    WHEN a.monthNumber = 'August' THEN 8
                    WHEN a.monthNumber = 'September' THEN 9
                    WHEN a.monthNumber = 'October' THEN 10
                    WHEN a.monthNumber = 'November' THEN 11
                    WHEN a.monthNumber = 'December' THEN 12
                    ELSE a.monthNumber END, 2, '0')=:month

          

            LIMIT :limit
            OFFSET :offset        
  
         
            `, {
            replacements: {
                limit: limit,
                offset: offset,
                year: year,
                month: month,
            },
            type: QueryTypes.SELECT
        })
        let totalEmiDeduction = 0
        let totalOpeningBalance = 0
        let totalClosingBalance = 0
        let totalAdvanceAmount = 0

        await Promise.all(sqlData.map(async e => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e['Advance Amount (₹)'] = myFunc.formatAmount(e['Advance Amount (₹)'])
            totalAdvanceAmount += parseFloat(e['Advance Amount (₹)'])
            e['Opening Balance'] = myFunc.formatAmount(e['Opening Balance'])
            totalOpeningBalance += parseFloat(e['Opening Balance'])
            e['EMI/Deduction'] = myFunc.formatAmount(e['EMI/Deduction'])
            totalEmiDeduction += parseFloat(e['EMI/Deduction'])
            e['Closing Balance'] = myFunc.formatAmount(e['Closing Balance'])
            totalClosingBalance += parseFloat(e['Closing Balance'])

        }))
        let excelData = sqlData.map(e => ({
            'Sl. No.': e.slno,
            'Worker Code': e.employeeCode,
            'Worker Name': e.employeeName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'Advance Taken On': e['Advance Taken On'],
            'Advance Amount (₹)': e['Advance Amount (₹)'],
            'Description': e['Description'],
            'Opening Balance': e['Opening Balance'],
            'EMI/Deduction': e['EMI/Deduction'],
            'Closing Balance': e['Closing Balance'],
        }))

        if (api === 'raw') {

            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                data: sqlData
            })
        }

        else if (api === 'excel') {
            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                data: excelData
            })
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Advance Report');
        let values = []

        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);
        excelData = myFunc.replaceEmptyValues(excelData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });


        let len = headers.length;
        let row = new Array(len).fill('');
        row[headers.indexOf('Advance Amount (₹)')] = myFunc.formatAmount(totalAdvanceAmount)
        row[headers.indexOf('Opening Balance')] = myFunc.formatAmount(totalOpeningBalance)
        row[headers.indexOf('EMI/Deduction')] = myFunc.formatAmount(totalEmiDeduction)
        row[headers.indexOf('Closing Balance')] = myFunc.formatAmount(totalClosingBalance)
        row[headers.indexOf('Advance Taken On')] = 'Total :'
        values.push(row);

        worksheet.addRows(values);

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            row.height = 20;
        });

        // Header style
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
            cell.font = { bold: true };
        });

        worksheet.columns.forEach(column => {
            column.width = 30;
        });

        const lastRow = worksheet.lastRow;
        lastRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
        });


        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `AdvanceReport_${year}_${month}_${Date.now()}.xlsx`;
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
                    type: 'Advance Report'
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
module.exports = { getAdvanceReportExcel }
















