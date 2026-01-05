let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')
const moment = require('moment')

const getLeaveDeductionReportsWagesExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)

        let data = req.body
        let { month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId, api } = data

        let leaveFinancialYear = await db.query(`
            SELECT financialYearTypeName,financialYearStartMonth,financialYearEndMonth
            FROM eve_acc_leave_financial_year_master 
            WHERE status='A'`,
            {
                replacements: {

                },
                type: QueryTypes.SELECT
            }
        )

        let financialYearFrom
        let financialYearTo

        if (leaveFinancialYear[0].financialYearTypeName == 'Calendar Year') {
            financialYearFrom = year
            financialYearTo = year
        }

        else {
            if (month <= 3) {
                financialYearFrom = `${parseInt(year) - 1}`
                financialYearTo = year

            } else {
                financialYearFrom = year
                financialYearTo = `${parseInt(year) + 1}`

            }
        }
        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_acc_employee
            WHERE status='A'
             AND employeeType='Blue Collar'
            AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
            AND (:empId IS NULL OR id=:empId)
            AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
            AND (:branchId IS NULL OR employeeBranchId=:branchId)
            AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
            AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
            AND (:designationId IS NULL OR employeeDesignationId=:designationId)
            

  AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth




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
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,
                subDepartmentId: subDepartmentId || null,
                designationId: designationId || null,
                yearMonth: year + '-' + month,

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

             (@row_number:=@row_number + 1) AS 'slno',
             
             CAST(id AS CHAR) AS empId,
             employeeName,
             employeeCode,
             employeeSubCompanyId,
             employeeBranchId,
             employeeDepartmentId,
             employeeSubDepartmentId,
             employeeDesignationId,
             employmentLeaveType

             FROM eve_acc_employee 
             CROSS JOIN (SELECT @row_number := :offset) AS init
             WHERE status='A'
             
             AND employeeType='Blue Collar'
             AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
             AND (:empId IS NULL OR id=:empId)
             AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
               AND (:branchId IS NULL OR employeeBranchId=:branchId)
                 AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
                   AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
                    AND (:designationId IS NULL OR employeeDesignationId=:designationId)

  AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth

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
             OFFSET :offset  

            `, {
            replacements: {
                limit: limit,
                offset: offset,
                employeeCode: empCode || null,
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,
                subDepartmentId: subDepartmentId || null,
                designationId: designationId || null,
                yearMonth: year + '-' + month,
            },
            type: QueryTypes.SELECT
        })
        await Promise.all(getData.map(async e => {
            e['subCompany'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e['branch'] = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e['Department'] = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['subDepartment'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e['designation'] = await myFunc.getDesignationNameById(e.employeeDesignationId, db)


            const leaveTypeModel = await db.query(`
                SELECT

                 CAST(id AS CHAR) AS id,
                 name AS leaveTypeName,
                 prefix,
                 colorCode
                 
                 FROM eve_acc_leave_type
                  
                 WHERE status='A'
                 
                `, {
                replacements: {


                },
                type: QueryTypes.SELECT
            })
            e.leaveDetails = []
            e.leaveDetails.push(...leaveTypeModel)

            const leaveDeductionModel = await db.query(`

                SELECT 
                empId,
                leaveTypeId,
                noOfDay,
                month,
                year

                FROM eve_acc_leave_deduction_log
                WHERE status='A'
                AND empId=:empId
                AND month=:month
                AND year=:year
                AND fromDate=:financialYearFrom
                AND toDate=:financialYearTo
                
                

                `, {
                replacements: {
                    empId: e.empId,
                    month: month,
                    year: year,
                    financialYearFrom: financialYearFrom,
                    financialYearTo: financialYearTo,
                },
                type: QueryTypes.SELECT
            })



            const leaveDeductionMap = leaveDeductionModel.reduce((acc, z) => {
                acc[z.leaveTypeId] = z
                return acc
            }, {})


            e.leaveDetails.forEach(x => {
                if (leaveDeductionMap[x.id]) {
                    x.noOfDay = leaveDeductionMap[x.id].noOfDay
                } else {
                    x.noOfDay = '--'
                }

            })

        }))
        if (api === 'raw') {
            return res.status(200).json({
                status: true,
                pageNo: pageNo,
                recordedPerPage: limit,
                totalData: totalData,
                // employee: getData
                employee: getData
            });
        }

        const leaveDeductionExcel = getData.map(e => ({
            'Sl. No.': e.slno,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Department': e.Department,
            'Sub Department': e.subDepartment,
            'Designation': e.designation,
            'Deduction Details': e.leaveDetails
        }))
        if (api === 'excel') {
            return res.status(200).json({
                status: true,
                pageNo: pageNo,
                recordedPerPage: limit,
                totalData: totalData,
                employee: myFunc.replaceEmptyValues(leaveDeductionExcel)

            });
        }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = [];
    let employee = myFunc.replaceEmptyValues(leaveDeductionExcel)
    let header = Object.keys(employee[0]);

    employee.forEach(e => {
        let value = Object.values(e);
        values.push(value);
    });

    const total = employee[0]['Deduction Details'];

    const totalPrefixes = total.map(e => e.prefix);
    // console.log(totalPrefixes);
    const totalStartIndex = header.indexOf('Deduction Details');

    const headerRowOne = worksheet.getRow(1); // Add the main header to the first row
    header = header.slice(0, totalStartIndex).concat(['Deduction Details']).concat(new Array(total.length - 1));

    headerRowOne.values = header;
    headerRowOne.commit();

    // Add the subheader to the second row starting from the 9th column
    const subHeaderRow = worksheet.getRow(2);
    const rangeArray = Array.from({ length: 8 }, (v, i) => i + 1);

    rangeArray.map(i => {
        const firstCell = subHeaderRow.getCell(i);
        firstCell.value = '';
        firstCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
    });


    for (let i = 0; i < totalPrefixes.length; i++) {
        subHeaderRow.getCell(i + 9).value = totalPrefixes[i];
    }
    subHeaderRow.commit();

    worksheet.addRows(values);

    employee.map((e, i) => {
        e['Deduction Details'].map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Deduction Details') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i === 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.noOfDay;
        });
    });

    worksheet.mergeCells(`${getColumnLetter(headerRowOne.values.indexOf('Deduction Details'))}1:${getColumnLetter(employee[0]['Deduction Details'].length - 1 + headerRowOne.values.indexOf('Deduction Details'))}1`);

    

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
     const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
            const fileName = `allLatePunchDeductionReport${year}_${month}_${Date.now()}.xlsx`;
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
           
                                 session: `${moment(month,'MM').format('MMMM')} ${year}`,
                               ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                               file: customPathToDisplay, // or use filePath if you want to store full path
                               status: 'A',
                               expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days                                                   
                               // expiryDate: new Date(Date.now() + 1000 * 60), // 1 min                                                    
                               excelName: fileName,
                               type: 'All Late Punch Deduction Report'
                           },
                           type: QueryTypes.INSERT
                       }
                   );
                     return res.status(200).json({
                    status: true,
                     result: "success",
                    alert : 'Excel file generated successfully',
                    filePath: `${customPathToDisplay}`, // Return path if needed on front-end
                });

   

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
function getColumnLetter(colIndex) {
        let letter = '';
        while (colIndex > 0) {
            let modulo = (colIndex - 1) % 26;
            letter = String.fromCharCode(modulo + 65) + letter;
            colIndex = Math.floor((colIndex - modulo) / 26);
        }
        return letter;
    }



module.exports = { getLeaveDeductionReportsWagesExcel}