let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const serialize = require('php-serialize')
const moment = require('moment')
const getApproveTemplateHrExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        // let db = sequelize('59')
        // let db1 = sequelize()

        let data = { ...req.body, ...req.query }

        const { year, month, api, subCompanyId, templateId } = data

        if (!year) {
            return res.status(400).send({ status: false, msg: 'Year is required' })
        }

        if (!month) {
            return res.status(400).send({ status: false, msg: 'Month is required' })
        }

        let countQuery = await db.query(`
            
                             SELECT COUNT(*) AS total
                             FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id

                             WHERE a.status ='A'

                             AND b.employeeType = 'Blue Collar'
                               AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                             AND (:templateId is null or b.salaryTemplateId = :templateId)

                            -- AND a.isGenerated = 'yes'
                             -- AND (a.wagesType='monthly')
                            -- and a.approvedType is not null

            `, {
            replacements: {
                year: year,
                month: month,
                subCompanyId: subCompanyId || null,
                templateId: templateId || null,

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

        let sqlData = await db.query(`
             SELECT 
                         b.id,
                         b.employeeCode AS 'Employee Code',
                         b.employeeName AS 'Employee Name',
                         b.employeeSubCompanyId,
                         DATE_FORMAT(b.employeeDoj, '%d-%m-%Y') AS 'DOJ',
                         a.salaryOfMonth,
                         a.salaryOfYear,
                         a.salaryTemplateId,
                         DATE_FORMAT(a.fromDate, '%d-%m-%Y') AS 'From Date',
                         DATE_FORMAT(a.toDate, '%d-%m-%Y') AS 'To Date',
                     
                                          
                         a.salary_types,
                         a.daySummary,
                         -- a.netPay,
                       
                         b.employeeBranchId,

                         b.employeeDepartmentId,

                         b.employeeSubDepartmentId,

                         b.employeeDesignationId,

                         b.salaryTemplateId,

                       

                         b.locationID,
                         b.empTypeId,
                         b.employeeESIC,
                         b.employeeUAN,
                         b.accNumber AS 'Bank A/c No.',
                         b.bankName AS 'Bank Name',
                         b.IFSCnum AS 'Bank IFSC'

                      
                         
                         FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id

                             WHERE a.status ='A'

                             AND b.employeeType = 'Blue Collar'
                             AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                            AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                              AND (:templateId is null or b.salaryTemplateId = :templateId)
                            -- AND a.isGenerated = 'yes'
                            -- AND (a.wagesType='monthly')
                            -- and a.approvedType is not null

                            ORDER BY b.employeeName asc

                            limit :limit

                            offset :offset          
  
         
            `, {
            replacements: {
                limit: limit,
                offset: offset,
                year: year,
                month: month,
                subCompanyId: subCompanyId || null,
                templateId: templateId || null,
            },
            type: QueryTypes.SELECT
        })
        let totalBasic = 0
        let totalCca = 0
        let totalCea = 0
        let totalConveyanceAllowance = 0
        let totalMonthlyAdHoc = 0
        let totalHra = 0
        let totalExtraDuty = 0
        let totalSa = 0
        let totalOvertime = 0
        let totalPt = 0
        let totalWashingAllowance = 0
        let totalDa = 0
        let totalMedicalAllowance = 0
        let totalEarning = 0
        let totalDeduction = 0
        let totalNetPay = 0
        let totalPayableGross = 0
        let totalCtc = 0
        let totalVariablePay = 0
        let totalWa = 0
        let totalPfEmployeesContribution = 0
        let totalEsicEmployeesContribution = 0
        let totalLabourWelfareFund = 0
        let totalTds = 0
        let totalEsicEmployeerContribution = 0
        let totalPfEmployeerContribution = 0
        let totalPenulty = 0
        let totalOtherAllowance = 0


        await Promise.all(sqlData.map(async e => {

            let sqlTemplate = await db.query(`
            SELECT wageSetting FROM eve_blue_company_salary_components WHERE id = :salaryTemplateId`, {
                replacements: {
                    salaryTemplateId: e.salaryTemplateId

                }, type: QueryTypes.SELECT
            }
            )





            e['Sub Company'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e['Branch'] = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e['Department'] = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['Sub Department'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e['Designation'] = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e['Location'] = await myFunc.getLocationNameById(e.locationID, db)

            // let startDate = moment(e['From Date'], 'DD-MM-YYYY');
            // let endDate = moment(e['To Date'], 'DD-MM-YYYY');

            let daySummary = serialize.unserialize(e.daySummary)
            e['Total Days'] = daySummary.totalDays
            e['Working Days'] = daySummary.WorkingDays
            e['Paid Leaves'] = daySummary.PaidLeaves
             e['LWP(Absent Days)'] = daySummary.totalNonPaidLeave
            // e['LWP(Absent Days)'] = daySummary.absentDays
            e['Present Days'] = daySummary.presetntDays
            e['Net Paid Days'] = daySummary.NetPaidDays

            let salaryTypes = serialize.unserialize(e.salary_types)

            let deductionDetails = (salaryTypes.deductionDetails)

            let additionDetails = (salaryTypes.additionDetails)



            Object.keys(additionDetails).forEach(key => {
                if (!isNaN(key)) {
                    let item = additionDetails[key];

                    // Check if salaryLabel exists and is not empty
                    if (item.salaryLabel && item.salaryAmount !== undefined && item.salaryLabel !== '') {
                        e[item.salaryLabel] = myFunc.formatAmount(item.salaryAmount);
                    }
                }
            });
            Object.keys(deductionDetails).forEach(key => {
                if (!isNaN(key)) {
                    let item = deductionDetails[key];

                    // Check if salaryLabel exists and is not empty
                    if (item.salaryLabel && item.salaryAmount !== undefined && item.salaryLabel !== '') {
                        e[item.salaryLabel] = myFunc.formatAmount(item.salaryAmount);
                    }
                }
            });

            Object.values(additionDetails).forEach(item => {
                if (item?.salaryLabel === 'Basic') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.basic = myFunc.formatAmount(item.salaryAmount);
                    totalBasic += amount;
                }
                if (item?.salaryLabel === 'CCA') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.cca = myFunc.formatAmount(item.salaryAmount);
                    totalCca += amount;
                }
                if (item?.salaryLabel === 'CEA (Children Education Allowance)') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.cea = myFunc.formatAmount(item.salaryAmount);
                    totalCea += amount;
                }
                if (item?.salaryLabel === 'Conveyance allowance') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.conveyanceAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalConveyanceAllowance += amount;
                }
                if (item?.salaryLabel === 'Monthly ad hoc') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.monthlyAdHoc = myFunc.formatAmount(item.salaryAmount);
                    totalMonthlyAdHoc += amount;
                }
                if (item?.salaryLabel === 'HRA') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.hra = myFunc.formatAmount(item.salaryAmount);
                    totalHra += amount;
                }
                if (item?.salaryLabel === 'Extra Duty') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.extraDuty = myFunc.formatAmount(item.salaryAmount);
                    totalExtraDuty += amount;
                }
                if (item?.salaryLabel === 'SA') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.sa = myFunc.formatAmount(item.salaryAmount);
                    totalSa += amount;
                }
                if (item?.salaryLabel === 'Over Time') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.overtime = myFunc.formatAmount(item.salaryAmount);
                    totalOvertime += amount;
                }
                if (item?.salaryLabel === 'Washing Allowance') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.washingAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalWashingAllowance += amount;
                }
                if (item?.salaryLabel === 'DA (Dearness Allowance)') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.da = myFunc.formatAmount(item.salaryAmount);
                    totalDa += amount;
                }
                if (item?.salaryLabel === 'Medical Allowance') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.medicalAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalMedicalAllowance += amount;
                }
                if (item?.salaryLabel === 'Variable Pay') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.medicalAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalVariablePay += amount;
                }
                if (item?.salaryLabel === 'WA') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.medicalAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalWa += amount;
                }
                if (item?.salaryLabel === 'ESIC(Employer Contribution)') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.medicalAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalEsicEmployeerContribution += amount;
                }
                if (item?.salaryLabel === 'PF(Employer Contribution)') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.medicalAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalPfEmployeerContribution += amount;
                }

                   if (item?.salaryLabel === 'Other Allowance') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.medicalAllowance = myFunc.formatAmount(item.salaryAmount);
                    totalOtherAllowance += amount;


                }




            });
            Object.values(deductionDetails).forEach(item => {


                if (item?.salaryLabel === 'PT') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.pt = myFunc.formatAmount(item.salaryAmount);
                    totalPt += amount;
                }
                if (item?.salaryLabel === 'PF(Employees Contribution)') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.pt = myFunc.formatAmount(item.salaryAmount);
                    totalPfEmployeesContribution += amount;
                }
                if (item?.salaryLabel === 'ESIC(Employees Contribution)') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.pt = myFunc.formatAmount(item.salaryAmount);
                    totalEsicEmployeesContribution += amount;
                }
                if (item?.salaryLabel === 'Labour Welfare Fund') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.pt = myFunc.formatAmount(item.salaryAmount);
                    totalLabourWelfareFund += amount;
                }
                if (item?.salaryLabel === 'TDS') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.pt = myFunc.formatAmount(item.salaryAmount);
                    totalTds += amount;
                }
                if (item?.salaryLabel === 'penulty') {
                    const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
                    // e.pt = myFunc.formatAmount(item.salaryAmount);
                    totalPenulty += amount;
                }

            })

            if (sqlTemplate.length > 0 && sqlTemplate[0].wageSetting && sqlTemplate[0].wageSetting === 'date_to_date') {
                e['CTC'] = ''
                delete e['PF(Employees Contribution)']
                delete e['ESIC(Employees Contribution)']
                delete e['PT']
                delete e['Labour Welfare Fund']
                delete e['TDS']

                e['Payable Gross'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
                totalPayableGross += parseFloat(additionDetails.totalEarning)

            }
            else {
                e['CTC'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
                totalCtc += parseFloat(additionDetails.totalEarning)
                e['Payable Gross'] = myFunc.formatAmount(salaryTypes.payableGross || 0)
                totalPayableGross += parseFloat(salaryTypes.payableGross)
            }

            e['Total Earnings'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
            totalEarning += parseFloat(additionDetails.totalEarning)
            e['Total Deductions'] = myFunc.formatAmount(deductionDetails.totalDeduction || 0)
            totalDeduction += parseFloat(deductionDetails.totalDeduction)
            // e['Payable Gross'] = myFunc.formatAmount(salaryTypes.payableGross || 0)
            // totalPayableGross += parseFloat(salaryTypes.payableGross)
            // e['Payable Gross'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
            // totalPayableGross += parseFloat(additionDetails.totalEarning)
            e['Net Pay'] = myFunc.formatAmount(salaryTypes.netPay || 0)
            totalNetPay += parseFloat(salaryTypes.netPay)
            e['In Words'] = salaryTypes.netPayAmount || ''



        }))
        sqlData.map(e => {
            delete e.employeeSubCompanyId
            delete e.employeeBranchId
            delete e.employeeId
            delete e.employeeDepartmentId
            delete e.employeeSubDepartmentId
            delete e.employeeDesignationId
            delete e.salaryTemplateId
            delete e.templateName
            delete e.templateType
            delete e.salary_types
            delete e.salaryOfMonth
            delete e.salaryOfYear
            delete e.daySummary
            delete e.salaryType
            delete e.templateName
            delete e.id
            delete e.locationID
            delete e.empTypeId
            delete e.employeeESIC
            delete e.employeeUAN
            delete e.VPF



        })
        sqlData = sqlData.map((e, index) => {
            e['Sl. No.'] = index + 1;

            // Reorder object: Sl. No. at the top
            const { ['Sl. No.']: slNo, ...rest } = e;
            return { 'Sl. No.': slNo, ...rest };
        });



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
        const worksheet = workbook.addWorksheet('Approve Template Hr');
        let values = []

        const headers = Object.keys(sqlData[0]);
        worksheet.addRow(headers);
        excelData = myFunc.replaceEmptyValues(sqlData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });


        let len = headers.length;
        let row = new Array(len).fill('');
        row[headers.indexOf('Basic')] = myFunc.formatAmount(totalBasic)
        row[headers.indexOf('CCA')] = myFunc.formatAmount(totalCca)
        row[headers.indexOf('CEA (Children Education Allowance)')] = myFunc.formatAmount(totalCea)
        row[headers.indexOf('Conveyance Allowance')] = myFunc.formatAmount(totalConveyanceAllowance)
        row[headers.indexOf('DA (Dearness Allowance)')] = myFunc.formatAmount(totalDa)
        row[headers.indexOf('HRA')] = myFunc.formatAmount(totalHra)
        row[headers.indexOf('Medical Allowance')] = myFunc.formatAmount(totalMedicalAllowance)
        row[headers.indexOf('Over Time')] = myFunc.formatAmount(totalOvertime)
        row[headers.indexOf('Washing Allowance')] = myFunc.formatAmount(totalWashingAllowance)
        row[headers.indexOf('CTC')] = myFunc.formatAmount(totalCtc)
        row[headers.indexOf('PT')] = myFunc.formatAmount(totalPt)
        row[headers.indexOf('Total Earnings')] = myFunc.formatAmount(totalEarning)
        row[headers.indexOf('Total Deductions')] = myFunc.formatAmount(totalDeduction)
        row[headers.indexOf('Payable Gross')] = myFunc.formatAmount(totalPayableGross)
        row[headers.indexOf('Net Pay')] = myFunc.formatAmount(totalNetPay)
        row[headers.indexOf('Variable Pay')] = myFunc.formatAmount(totalVariablePay)
        row[headers.indexOf('SA')] = myFunc.formatAmount(totalSa)
        row[headers.indexOf('WA')] = myFunc.formatAmount(totalWa)
        row[headers.indexOf('PF(Employees Contribution)')] = myFunc.formatAmount(totalPfEmployeesContribution)
        row[headers.indexOf('ESIC(Employees Contribution)')] = myFunc.formatAmount(totalEsicEmployeesContribution)
        row[headers.indexOf('Labour Welfare Fund')] = myFunc.formatAmount(totalLabourWelfareFund)
        row[headers.indexOf('TDS')] = myFunc.formatAmount(totalTds)
        row[headers.indexOf('penulty')] = myFunc.formatAmount(totalPenulty)
        row[headers.indexOf('PF(Employer Contribution)')] = myFunc.formatAmount(totalPfEmployeerContribution)
        row[headers.indexOf('ESIC(Employer Contribution)')] = myFunc.formatAmount(totalEsicEmployeerContribution)
         row[headers.indexOf('Other Allowance')] = myFunc.formatAmount(totalOtherAllowance)
        row[headers.indexOf('Net Paid Days')] = 'Total :'
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
        res.setHeader('Content-Disposition', 'attachment; filename=ApproveTemplateHr.xlsx');

        await workbook.xlsx.write(res);
        res.end();





    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getApproveTemplateHrExcel }
















