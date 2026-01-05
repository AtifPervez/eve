let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const axios = require('axios')
const moment = require('moment')
const getPayoutGenerationExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        // let db = sequelize('59')
        let data = req.body
        const { year, month, api, branchId, deptId, empName, location, subCompanyId, subDepartmentId } = data
        if (!month || !year) {

            return res.status(400).json({ status: false, msg: 'Month and Year are required' })
        }
        const countQuery = await db.query(
            `
                             SELECT COUNT(*) AS total
                             FROM eve_acc_employee AS a
                             LEFT JOIN eve_blue_company_salary_components AS b ON a.salaryTemplateId = b.id
                             WHERE a.status ='A'
                             AND a.employeeType = 'Blue Collar'

                             AND ( a.employeeCurrentStatus  	= 	'' 
                                            OR a.employeeCurrentStatus IS 	NULL
                                            OR a.employeeCurrentStatus  	= 	'Active'
                                            OR a.employeeCurrentStatus  	= 	'joining'
                                            OR a.employeeCurrentStatus  	= 	'offerletter'
                                        )

                             AND b.wageSetting 			= 	'date_to_date'
                             AND (:empName IS NULL OR REPLACE(a.employeeName, '  ', ' ') = REPLACE(:empName, '  ', ' '))
                             AND (:branchId IS NULL OR a.employeeBranchId = :branchId)
                             AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
                                AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                                AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
                             
                             


                                                                      
            `, {
            replacements: {

                empName: empName || null,
                branchId: branchId || null,
                deptId: deptId || null,
                subCompanyId: subCompanyId || null,
                subDepartmentId: subDepartmentId || null,



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
                         SELECT DISTINCT 
                         a.id,
                         a.employeeName,
                         a.employeeSubCompanyId,
                         a.employeeCode,
                         a.employeeDoj,
                         a.employeeBranchId,
                         a.employeeDepartmentId,
                         a.employeeSubDepartmentId,
                         a.employeeDesignationId,
                         a.salaryTemplateId,
                         a.employeeType,
                         a.locationID,
                         a.empTypeId,
                         b.templateName
                   
                         FROM eve_acc_employee AS a
                         left join eve_blue_company_salary_components AS b on a.salaryTemplateId = b.id
                      
                         WHERE a.status ='A'
                         AND a.employeeType = 'Blue Collar'

                            AND ( a.employeeCurrentStatus  	= 	'' 
                                            OR a.employeeCurrentStatus IS 	NULL
                                            OR a.employeeCurrentStatus  	= 	'Active'
                                            OR a.employeeCurrentStatus  	= 	'joining'
                                            OR a.employeeCurrentStatus  	= 	'offerletter'
                                        )
                                        AND b.wageSetting 			= 	'date_to_date'


                    AND (:empName IS NULL OR REPLACE(a.employeeName, '  ', ' ') = REPLACE(:empName, '  ', ' '))   
                    
                      AND (:branchId IS NULL OR a.employeeBranchId = :branchId)
                             AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
                                AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                                AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
                                  

                            ORDER BY a.employeeName asc

                            limit :limit offset :offset                       
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    empName: empName || null,
                    branchId: branchId || null,
                    deptId: deptId || null,
                    subCompanyId: subCompanyId || null,
                    subDepartmentId: subDepartmentId || null,



                }, type: QueryTypes.SELECT
            }
        )

        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        let totalVariablePay = 0
        let totalEarningsPay = 0
        let totalDeductionsPay = 0
        let totalIdleWagesPay = 0
        let totalPayablePay = 0

        await Promise.all(sqlData.map(async (e) => {

            const sqlSalarySummary = await db.query(
                `
               SELECT inputGross FROM eve_blue_employee_monthly_salary_summary
               WHERE employeeId = :empId
               AND status = 'A'
               `, {
                replacements: {
                    empId: e.id,

                }, type: QueryTypes.SELECT
            }
            )
            let inputGross = 0
            if (sqlSalarySummary.length > 0) {
                inputGross = sqlSalarySummary[0]['inputGross'] || 0;
            }

            e.subCompany = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartment = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.location = await myFunc.getLocationNameById(e.locationID, db)
            e.wageTemplate = await myFunc.getTemplateNameById(e.salaryTemplateId, db)
            e.type = await myFunc.getEmpTypeName(e.empTypeId, db)

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    attendaceWorkingHour: '--',
                    dayWiseOT: '--',
                    perDayAttendanceAmount: '--',
                    OTtotalAmountDayWise: '--',
                };
                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            const sqlAttApproved = await db.query(
                `
                SELECT date, attenDanceWorkingHrs, idleWageStatus
                FROM eve_acc_employee_attendence_approved AS a
                WHERE a.employeeId = :empId
                AND a.date >= :startDate
                AND a.date <= :endDate
                AND a.status = 'A'
                and a.remarks='Approved'
                and a.attenDanceWorkingHrs IS NOT NULL
            `, {
                replacements: {
                    empId: e.id,
                    startDate: `${year}-${month}-01`,
                    endDate: `${year}-${month}-${NoOfdaysInMonth}`
                }, type: QueryTypes.SELECT
            }
            )




            let map = new Map();
            sqlAttApproved.forEach((item) => {
                const dateKey = moment(item.date).format('YYYY-MM-DD');
                if (!map.has(dateKey)) {
                    map.set(dateKey, item);
                }
            });

            let totalIdleWages = 0
            let totalEarnings = 0

          
            e.appDetails.forEach((appDetail) => {
                const dateKey = moment(appDetail.crtDate).format('YYYY-MM-DD');
                if (map.has(dateKey)) {
                    const attData = map.get(dateKey);
                    appDetail.attendaceWorkingHour = `${attData.attenDanceWorkingHrs} hr` || '--';
                    appDetail.dayWiseOT = attData.dayWiseOT || '--';
                    // let [hrs] = attData.attenDanceWorkingHrs.split(':').map(Number);
                    
                    // appDetail.perDayAttendanceAmount = myFunc.formatAmount(inputGross * (hrs))
                    let hrs=parseFloat(myFunc.convertToHours(attData.attenDanceWorkingHrs))
                    if (!isNaN(inputGross) && !isNaN(hrs)) {
                        appDetail.perDayAttendanceAmount = myFunc.formatAmount(Math.round(inputGross * hrs));
                    } else {
                        appDetail.perDayAttendanceAmount = myFunc.formatAmount(0); // or you can set it to null or any default value
                    }

                    // totalEarnings += parseFloat(inputGross * (hrs));
                    if (!isNaN(inputGross) && !isNaN(hrs)) {
                        totalEarnings += Math.round(parseFloat(inputGross )* hrs)

                    }
                    totalIdleWages += attData.idleWageStatus === 'yes' ? inputGross * (hrs) : 0;

                    
                    totalIdleWagesPay += attData.idleWageStatus === 'yes' ? inputGross * (hrs) : 0;


                }
            });
            e.totalIdleWages = totalIdleWages

            const sqlOvertime = await db.query(`
                SELECT date,type,editOTday,workingHour
                FROM eve_acc_employee_overtime_approved
                WHERE status='A'
                AND employeeId=:employeeId
                       AND type = 'Approve'
                       
                       AND YEAR(date) = :year
                       AND MONTH(date) = :month
                       `, {
                replacements: {
                    employeeId: e.id,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            let overtimeMap = new Map();
            sqlOvertime.forEach((item) => {
                const dateKey = moment(item.date).format('YYYY-MM-DD');
                if (!overtimeMap.has(dateKey)) {
                    overtimeMap.set(dateKey, item)
                }
            });

            await Promise.all(e.appDetails.map(async (appDetail) => {
                const dateKey = moment(appDetail.crtDate).format('YYYY-MM-DD');
                if (overtimeMap.has(dateKey)) {
                    const otData = overtimeMap.get(dateKey);
                    let otHrsA = otData.editOTday != null && otData.editOTday != '' ? `${otData.editOTday}` : `${otData.workingHour}` || '--';

                    // let hrsApp = otHrs.split(':')

                    let otHrs=parseFloat(myFunc.convertToHours(otHrsA))
                  
                    

                    // let appHrs = hrsApp[0]
                    // let appMin = hrsApp[1]

                    // if (appMin > 30) {
                        // otHrs = (parseInt(appHrs) + 1)
                    // }
                    // else {
                        // otHrs = parseInt(appHrs)
                    // }

                    appDetail.OTtotalAmountDayWise = myFunc.formatAmount(Math.round(await myFunc.getWagesOtAmntByEmpIdDayWise(e.id, month, year, e.salaryTemplateId, otHrs, db)))

                    // let a = (await myFunc.getWagesOtAmntByEmpIdDayWise(e.id, month, year, e.salaryTemplateId, otHrs, db))
                    // totalEarnings += a

                    let result = await myFunc.getWagesOtAmntByEmpIdDayWise(e.id, month, year, e.salaryTemplateId, otHrs, db);
                    

                    let a = isNaN(result) ? 0 : Number(result); // fallback to 0 or handle 
                    // console.log(a);
                    
                    totalEarnings += Math.round(a)

                    appDetail.dayWiseOT = otData.editOTday != null && otData.editOTday != '' ? `${otData.editOTday} hr` : `${otData.workingHour} hr`;
                }
            }))

            const sqlVaribalePay = await db.query(
                `
                SELECT SUM(amount) as total FROM eve_blue_employee_variable_pay_amount
                WHERE empId = :empId
                AND status = 'A'
                AND year = :year
                AND month = :month

                `, {
                replacements: {
                    empId: e.id,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            e.variablePay = sqlVaribalePay[0]['total'] || 0
            totalVariablePay += parseFloat(e.variablePay) || 0


            const sqlDeduction = await db.query(
                `
                SELECT SUM(pfEmployeeCont) as pfEmployeeCont, SUM(esicEmployeeCont) as esicEmployeeCont, SUM(pTaxCont) as pTaxCont, SUM(lwfEmployeeCont) as lwfEmployeeCont FROM eve_blue_employee_deduction_master
                WHERE empId = :empId
                AND status = 'A'
                AND year = :year
                AND month = :month

                `, {
                replacements: {
                    empId: e.id,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            const deduction = sqlDeduction[0];

            const totalDeduction =
                (parseFloat(deduction.pfEmployeeCont) || 0) +
                (parseFloat(deduction.esicEmployeeCont) || 0) +
                (parseFloat(deduction.pTaxCont) || 0) +
                (parseFloat(deduction.lwfEmployeeCont) || 0);

            e.deductions = totalDeduction || 0
            totalDeductionsPay += parseFloat(e.deductions) || 0
            e.totalEarnings = totalEarnings + (e.variablePay)
            totalEarningsPay += parseFloat(e.totalEarnings) || 0

            const sqlPaySlip = await db.query(
                `
                    SELECT SUM(netPay) AS netpay 
                     FROM eve_blue_day_to_day_payouts_slip
                    WHERE employeeId = :empId
                    AND salaryOfMonth = :month
                    AND salaryOfYear = :year
                    AND status = 'A'
                    `, {
                replacements: {
                    empId: e.id,
                    month: month,
                    year: year
                },
                type: QueryTypes.SELECT
            })
            e.totalPayable = sqlPaySlip[0]['netpay'] || 0
            totalPayablePay += parseFloat(e.totalPayable) || 0

            const sqlStatus = await db.query(
                `
                    SELECT paymentStatus,isDayToDayGenerate
                     FROM eve_blue_day_to_day_payouts_slip
                    WHERE employeeId = :empId
                    AND salaryOfMonth = :month
                    AND salaryOfYear = :year
                    AND status = 'A'
                    AND isDayToDayGenerate = 'yes'
                    AND wagesType='dayTOday'
                    `, {
                replacements: {
                    empId: e.id,
                    month: month,
                    year: year
                },
                type: QueryTypes.SELECT
            })
            e.isDayToDayGenerate = sqlStatus.length > 0 ? sqlStatus[0]['isDayToDayGenerate'] : ''
            e.status = e.isDayToDayGenerate === 'yes' ? 'Payout Generated' : 'Payout Generation pending'
            e.paymentStatus = sqlStatus.length > 0 ? sqlStatus[0]['paymentStatus'] : 'Unpaid'
        }))
        const excelData = sqlData.map((e, i) => {
            return {
                'S.No': i + 1,
                'Worker Code': e.employeeCode,
                'Category': e.employeeType,
                'Type': e.type,
                'Worker Name': e.employeeName,
                'Sub Company': e.subCompany,
                'Branch': e.branch,
                'Location': e.location,
                'Department': e.department,
                'Sub Department': e.subDepartment,
                'Designation': e.designation,
                'Wage Template':e.templateName,
                'App': e.appDetails,
                'Variable Pay (₹)': myFunc.formatAmount(e.variablePay),
                'Total Earnings (₹)': myFunc.formatAmount((e.totalEarnings)),
                'Deductions': myFunc.formatAmount(e.deductions),
                'Total Idle Wages': myFunc.formatAmount(e.totalIdleWages),
                'Payment Status': e.paymentStatus,
                'Total Payable (₹)': myFunc.formatAmount(e.totalPayable),
                'Status': e.status
            }
        })

        res.status(200).json({
            status: true,
            result: "success",
            totalData: totalData,
            totalVariablePay: myFunc.formatAmount(totalVariablePay),
            totalEarnings: myFunc.formatAmount(totalEarningsPay),
            totalDeductions: myFunc.formatAmount(totalDeductionsPay),
            totalIdleWages: myFunc.formatAmount(totalIdleWagesPay),
            totalPayable: myFunc.formatAmount(totalPayablePay),
            // employee: sqlData,
            employee: excelData,
        });


    } catch (error) {

        return res.status(500).json({ status: false, msg: error.message, err: error.stack })

    }

}
async function fetchData({ token, year, month, userrole, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category }) {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-cross-auth': token
            },
            method: 'POST',
            url: `${process.env.BASE_URL}/wages/getPayoutGenerationExcel`,

            data: { token, year, month, userrole, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category }
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



    employee[0].App.forEach((e, i) => {
        midHeader.push(parseInt(moment(e.crtDate).format('DD')), '', '', '')
        subHeader.push('WH', 'OT', 'Amount', 'OTAmount')

        let startColumn = (appIndex + 1) + (i * 4)
        let endColumn = (startColumn + 3)
        let endRow = 1
        let startRow = 1
        mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
        // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
    })

    // console.log(mergeColumn);

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
                    row.push(z.attendaceWorkingHour, z.dayWiseOT, z.perDayAttendanceAmount, z.OTtotalAmountDayWise)
                })
            }
            else {
                row.push(x)
            }
        })


        values.push(row)

    });
    // Assuming 'header' is defined and contains the correct headers

    // Get indices for the required columns
    let variablePayIndex = header.indexOf('Variable Pay (₹)'); // Add 1 because ExcelJS uses 1-based index
    let totalEarningsIndex = header.indexOf('Total Earnings (₹)');
    let deductionsIndex = header.indexOf('Deductions');
    let totalIdleWagesIndex = header.indexOf('Total Idle Wages');
    let totalPayableIndex = header.indexOf('Total Payable (₹)');
    let totalIndex = header.indexOf('S.No');



    // Prepare data row with appropriate length
    let len = header.length;
    let row = new Array(len).fill('');

    // Assign data values to their respective indices
    row[variablePayIndex] = data['totalVariablePay']; // Use 0-based for array
    row[totalEarningsIndex] = data['totalEarnings'];
    row[deductionsIndex] = data['totalDeductions'];
    row[totalIdleWagesIndex] = data['totalIdleWages'];
    row[totalPayableIndex] = data['totalPayable'];
    row[totalIndex] = 'TOTAL :'


    // Push the row into values array
    values.push(row);

    // Add the values to the worksheet
    worksheet.addRows(values);

    // Merge cells as required
    mergeColumn.forEach((e) => {
        worksheet.mergeCells(e);
    });

    // // Setting cell values using calculated indices
    // worksheet.getCell(2, totalWorkIndex).value = '';
    // worksheet.getCell(2, totalActualIndex).value = '';
    // worksheet.getCell(2, totalPresent).value = '';
    // worksheet.getCell(2, totalHalfDay).value = '';
    // worksheet.getCell(2, totalAbsent).value = '';
    // worksheet.getCell(2, totalPaidLeave).value = '';
    // worksheet.getCell(2, totalUnpaidLeave).value = '';
    // worksheet.getCell(2, status).value = '';


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
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });
    headerRow2.eachCell(cell => {
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    worksheet.columns.forEach(column => {
        column.width = 25;
    });


    const lastRow = worksheet.lastRow;
    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });


    return workbook.xlsx
}

async function getPayoutGenerationExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let year = (req.body.year || req.query.year)
        let month = (req.body.month || req.query.month)
        let limit = (req.body.limit || req.query.limit)
        let pageNo = (req.body.pageNo || req.query.pageNo)
        let empCode = (req.body.empCode || req.query.empCode)
        let empName = (req.body.empName || req.query.empName)
        let branchId = (req.body.branchId || req.query.branchId)
        let deptId = (req.body.deptId || req.query.deptId)
        let designId = (req.body.designId || req.query.designId)
        let subCompanyId = (req.body.subCompanyId || req.query.subCompanyId)
        let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
        let location = (req.body.location || req.query.location)
        let userrole = (req.body.userrole || req.query.userrole)
        let empType = (req.body.empType || req.query.empType)
        let category = (req.body.category || req.query.category)

        let apiData = await fetchData({ token, year, userrole, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category })
        // if (apiData.employee.length == 0) {
        //     return res.status(400).send({ status: false, msg: 'no data found' })
        // }


        let getExcel = createExcelFile(apiData)


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Payout Generation.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { getPayoutGenerationExcel, getPayoutGenerationExcelSheet }