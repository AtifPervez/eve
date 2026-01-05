let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const serialize = require('php-serialize')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const getPayableReportExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        let data = { ...req.body, ...req.query }
        const { year, month, empId, api,subCompanyId, templateId } = data
        const countQuery = await db.query(
            `
                              SELECT COUNT(*) AS total

                             FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                           

                             WHERE a.status ='A'

                             AND b.employeeType = 'Blue Collar'
                               AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND a.isGenerated = 'yes'
                             AND (a.wagesType='monthly')
                               and (:employeeSubCompanyId is null or b.employeeSubCompanyId=:employeeSubCompanyId)
                               and (:salaryTempId is null or a.salaryTemplateId=:salaryTempId)

                                                                      
            `, {
            replacements: {

                empId: empId || null,
                month: parseInt(month),
                year: parseInt(year),
                employeeSubCompanyId: subCompanyId || null,
                salaryTempId: templateId || null,

            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
        if (totalData === 0) {
           return res.status(200).json({ status: true, result:'error', alert: 'Payroll not generated'})
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        const sqlData = await db.query(
            `
                      SELECT 
                         b.id,
                         b.employeeName,
                         b.employeeSubCompanyId,
                         b.employeeCode,
                         b.employeeDoj,
                         a.salaryOfMonth,
                         a.salaryOfYear,
                         a.salaryTemplateId,
                         a.fromDate,
                         a.toDate,
                         a.remarks,
                         a.salary_summary,
                         a.salary_types,
                         a.netPay,
                         a.dateOfPayment,
                         a.remarksDate,
                         a.description,
                         a.createdDateTime,
                         a.paymentStatus,
                         a.id AS 'payId',

                         b.employeeBranchId,

                         b.employeeDepartmentId,

                         b.employeeSubDepartmentId,

                         b.employeeDesignationId,

                         b.salaryTemplateId,

                         b.employeeType,

                         b.locationID,
                         b.empTypeId,b.employeeUAN,c.amount as 'gratuityAmount'

                      
                         
                         FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                             LEFT JOIN eve_blue_gratuity_list_setting as c ON a.employeeId=c.empId
                          

                             WHERE a.status ='A'

                             AND b.employeeType = 'Blue Collar'
                             AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND a.isGenerated = 'yes'
                             AND (a.wagesType='monthly')
                                and (:employeeSubCompanyId is null or b.employeeSubCompanyId=:employeeSubCompanyId)
                               and (:salaryTempId is null or a.salaryTemplateId=:salaryTempId)

                            -- ORDER BY b.employeeName asc

                            limit :limit

                            offset :offset                 
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    empId: empId || null,
                    month: parseInt(month),
                    year: parseInt(year),
                    employeeSubCompanyId: subCompanyId || null,
                    salaryTempId: templateId || null,


                }, type: QueryTypes.SELECT
            }
        )
        let totalPaybleWage = 0
        let totalOvertime = 0
        let totalVariablePay = 0
        let totalBonus = 0
        let totalPayableWageWithoutOverTimeAndVariablePay = 0

        let actualWages = []

        await Promise.all(sqlData.map(async (e, i) => {

            e.subCompany = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartment = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.location = await myFunc.getLocationNameById(e.locationID, db)
            e.wageTemplate = await myFunc.getTemplateNameById(e.salaryTemplateId, db)
            e.type = await myFunc.getEmpTypeName(e.empTypeId, db)


            let sqlComponent = await db.query(
                `
            SELECT DISTINCT  a.salaryLabel,b.salaryAmount
            FROM eve_blue_company_salary_structure_new as a
            left join eve_blue_set_monthly_salary_employee_wise as b on (
                        b.employeeId=:employeeId and b.salaryTempId=a.templateId and b.salaryId=a.id and b.status='A'
            )
            WHERE a.status='A'
            and a.templateId=:templateId
                         
            `, {
                replacements: {


                    templateId: e.salaryTemplateId,
                    employeeId: e.id,

                }, type: QueryTypes.SELECT
            }
            )

            // e.actualWages = []
            let actualWageObj = {};
            sqlComponent.forEach(x => {
                let amount = Number(x.salaryAmount);
                if (x.salaryAmount === null || isNaN(amount)) {
                    actualWageObj[x.salaryLabel] = '';
                } else {
                    actualWageObj[x.salaryLabel] = myFunc.formatAmount(x.salaryAmount);
                }
            })
            e['actualWages'] = actualWageObj
            let salaryTypes = serialize.unserialize(e.salary_types)
            // e.slno = i + 1

            let overtimeAmount = 0
            let variablePay = 0
            let bonus = 0
            let deductionDetails = (salaryTypes.deductionDetails)
            let additionDetails = (salaryTypes.additionDetails)


            // e.generatedWages = []
            let generatedWageObj = {};
            Object.keys(additionDetails).forEach(key => {
                if (!isNaN(key)) {
                    let item = additionDetails[key];

                    // Check if salaryLabel exists and is not empty
                    if (item.salaryLabel && item.salaryAmount !== undefined && item.salaryLabel !== '') {
                        generatedWageObj[item.salaryLabel] = myFunc.formatAmount(item.salaryAmount);
                    }
                }
            });
            Object.keys(deductionDetails).forEach(key => {
                if (!isNaN(key)) {
                    let item = deductionDetails[key];

                    // Check if salaryLabel exists and is not empty
                    if (item.salaryLabel && item.salaryAmount !== undefined && item.salaryLabel !== '' && item.salaryLabel !== 'VPF') {
                        generatedWageObj[item.salaryLabel] = myFunc.formatAmount(item.salaryAmount);
                    }
                }
            });
            e['generatedWages'] = generatedWageObj




            Object.values(additionDetails).forEach(item => {


                if (item?.salaryLabel === 'Over Time') {
                    overtimeAmount = parseFloat(item?.salaryAmount) || 0
                }
                if (item?.salaryLabel === 'Variable Pay') {
                    variablePay = parseFloat(item?.salaryAmount) || 0
                }
                if (item?.salaryLabel === 'Bonus') {
                    bonus = parseFloat(item?.salaryAmount) || 0
                }


            })

            e['OTamount'] = overtimeAmount
            totalOvertime += overtimeAmount
            e['variablePay'] = variablePay
            totalVariablePay += variablePay
            e['bonus'] = bonus
            totalBonus += bonus
            // e['salaryPayableWithoutOverTimeAndVariablePay'] = parseFloat(e.netPay) - parseFloat(overtimeAmount) - parseFloat(variablePay)
            // totalPayableWageWithoutOverTimeAndVariablePay += parseFloat(e.salaryPayableWithoutOverTimeAndVariablePay)
            // totalPaybleWage += parseFloat(e.netPay)


        }))


        let excelData = (sqlData).map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Worker Code': e.employeeCode,
            'PF Number': e.employeeUAN,
            'Worker Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Department': e.department,
            'Sub Department': e.subDepartment,
            'Designation': e.designation,
            'Category': e.employeeType,
            // 'Type': e.type,
            'OT Amount': myFunc.formatAmount(e.OTamount),
            'Variable Pay Amount': myFunc.formatAmount(e.variablePay),
            'Bonus Amounts': myFunc.formatAmount(e.bonus),
            'Gratuity Amount': myFunc.formatAmount(e.gratuityAmount),
            'Actual Wages': e.actualWages,
            'Generated Wages': e.generatedWages,
            // 'Location': e.location,
            // 'Wage Template': e.wageTemplate,
            // 'Payable Wage (₹)': myFunc.formatAmount(e.salaryPayableWithoutOverTimeAndVariablePay),
            // 'Total Payble Wage (₹)': myFunc.formatAmount(e.netPay),
            // 'Payment Status': e.paymentStatus
        }))

        if (api === 'raw') {

            return res.status(200).json({
                status: true, message: 'success',


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
        const worksheet = workbook.addWorksheet('Payable Report');
        let values = []
        let subHeader = []
        let headers = Object.keys(excelData[0]);
        let midHeader = []

        worksheet.addRow(headers);

        excelData = myFunc.replaceEmptyValues(excelData)



        let actualHeadStartIndex = headers.indexOf('Actual Wages')
        let generatedHeadStartIndex = headers.indexOf('Generated Wages')
        // console.log(generatedHeadStartIndex);

        subHeader.unshift(...new Array(actualHeadStartIndex).fill(''));

        excelData.forEach(e => {
            let value = Object.values(e)
            let row = []
            value.forEach((x, i) => {

                row.push(x);

            });

            values.push(row)
        });

        let actualHead = Object.keys(excelData[0]['Actual Wages'])
        let generatedHead = Object.keys(excelData[0]['Generated Wages'])
        let actualWage = (excelData[0]['Actual Wages'])
        let generatedWage = (excelData[0]['Generated Wages'])

        subHeader.push(...actualHead)
        subHeader.push(...generatedHead)


        let headerRowOne = worksheet.getRow(1)




        headers = headers.slice(0, actualHeadStartIndex).concat(['Actual Wages']).concat(new Array(actualHead.length - 1)).concat(['Generated Wages']).concat(new Array(generatedHead.length - 1))


        headerRowOne.values = headers
        headerRowOne.commit();

        let subHeaderRow = worksheet.getRow(2);
        subHeaderRow.values = subHeader;
        subHeaderRow.commit();

        worksheet.addRows(values);

        let employee = excelData


        employee.map((e, i) => {
            Object.entries(e['Actual Wages'] || {}).forEach(([key, item], index) => {
                const cellIndex = headerRowOne.values.indexOf('Actual Wages') + index;
                const columnLetter = myFunc.getColumnLetter(cellIndex);
                const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`);
                valueCell.value = item;
            });
            Object.entries(e['Generated Wages'] || {}).forEach(([key, item], index) => {
                const cellIndex = headerRowOne.values.indexOf('Generated Wages') + index;
                const columnLetter = myFunc.getColumnLetter(cellIndex);
                const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`);
                valueCell.value = item;
            });

        })

        // let mergeData = ['Actual Wages',
        //     'Generated Wages'
        // ]
        // mergeData.map(e => {
        //     worksheet.mergeCells(`${myFunc.getColumnLetter(headerRowOne.values.indexOf(e))}1:${myFunc.getColumnLetter(employee[0][e].length - 1 + headerRowOne.values.indexOf(e))}1`);
        // })

        let mergeData = ['Actual Wages', 'Generated Wages'];

        mergeData.forEach(key => {
            const startColIdx = headerRowOne.values.indexOf(key);
            if (startColIdx === -1) return; // Skip if header not found

            const subKeys = Object.keys(employee[0][key] || {});
            const span = subKeys.length;

            if (span > 1) {
                const startCol = myFunc.getColumnLetter(startColIdx);
                const endCol = myFunc.getColumnLetter(startColIdx + span - 1);

                // Only merge if more than 1 column and not previously merged
                worksheet.mergeCells(`${startCol}1:${endCol}1`);
            }
        });



        // Apply formatting to header rows
        const headerRow = worksheet.getRow(1);
        const headerRow2 = worksheet.getRow(2);









        // let totalIndex = headers.indexOf('Wage Template')
        // let payableWageIndex = headers.indexOf('Payable Wage (₹)')
        // let otIndex = headers.indexOf('OT (₹)')
        // let variablePayIndex = headers.indexOf('Variable Pay (₹)')
        // let totalPayableWageIndex = headers.indexOf('Total Payble Wage (₹)')
        // let len = headers.length;
        // let row = new Array(len).fill('');
        // row[totalIndex] = `Total`
        // row[payableWageIndex] = `${myFunc.formatAmount(totalPayableWageWithoutOverTimeAndVariablePay)}`
        // row[otIndex] = `${myFunc.formatAmount(totalOvertime)}`
        // row[variablePayIndex] = `${myFunc.formatAmount(totalVariablePay)}`
        // row[totalPayableWageIndex] = `${myFunc.formatAmount(totalPaybleWage)}`
        // values.push(row);



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
            row.height = 25;
        });


        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
            cell.font = { bold: true };
        });

        headerRow2.eachCell(cell => {
            cell.font = { bold: true };
        });
        worksheet.columns.forEach(column => {
            column.width = 30;
        });
        // const lastRow = worksheet.lastRow;
        // lastRow.eachCell((cell, colNumber) => {
        //     cell.font = { bold: true };
        // });

        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `PayableReport_${month}_${year}_${Date.now()}.xlsx`;
        const customPathToDisplay = `${process.env.CUSTUM_PATH_DISPLAY}\\${fileName}`




        if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
        }

        const filePath = path.join(customPath, fileName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
     

        await workbook.xlsx.writeFile(filePath);


        await db.query(
            `
          INSERT INTO eve_blue_all_report_download_log (createdDate, createdSession, createdIp, excelFileUrl, status,expiryDate,excelName,type)
          VALUES (NOW(), :session, :ip, :file,:status,:expiryDate, :excelName,:type)
          `,
            {
                replacements: {

                    session: `${moment(month, 'MM').format('MMMM')} ${year}`,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    file: customPathToDisplay,
                    status: 'A',
                    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days expiry for testing                                                   
                    // expiryDate: new Date(Date.now() + 1000*60 ), // 1 min expiry for testing                                                   
                    excelName: fileName,
                    type: 'Payable Report'
                },
                type: QueryTypes.INSERT
            }
        );

        res.status(200).json({
            status: true,
            result: "success",
            alert: 'Excel file generated successfully',
            filePath: `${customPathToDisplay}`,
        });


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })

    }
}
module.exports = { getPayableReportExcel }