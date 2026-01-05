let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const serialize = require('php-serialize')
const getPayableMonthlyWagesExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        // let db = sequelize('59')
        let data = { ...req.body, ...req.query }
        const { year, month, empId, api, branchId, category, departmentId, designationId, empCode, paymentStatus, salaryFrom, salaryTo, subCompId, subDepartmentId, templateId, type } = data
        const countQuery = await db.query(
            `
                             SELECT COUNT(*) AS total
                             FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                             -- LEFT JOIN eve_blue_company_salary_components AS c ON a.salaryTemplateId=c.id
                             WHERE a.status ='A'
                             AND b.employeeType = 'Blue Collar'
                             AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND a.isGenerated = 'yes'
                             AND (a.wagesType='monthly')
                             and (:branchId is null or b.employeeBranchId=:branchId)
                             and (:category is null or b.employeeType=:category)
                                and (:departmentId is null or b.employeeDepartmentId=:departmentId)
                                and (:designationId is null or b.employeeDesignationId=:designationId)
                                and (:empCode is null or b.employeeCode=:empCode)
                                and (:subCompId is null or b.employeeSubCompanyId=:subCompId)
                                and (:subDepartmentId is null or b.employeeSubDepartmentId=:subDepartmentId)
                                and (:paymentStatus is null or a.paymentStatus=:paymentStatus)
                                   and (:type is null or b.empTypeId=:type)
                                     and (:templateId is null or a.salaryTemplateId=:templateId)
                                     and (:empId is null or b.id=:empId)
                                     
                 
            `, {
            replacements: {

                empId: empId || null,
                branchId: branchId || null,
                category: category || null,
                departmentId: departmentId || null,
                designationId: designationId || null,
                empCode: empCode || null,
                subCompId: subCompId || null,
                subDepartmentId: subDepartmentId || null,
                paymentStatus: paymentStatus || null,
                type: type || null,
                templateId: templateId || null,
                month: month,
                year: year,

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
                         a.salary_types,
                         a.paymentStatus,
                         b.employeeBranchId,
                         b.employeeDepartmentId,
                         b.employeeSubDepartmentId,
                         b.employeeDesignationId,
                         b.salaryTemplateId,
                         b.employeeType,
                         b.employeeUAN,b.empTypeId,b.locationID

                         FROM eve_acc_blue_coller_employee_payslip_preview AS a
                         LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                           -- LEFT JOIN eve_blue_company_salary_components AS c ON a.salaryTemplateId=c.id
                         WHERE a.status ='A'
                             AND b.employeeType = 'Blue Collar'
                             AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND a.isGenerated = 'yes'
                             AND (a.wagesType='monthly')

                              and (:branchId is null or b.employeeBranchId=:branchId)
                                and (:category is null or b.employeeType=:category)
                                and (:departmentId is null or b.employeeDepartmentId=:departmentId)
                                 and (:designationId is null or b.employeeDesignationId=:designationId)
                                    and (:empCode is null or b.employeeCode=:empCode)
                                       and (:subCompId is null or b.employeeSubCompanyId=:subCompId)
                                        and (:subDepartmentId is null or b.employeeSubDepartmentId=:subDepartmentId)
                                          and (:paymentStatus is null or a.paymentStatus=:paymentStatus)
                                           and (:type is null or b.empTypeId=:type)
                                           and (:templateId is null or a.salaryTemplateId=:templateId)
                                              and (:empId is null or b.id=:empId)

                             ORDER BY b.employeeName asc
                             limit :limit
                             offset :offset                       
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    empId: empId || null,
                    branchId: branchId || null,
                    category: category || null,
                    departmentId: departmentId || null,
                    designationId: designationId || null,
                    empCode: empCode || null,
                    subCompId: subCompId || null,
                    subDepartmentId: subDepartmentId || null,
                    paymentStatus: paymentStatus || null,
                    type: type || null,
                    templateId: templateId || null,
                    month: month,
                    year: year,
                }, type: QueryTypes.SELECT
            }
        )
        let totalPayableWages = 0
        let totalOvertime = 0
        let totalVariablePay = 0
        let ttlTotalPayableWages = 0
        await Promise.all(sqlData.map(async (e, i) => {

            e.subCompany = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartment = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.type = await myFunc.getEmpTypeName(e.empTypeId, db)
            e.location = await myFunc.getLocationNameById(e.locationID, db)

            let sqlTemplate = await db.query(` 
                                               SELECT templateName 
                                               FROM eve_blue_company_salary_components 
                                               WHERE id = :salaryTemplateId`,
                {
                    replacements: {
                        salaryTemplateId: e.salaryTemplateId

                    }, type: QueryTypes.SELECT
                }
            )
            if (sqlTemplate.length > 0 && sqlTemplate[0].templateName) {
                e['templateName'] = sqlTemplate[0].templateName
            }

            let overtimeAmount = 0
            let generatedWagesAmount = 0
            let variablePay = 0


            let salaryTypes = serialize.unserialize(e.salary_types)
            let deductionDetails = (salaryTypes.deductionDetails)

            let additionDetails = (salaryTypes.additionDetails)
            generatedWagesAmount += parseFloat(additionDetails?.totalEarning) || 0

            e.ttlPayableWages = parseFloat(salaryTypes?.netPay) || 0
            ttlTotalPayableWages += parseFloat(e.ttlPayableWages)

            // Object.values(deductionDetails).forEach(item => {

            // });


            Object.values(additionDetails).forEach(item => {
                if (item?.salaryLabel === 'Over Time') {
                    overtimeAmount += parseFloat(item?.salaryAmount) || 0
                }
                if (item?.salaryLabel === 'Variable Pay') {
                    variablePay += parseFloat(item?.salaryAmount) || 0
                }
            })

            e['OTamount'] = overtimeAmount
            totalOvertime += parseFloat(e.OTamount)
            e['variablePay'] = variablePay
            totalVariablePay += parseFloat(e.variablePay)
            e['payableWages'] = parseFloat(e.ttlPayableWages) - parseFloat(e.OTamount + e.variablePay)
            totalPayableWages += parseFloat(e.payableWages)
        }))


        let excelData = (sqlData).map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Worker Code': e.employeeCode,
            'Category':e.employeeType,
            'Type': e.type,
            'Worker Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Location': e.location,
            'Department': e.department,
            'Sub Department': e.subDepartment,
            'Designation': e.designation,
            'Wage Template': e.templateName,
            'Payable Wage (₹)': myFunc.formatAmount(e.payableWages),
            'OT (₹)': myFunc.formatAmount(e.OTamount),
            'Variable Pay (₹)': myFunc.formatAmount(e.variablePay),
            'Total Payble Wage (₹)': myFunc.formatAmount(e.ttlPayableWages),
            'Payment Status': e.paymentStatus,
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
        const worksheet = workbook.addWorksheet('Payable Monthly Wages');
        let values = []

        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);
        excelData = myFunc.replaceEmptyValues(excelData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });


        let len = headers.length;
        let row = new Array(len).fill('');
        row[headers.indexOf('Payable Wage (₹)')] = myFunc.formatAmount(totalPayableWages)
        row[headers.indexOf('OT (₹)')] = myFunc.formatAmount(totalOvertime)
        row[headers.indexOf('Variable Pay (₹)')] = myFunc.formatAmount(totalVariablePay)
        row[headers.indexOf('Total Payble Wage (₹)')] = myFunc.formatAmount(ttlTotalPayableWages)

        row[headers.indexOf('Wage Template')] = 'Total :'
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
            row.height = 15;
        });

        // Header style
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
            cell.font = { bold: true };
        });

        worksheet.columns.forEach(column => {
            column.width = 25;
        });

        const lastRow = worksheet.lastRow;
        lastRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Payable Monthly Wages.xlsx');

        await workbook.xlsx.write(res);
        res.end();





    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getPayableMonthlyWagesExcel }