let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const phpSerialize = require('php-serialize');

const getMyPfLedgerExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)

        // const tokenUserId = '389'
        // const tokenBranchId='75'
        // let db = sequelize('59')

        let data = req.body;
        const { startYear, endYear, employeeId, employeeCode, subCompanyId, branchId, empDepartment, empDesig } = data
        const startYearMonth = `${startYear}-04`
        const endYearMonth = `${endYear}-03`


        const countQuery = await db.query(
            `
                            select count(*) as total
                            from eve_acc_employee 
                            where status='A'
                                 AND DATE_FORMAT(employeeDoj, '%Y-%m') <= :startYearMonth
                                    -- and date_format(employeeDoj, "%Y-%m") <= :endYearMonth

                                  -- AND (employeeType = '' 
                                               -- OR employeeType IS NULL
                                               -- OR employeeType = 'White Collar'
                                           -- )

                                               -- AND (   
                                                -- employeeCurrentStatus  IS NULL
                                                -- OR   employeeCurrentStatus   =   ''
                                                -- OR   employeeCurrentStatus   =   'Active'    
                                                -- OR   employeeCurrentStatus   =   'joining' 
                                                -- OR   employeeCurrentStatus   =   'offerletter'
                                            -- )

                                  
                    



                                    and (:employeeCode is null or employeeCode=:employeeCode)
                                    and (:employeeId is null or id=:employeeId)
                                    and (:subCompanyId is null or employeeSubCompanyId=:subCompanyId)
                                    and (:branchId is null or employeeBranchId=:branchId)
                                    and (:empDepartment is null or employeeDepartmentId=:empDepartment)
                                    and (:empDesig is null or employeeDesignationId=:empDesig)

                                    and id=:tokenUserId

                                    
                          

            `, {
            replacements: {
                tokenUserId: tokenUserId,
                startYearMonth: startYearMonth,
                endYearMonth: endYearMonth,
                employeeCode: employeeCode || null,
                employeeId: employeeId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                empDepartment: empDepartment || null,
                empDesig: empDesig || null,
            }, type: QueryTypes.SELECT
        }
        )

        const totalData = countQuery[0]['total']

        // console.log(startYearMonth)

        if (totalData === 0) {
            return res.status(200).json({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        let getData = await db.query(
            ` 
                                      select 
                                      @row_number:=@row_number + 1 AS slno,
                                      -- date_format(employeeDoj, "%Y-%m") as doj,
                                 
                                      id,employeeName,employeeDoj,
                                      employeeDepartmentId,
                                      employeeDesignationId,
                                      employeeCode,
                                      employeeSubCompanyId,
                                      employeeBranchId,
                                      is_salary_hold,
                                      salaryTemplateId

                                     from eve_acc_employee  
                                       CROSS JOIN
                                     (SELECT @row_number := :offset) AS init
                                      
                                     where status='A'
                                   AND DATE_FORMAT(employeeDoj, '%Y-%m') <= :startYearMonth
                                    -- and date_format(employeeDoj, "%Y-%m") >= :endYearMonth

                                     -- and employeeBranchId=:tokenBranchId

                                          -- AND (   
                                             --   employeeCurrentStatus  IS NULL
                                               -- OR   employeeCurrentStatus   =   ''
                                               -- OR   employeeCurrentStatus   =   'Active'    
                                               -- OR   employeeCurrentStatus   =   'joining' 
                                               -- OR   employeeCurrentStatus   =   'offerletter'
                                            -- )



                                       and (:employeeCode is null or employeeCode=:employeeCode)   
                                          and (:employeeId is null or id=:employeeId) 
                                             and (:subCompanyId is null or employeeSubCompanyId=:subCompanyId) 
                                              and (:branchId is null or employeeBranchId=:branchId) 
                                                and (:empDepartment is null or employeeDepartmentId=:empDepartment)  
                                                  and (:empDesig is null or employeeDesignationId=:empDesig)    

                                                    -- AND (employeeType = '' 
                                                -- OR employeeType IS NULL
                                                -- OR employeeType = 'White Collar'
                                            -- )
                                                 and id=:tokenUserId

                                            order by employeeName


                                     limit :limit 
                                    offset :offset                                                                          
                                  
                               
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    startYearMonth: startYearMonth,
                    endYearMonth: endYearMonth,
                    employeeCode: employeeCode || null,
                    employeeId: employeeId || null,
                    subCompanyId: subCompanyId || null,
                    branchId: branchId || null,
                    empDepartment: empDepartment || null,
                    empDesig: empDesig || null,
                    tokenUserId: tokenUserId,

                }, type: QueryTypes.SELECT
            }
        )

        let noOfMonths = 12

        let totalEmployerContribution = 0
        let totalEmployeeContribution = 0
        await Promise.all(getData.map(async (e, i) => {
            e.subComapanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)

            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)

            const monthsArray = []
            for (let i = 1; i <= noOfMonths; i++) {
                let number = i.toString().padStart(2, '0');
                let newObj = {
                    month: number,
                    employerContribution: '--',
                    employeeContribution: '--',
                }
                monthsArray.push(newObj)
            }
            monthsArray.sort((a, b) => {
                const customOrder = ['04', '05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03'];
                return customOrder.indexOf(a.month) - customOrder.indexOf(b.month);
            });
            e.app = monthsArray

            const payslipPriewModel = await db.query(
                `
                      select 
                      employeeId,
                      salary_types,
                      -- salaryTemplateId,
                      salaryOfMonth
                      -- salaryOfYear  
                      from eve_acc_employee_payslip_preview
                       where status='A'
                       and employeeId=:employeeId
                       
                   AND concat(salaryOfYear, '-', lpad(salaryOfMonth, 2, '0')) >= :startYearMonth
                   AND concat(salaryOfYear, '-', lpad(salaryOfMonth, 2, '0')) <= :endYearMonth
                       and isGenerated='yes'
                       and salary_types is not null


             
            `, {
                replacements: {
                    employeeId: e.id,
                    startYearMonth: startYearMonth,
                    endYearMonth: endYearMonth,
                }, type: QueryTypes.SELECT
            }
            )

            let totalEmployerContribution = 0
            let totalEmployeeContribution = 0
            if (payslipPriewModel.length > 0 && payslipPriewModel[0].salary_types !== null) {
                let payslipMap = new Map();

                // Map the results to their months
                payslipPriewModel.map((x) => payslipMap.set(x.salaryOfMonth, x));

                await Promise.all(
                    e.app.map(async (x) => {
                        if (payslipMap.has(x.month)) {
                            let record = payslipMap.get(x.month);

                            // Unserialize the salary_types field
                            let unserializedData = phpSerialize.unserialize(record.salary_types);


                            // Extract the deductionDetails field
                            let deductionDetails = unserializedData.deductionDetails;
                            let additionDetails = unserializedData.additionDetails;
                            // console.log(additionDetails);



                            let employeeContribution = '--'
                            let employerContribution = '--'
                            for (let item of Object.values(additionDetails)) {
                                if (item.salaryLabel === 'PF(Employees Contribution)') {
                                    employeeContribution = item.salaryAmount;
                                    x.employeeContribution = employeeContribution
                                    totalEmployeeContribution += parseFloat(employeeContribution)
                                    break;
                                }
                            }
                            for (let item of Object.values(deductionDetails)) {
                                if (item.salaryLabel === 'PF(Employees Contribution)') {
                                    employeeContribution = item.salaryAmount;
                                    x.employeeContribution = employeeContribution
                                    totalEmployeeContribution += parseFloat(employeeContribution)
                                    break;
                                }
                            }
                            for (let item of Object.values(additionDetails)) {
                                if (item.salaryLabel === 'PF(Employer Contribution)') {
                                    employerContribution = item.salaryAmount;
                                    x.employerContribution = employerContribution
                                    totalEmployerContribution += parseFloat(employerContribution)
                                    break;
                                }
                            }
                            for (let item of Object.values(deductionDetails)) {
                                if (item.salaryLabel === 'PF(Employer Contribution)') {
                                    employerContribution = item.salaryAmount;
                                    x.employerContribution = employerContribution
                                    totalEmployerContribution += parseFloat(employerContribution)
                                    break;
                                }
                            }
                        }
                    })
                );
            }
            e.totalEmployeeContribution = totalEmployeeContribution
            e.totalEmployerContribution = totalEmployerContribution
            totalEmployerContribution+=totalEmployerContribution
            totalEmployeeContribution+=totalEmployeeContribution


        }))
        const excelData = getData.map((e, i) =>
        ({
            'Sl. No.': e.slno,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Quantity': e.quantity,
            'Sub Company': e.subComapanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Designation': e.designationName,
            'App': e.app,
            'Total Employer Contribution (₹)': e.totalEmployerContribution,
            'Total Employee Contribution (₹)': e.totalEmployeeContribution
        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            // totalQuantity: `Total Quantity : ${totalQuantity}`,
            totalEmployerContribution:totalEmployerContribution,
            totalEmployeeContribution:totalEmployeeContribution,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, startYear, endYear, employeeId, employeeCode, subCompanyId, branchId, empDepartment, empDesig, tokenBranchId }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyPfLedgerExcel`,
            data: { token, pageNo, limit, startYear, endYear, employeeId, employeeCode, subCompanyId, branchId, empDepartment, empDesig, tokenBranchId }
        }
        const response = await axios(config)
        return response.data;
    } catch (error) {
        throw error;
    }
}
function getColumnLetter(columnNumber) {
    let columnName = '';
    while (columnNumber > 0) {
        let remainder = (columnNumber - 1) % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
}
async function createExcelFile(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = []
    let employee = data.employee
    
    let header = Object.keys(employee[0])
    let subHeader = []
    let midHeader = []
    let appIndex = header.indexOf('App')
    
    let mergeColumn = []
    
    // console.log( employee);
    employee[0].App.forEach((e, i) => {
        midHeader.push(myFunc.convertMonthName(e.month), '')
        subHeader.push('Employer Contribution (₹)', 'Employee Contribution (₹)')

        let startColumn = (appIndex + 1) + (i * 2)
        let endColumn = (startColumn + 1)

        mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
    })
    header.splice(appIndex, 1, ...midHeader)

    subHeader.unshift(...new Array(appIndex).fill(''))

    values.push(header)
    values.push(subHeader)


    employee.forEach(e => {
        let value = Object.values(e)
        let row = []
        value.forEach((x, i) => {
            if (Array.isArray(x)) {
                x.forEach((z, k) => {
                    row.push(z.employerContribution, z.employeeContribution)
                })
            }
            else {
                row.push(x)
            }

        })
        values.push(row)


    });


    let a = header.indexOf('Total Employer Contribution (₹)')
    let b=header.indexOf('Total Employee Contribution (₹)')
    let c=header.indexOf('Sl. No.')


    let len = header.length
    let row = new Array(len).fill('')

    row[a] = data['totalEmployerContribution']
    row[b] = data['totalEmployeeContribution']
    row[c] = 'Total'

    values.push(row)

    worksheet.addRows(values)
    mergeColumn.forEach((e) => {
        worksheet.mergeCells(e);
    });
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
            row.height = 15

        });
    });
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };
    });

    headerRow2.eachCell(cell => {
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });
    worksheet.columns.forEach(column => {
        column.width = 30;
    });
    const lastRow = worksheet.lastRow;

    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    return workbook.xlsx
}

async function getMyPfLedgerExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, startYear, endYear, employeeId, employeeCode, subCompanyId, branchId, empDepartment, empDesig, tokenBranchId } = data
        let apiData = await fetchData({ token, pageNo, limit, startYear, endYear, employeeId, employeeCode, subCompanyId, branchId, empDepartment, empDesig, tokenBranchId })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My PF ledger.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyPfLedgerExcel, getMyPfLedgerExcelSheet }