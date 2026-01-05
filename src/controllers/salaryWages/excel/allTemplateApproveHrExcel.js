let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const serialize = require('php-serialize')
const moment = require('moment')
const getAllTemplateApproveHrExcel = async (req, res) => {
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

        const { year, month, api, subCompanyId, templateId, employeeBranchId, locationID, employeeDepartmentId } = data

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
                             AND (:employeeBranchId is null or b.employeeBranchId = :employeeBranchId)
                             AND (:locationID is null or b.locationID = :locationID)
                             AND (:employeeDepartmentId is null or b.employeeDepartmentId = :employeeDepartmentId)
                             -- AND (:templateId is null or b.salaryTemplateId = :templateId)

                            -- AND a.isGenerated = 'yes'
                             -- AND (a.wagesType='monthly')
                            -- and a.approvedType is not null

            `, {
            replacements: {
                year: year,
                month: month,
                subCompanyId: subCompanyId || null,
                employeeBranchId: employeeBranchId || null,
                locationID: locationID || null,
                employeeDepartmentId: employeeDepartmentId || null,

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
                              AND (:employeeBranchId is null or b.employeeBranchId = :employeeBranchId)
                             AND (:locationID is null or b.locationID = :locationID)
                             AND (:employeeDepartmentId is null or b.employeeDepartmentId = :employeeDepartmentId)
                              -- AND (:templateId is null or b.salaryTemplateId = :templateId)
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
                employeeBranchId: employeeBranchId || null,
                locationID: locationID || null,
                employeeDepartmentId: employeeDepartmentId || null,
            },
            type: QueryTypes.SELECT
        })

        let totalEarning = 0
        let totalDeduction = 0
        let totalNetPay = 0
        let totalPayableGross = 0
        let totalCtc = 0

        // Step 1: Build master headers before Promise.all
        const masterHeaders = new Set();
        sqlData.forEach(emp => {
            let salaryTypes = serialize.unserialize(emp.salary_types || {});
            let additionDetails = salaryTypes.additionDetails || {};
            let deductionDetails = salaryTypes.deductionDetails || {};

            Object.values(additionDetails).forEach(item => {
                if (item?.salaryLabel) masterHeaders.add(item.salaryLabel);
            });
            Object.values(deductionDetails).forEach(item => {
                if (item?.salaryLabel) masterHeaders.add(item.salaryLabel);
            });
        });

        // Convert to array for consistent order
        const header = Array.from(masterHeaders);




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





            let daySummary = serialize.unserialize(e.daySummary)
            e['Total Days'] = daySummary.totalDays
            e['Working Days'] = daySummary.WorkingDays
            e['Paid Leaves'] = daySummary.PaidLeaves
            // e['LWP(Absent Days)'] = (parseFloat(daySummary.absentDays) - parseFloat(daySummary.PaidLeaves)) || 0
            e['LWP(Absent Days)'] = daySummary.totalNonPaidLeave
            e['Present Days'] = daySummary.presetntDays
            e['Net Paid Days'] = daySummary.NetPaidDays




            let salaryTypes = serialize.unserialize(e.salary_types)

            let deductionDetails = (salaryTypes.deductionDetails)

            let additionDetails = (salaryTypes.additionDetails)




            const totals = {};  // dynamic accumulator

            Object.values(additionDetails).forEach(item => {
                if (item?.salaryLabel && item?.salaryAmount !== undefined && item.salaryLabel !== '') {
                    const amount = parseFloat(item.salaryAmount.toString().replace(/,/g, '')) || 0;

                    // formatted value for display
                    e[item.salaryLabel] = myFunc.formatAmount(item.salaryAmount);

                    // accumulate totals dynamically
                    totals[item.salaryLabel] = (totals[item.salaryLabel] || 0) + amount;
                }
            });

            Object.values(deductionDetails).forEach(item => {
                if (item?.salaryLabel && item?.salaryAmount !== undefined && item.salaryLabel !== '') {
                    const amount = parseFloat(item.salaryAmount.toString().replace(/,/g, '')) || 0;

                    e[item.salaryLabel] = myFunc.formatAmount(item.salaryAmount);

                    totals[item.salaryLabel] = (totals[item.salaryLabel] || 0) + amount;
                }
            });




            if (sqlTemplate.length > 0 && sqlTemplate[0].wageSetting && sqlTemplate[0].wageSetting === 'date_to_date') {
                e['CTC'] = ''
                e['Payable Gross'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
                totalPayableGross += parseFloat(additionDetails.totalEarning)

            }
            else {
                // e['CTC'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
                // totalCtc += parseFloat(additionDetails.totalEarning)
                e['CTC'] = ''
                e['Payable Gross'] = myFunc.formatAmount(salaryTypes.payableGross || 0)
                totalPayableGross += parseFloat(salaryTypes.payableGross)
            }

            e['Total Earnings'] = myFunc.formatAmount(additionDetails.totalEarning || 0)
            totalEarning += parseFloat(additionDetails.totalEarning)
            e['Total Deductions'] = myFunc.formatAmount(deductionDetails.totalDeduction || 0)
            totalDeduction += parseFloat(deductionDetails.totalDeduction)
            e['Net Pay'] = myFunc.formatAmount(salaryTypes.netPay || 0)
            totalNetPay += parseFloat(salaryTypes.netPay)
            // e['Payable Gross'] = myFunc.formatAmount(salaryTypes.payableGross || 0)
            // totalPayableGross += parseFloat(salaryTypes.payableGross)
            e['In Words'] = salaryTypes.netPayAmount || ''

            // --- Normalize missing headers ---
            header.forEach(header => {
                if (e[header] === undefined || e[header] === null || e[header] === '') {
                    e[header] = "0.00";
                }
            });




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


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Approve Template Hr');

        // Step 1: Build master headers from all employees
        const masterHeader = new Set();
        sqlData.forEach(emp => {
            Object.keys(emp).forEach(key => masterHeader.add(key));
        });
        const headers = Array.from(masterHeader); // consistent order

        // Step 2: Add header row
        worksheet.addRow(headers);

        // Step 3: Add employee rows in same order
        sqlData.forEach(emp => {
            const row = headers.map(header => {
                return emp[header] !== undefined && emp[header] !== null && emp[header] !== ''
                    ? emp[header]
                    : "--"; // default if missing
            });
            worksheet.addRow(row);
        });

        // Step 4: Styling
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

        // After adding all employee rows
        const totalsRow = headers.map((header, colIndex) => {
            // For non-numeric fields (like Employee Name, Department, etc.)
            if (["Sl. No.", "Employee Code", "Employee Name", "DOJ", "From Date", "To Date",
                "Bank A/c No.", "Bank Name", "Bank IFSC", "Sub Company", "Branch",
                "Department", "Sub Department", "Designation", "Location", "In Words", "Net Paid Days", 'Total Days', 'Working Days', 'Paid Leaves', 'LWP(Absent Days)', 'Present Days', 'Net Paid Days'].includes(header)) {
                return colIndex === 0 ? "TOTAL :" : ""; // put "TOTAL :" in first column
            }

            // For numeric fields, sum all values
            let sum = 0;
            sqlData.forEach(emp => {
                const val = emp[header];
                if (val !== undefined && val !== null && val !== "" && !isNaN(val.toString().replace(/,/g, ""))) {
                    sum += parseFloat(val.toString().replace(/,/g, ""));
                }
            });

            return myFunc.formatAmount(sum); // format the total
        });

        // Add totals row at the bottom
        worksheet.addRow(totalsRow);


        const lastRow = worksheet.lastRow;
        lastRow.eachCell(cell => {
            cell.font = { bold: true };
        });

        // Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=AllTemplate Approve Hr.xlsx');
        await workbook.xlsx.write(res);
        res.end();





    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getAllTemplateApproveHrExcel }
















