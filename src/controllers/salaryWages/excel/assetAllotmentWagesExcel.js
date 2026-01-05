let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const ExcelJS = require('exceljs')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const fs = require('fs')
const path = require('path')
const getAssetAllotmentWagesExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { year, month, api } = data

        if (!year || !month) {
            return res.status(400).json({ status: false, msg: 'plz enter year and month' })
        }
        
        let countQuery = await db.query(`

                                            SELECT COUNT(*) AS total
                                            FROM eve_hrm_employee_asset_allotment_details
                                          
                                            WHERE status='A'
                                            AND DATE_FORMAT(addedDate,'%Y-%m') = :date                                 
                                        `,

            {

                replacements: {
                    date: `${year}-${month}`
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
                                      -- (@row_number:=@row_number + 1) AS slno,
                                      employeeId,amount,
                                      subCompanyId,
                                      branchId,
                                      departmentId,
                                      subDepartmentId,
                                      categoryId,
                                      assetId,
                                      quantity,
                                      serialNo,
                                      createdBy,
                                      DATE_FORMAT(requestDate, '%d-%m-%Y') AS requestDate,
                                      DATE_FORMAT(addedDate, '%d-%m-%Y') AS allotedDate,
                                      reason,
                                      requestApprovalStatus,
                                      DATE_FORMAT(addedDate,'%d-%m-%Y') AS addedDate

                                      FROM eve_hrm_employee_asset_allotment_details 
                                      -- CROSS JOIN (SELECT @row_number := :offset) AS init
                                      WHERE status='A'
                                      AND DATE_FORMAT(addedDate,'%Y-%m') = :date
                                        LIMIT :limit
                                        OFFSET :offset
                                      `
            ,

            {
                replacements: {

                    limit: limit,
                    offset: offset,
                    date: `${year}-${month}`
                },
                type: QueryTypes.SELECT

            })

        await Promise.all(getData.map(async (e) => {

            e.empCode = await myFunc.getEmpCodeFromEmpId(e.employeeId, db)

            e.empName = await myFunc.getEmployeeNameById(e.employeeId, db)

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.subCompanyId, db)

            e.branchName = await myFunc.getBranchNameByBranchId(e.branchId, db)

            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.departmentId, db)

            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.subDepartmentId, db)

            e.designationId = await myFunc.getDesignationIdFromEmpId(e.employeeId, db)

            e.designationName = await myFunc.getDesignationNameById(e.designationId, db)

            e.categoryName = await myFunc.getAssetCategoryName(e.categoryId, db)

            e.taggedResponsibleId = await myFunc.taggedResponsiblePerson(e.categoryId, db)

            e.taggedResponsiblePerson = await myFunc.getEmployeeNameById(e.taggedResponsibleId, db)

            e.assetName = await myFunc.getAssetName(e.assetId, db)

            e.allotedBy = await myFunc.getEmployeeNameById(e.createdBy, db)

        }))
        if (api === 'raw') {
            return res.status(200).send({

                status: true,

                pageNo: pageNo,

                recordedPerPage: limit,

                totalData: totalData,

                employee: getData,


            })
        }
        let excelData = getData.map((e, i) => ({

            'Sl. No.': Number(i + 1),
            'Employee Code': e.empCode,
            'Employee Name': e.empName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'Asset Category': e.categoryName,
            'Tagged Responsible Person': e.taggedResponsiblePerson,
            'Asset Name': e.assetName,
            'Quantity': e.quantity,
            'Serial/Model No.': e.serialNo,
            'Request Date': e.requestDate,
            'Amount(₹)': myFunc.formatAmount(e.amount),
            'Requested by': '',
            'Asset Allotment Reason': e.reason,
            'Alloted Date': e.addedDate,
            'Alloted By': e.allotedBy,
            'Asset Request Status': myFunc.capitalizeFirstLetter(e.requestApprovalStatus)

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
        const fileName = `assetAllotedReport${year}_${month}_${Date.now()}.xlsx`;
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
                    type: 'Asset Allotment Report'
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
        return res.status(500).send({ status: false, err: error.message, msg: error.stack })
    }
}
module.exports = { getAssetAllotmentWagesExcel }