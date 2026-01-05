let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const ExcelJS = require('exceljs')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const fs = require('fs')
const path = require('path')
const getResignationWagesExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        const companyId = decodedToken.companyId
        const branchId = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let db = sequelize(companyId)
        let data = { ...req.body, ...req.query }
        const { year, month, api } = data
        let countQuery = await db.query(`

            SELECT COUNT(*) AS total
            FROM eve_employee_resignation_list AS a 
            LEFT JOIN eve_acc_employee AS b ON a.empId=b.id 
            where a.status="A"  
            AND b.employeeType='Blue Collar'
            AND  DATE_FORMAT(a.resignationDate,'%Y-%m')=:date  
              AND (
                    b.employeeCurrentStatus = '' 
                    OR b.employeeCurrentStatus IS NULL 
                    OR b.employeeCurrentStatus = 'Active'
                    OR b.employeeCurrentStatus = 'joining'
                    OR b.employeeCurrentStatus = 'offerletter'
                )    

            `, {
            replacements: {
                date: `${year}-${month}`,
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total
        if (totalData === 0) {
            return res.status(200).json({ status: true, result: 'error', alert: 'No Data Found' })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
            
            SELECT 
            b.employeeName, 
            b.employeeCode,
            b.employeeSubCompanyId,
            b.employeeBranchId,
            b.employeeDepartmentId,
            b.employeeSubDepartmentId,
            b.employeeDesignationId,
            c.contactNumber,c.personalEmail,
            a.noticePeriod,a.r1Id,a.r1Status,a.r2Id,a.r2Status,a.r3Id,a.r3Status,
            a.remarks,a.resignStatus,
            DATE_FORMAT(a.resignationDate,'%d-%m-%Y') AS resignationDate,          
            DATE_FORMAT(a.submitDate,'%d-%m-%Y') AS appliedDate          

            FROM eve_employee_resignation_list AS a
            LEFT JOIN eve_acc_employee AS b ON a.empId=b.id
            LEFT JOIN  eve_hrm_employee_details AS c ON c.employeeId=a.id
            WHERE  a.status="A"  
            AND b.employeeType='Blue Collar'

            AND (
                    b.employeeCurrentStatus = '' 
                    OR b.employeeCurrentStatus IS NULL 
                    OR b.employeeCurrentStatus = 'Active'
                    OR b.employeeCurrentStatus = 'joining'
                    OR b.employeeCurrentStatus = 'offerletter'
                )
                                                           
            AND  DATE_FORMAT(a.resignationDate,'%Y-%m')=:date      
            ORDER BY b.employeeName
            LIMIT :limit
            OFFSET :offset     
                        
            `, {

            replacements: {
                limit: limit,
                offset: offset,
                date: `${year}-${month}`,
            },
            type: QueryTypes.SELECT
        })

        await Promise.all(getData.map(async (e, i) => {

            e.approvalStatus=e.resignStatus==='A'?'Approved':e.resignStatus==='W'?'Pending':e.resignStatus==='C'?'Rejected':''

            e.R1=`${await myFunc.getEmployeeNameById(e.r1Id,db)} - ${e.r1Status}`    
            e.R2=`${await myFunc.getEmployeeNameById(e.r2Id,db)} - ${e.r2Status}`
            e.R3=`${await myFunc.getEmployeeNameById(e.r3Id,db)} - ${e.r3Status}`

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.departmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
           

        }))

        if (api === 'raw') {
            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                employee: getData
            })
        }

        let excelData = getData.map((e, i) => ({

            'Sl. No.': Number(i + 1),
            'Applied Date': e.appliedDate,
            'Resignation Date': e.resignationDate,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'Phone No': e.contactNumber,
            'Email': e.personalEmail,
            'Notice Period': e.noticePeriod,
            'R1': e.R1,
            'R2': e.R2,
            'R3': e.R3,
            'Remarks':e.remarks,
            'Approval Status':e.approvalStatus

        }))

        if (api === 'excel') {

            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                employee: excelData
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

        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `resignationReport${year}_${month}_${Date.now()}.xlsx`;
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
                    type: 'Resignation Report'
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

        return res.status(500).json({ status: false, msg: error.message })

    }

}

module.exports = { getResignationWagesExcel }









