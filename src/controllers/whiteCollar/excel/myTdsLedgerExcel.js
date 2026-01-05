let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getMyTdsLedgerExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '29'
        // let db = sequelize('59');
        let data = req.body;
        let { amount, fromDate, toDate, salaryOfMonth, salaryOfYear } = data
        const countQuery = await db.query(
            `
            SELECT COUNT(*) AS total 
            FROM eve_acc_employee_monthly_salary_payroll AS a

              LEFT JOIN (
                SELECT 
                    b.amount, 
                    a.payrollId
                FROM eve_acc_employee_monthly_salary_payroll_details AS a
                RIGHT JOIN eve_acc_company_salary_structure_new AS b
                ON a.salaryStructureId = b.id
                WHERE a.status = 'A'
            ) AS b ON a.id = b.payrollId 
          
            WHERE a.status='A'
            AND a.employeeId=:employeeId
         
          AND (:fromDate IS NULL OR date(a.createdDateTime) >= :fromDate)
            AND (:toDate IS NULL OR date(a.createdDateTime) <= :toDate)
           
             AND (:salaryOfMonth IS NULL OR a.salaryOfMonth=:salaryOfMonth)  
                AND (:salaryOfYear IS NULL OR a.salaryOfYear=:salaryOfYear)  
                   AND (:amount IS NULL OR b.amount = :amount) 
             
           
            `, {
            replacements: {
                employeeId: tokenUserId,
                amount: amount || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
                salaryOfMonth: salaryOfMonth || null,
                salaryOfYear: salaryOfYear || null,


            }, type: QueryTypes.SELECT
        })
        const totalData = countQuery[0]['total']
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
            SELECT 
                a.id,
                a.employeeId,
                a.salaryOfYear,
                a.salaryOfMonth,
                DATE_FORMAT(a.createdDateTime, '%d-%m-%Y') AS date,
                b.amount,
                CASE a.salaryOfMonth
                    WHEN 1 THEN 'January'
                    WHEN 2 THEN 'February'
                    WHEN 3 THEN 'March'
                    WHEN 4 THEN 'April'
                    WHEN 5 THEN 'May'
                    WHEN 6 THEN 'June'
                    WHEN 7 THEN 'July'
                    WHEN 8 THEN 'August'
                    WHEN 9 THEN 'September'
                    WHEN 10 THEN 'October'
                    WHEN 11 THEN 'November'
                    WHEN 12 THEN 'December'
                    ELSE 'Invalid Month'
                END AS month,

                CONVERT(a.salaryOfYear, CHAR) AS year,

                IFNULL(b.amount, 0) AS amount

            FROM eve_acc_employee_monthly_salary_payroll AS a

            LEFT JOIN (
                SELECT 
                    b.amount, 
                    a.payrollId
                FROM eve_acc_employee_monthly_salary_payroll_details AS a
                RIGHT JOIN eve_acc_company_salary_structure_new AS b
                ON a.salaryStructureId = b.id
                WHERE a.status = 'A'
            ) AS b ON a.id = b.payrollId 

            WHERE a.status = 'A'
            AND a.employeeId = :employeeId

             AND (:fromDate IS NULL OR date(a.createdDateTime) >= :fromDate)
            AND (:toDate IS NULL OR date(a.createdDateTime) <= :toDate)

            AND (:salaryOfMonth IS NULL OR a.salaryOfMonth = :salaryOfMonth)
            AND (:salaryOfYear IS NULL OR a.salaryOfYear = :salaryOfYear)

            AND (:amount IS NULL OR b.amount = :amount)
            LIMIT :limit
            OFFSET :offset
            `,
            {
                replacements: {
                    offset: offset,
                    limit: limit,
                    employeeId: tokenUserId,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                    salaryOfMonth: salaryOfMonth || null,
                    salaryOfYear: salaryOfYear || null,
                    amount: amount || null, 
                },
                type: QueryTypes.SELECT
            }
        );
        let totalAmount=0
        await Promise.all(getData.map(async e => {

            e.employeeName = await myFunc.getEmployeeNameById(e.employeeId, db)
            e.employeeCode = await myFunc.getEmpCodeFromEmpId(e.employeeId, db)
            e.employeeMobile = await myFunc.getEmpMobNoByEmpId(e.employeeId, db)
            e.employeeEmail = await myFunc.getEmpEmailByEmpId(e.employeeId, db)
            totalAmount+=parseFloat(e.amount)




            // e.amount = ''
            // const payrollModel = await db.query(
            //     `
            //                       SELECT 
            //                       b.amount 
            //                       FROM eve_acc_employee_monthly_salary_payroll_details AS a
            //                       RIGHT JOIN eve_acc_company_salary_structure_new AS b
            //                       ON  a.salaryStructureId=b.id
            //                       WHERE a.status='A'
            //                       AND a.payrollId=:payrollId 
            //         `, {
            //     replacements: {
            //         payrollId: e.id

            //     }, type: QueryTypes.SELECT
            // })
            // if (payrollModel.length > 0) {
            //     e.amount = payrollModel[0]['amount']
            // }
        }))




        const myTdsLedgerExcel = getData.map((e, i) => ({
            'Sl. No.': i + 1,
            'Date': e.date,
            'Month': e.month,
            'Year': e.year,
            'Employee Name': e.employeeName,
            'Employee Code': e.employeeCode,
            'Employee Mobile': e.employeeMobile,
            'Employee Email': e.employeeEmail,
            'Amount (₹)': `₹${myFunc.formatAmount(e.amount)}`,
        }))

        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            totalAmount:`₹${myFunc.formatAmount(totalAmount)}`,
            // employee: getData,
            employee: myFunc.replaceEmptyValues(myTdsLedgerExcel)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, amount, fromDate, toDate, salaryOfMonth, salaryOfYear }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyTdsLedgerExcel`,

            data: { token, pageNo, limit, amount, fromDate, toDate, salaryOfMonth, salaryOfYear }

        }
        const response = await axios(config)
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function createExcelFile(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = []
    let employee = data.employee
    let header = Object.keys(employee[0])

    values.push(header)
    employee.forEach(e => {
        let value = Object.values(e)

        values.push(value)
    });
    let a = header.indexOf('Amount (₹)')
    let b = header.indexOf('Employee Email')
   
    let len = header.length
    let row = new Array(len).fill('')

    row[a] = data['totalAmount']
    
    row[b] = 'Total Amount :'
    values.push(row)
    worksheet.addRows(values)
    const headerRow = worksheet.getRow(1);


    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            row.height = 25

        });
    });
    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    worksheet.columns.forEach(column => {
        column.width = 20;
    });


 //totalAmount Bold 
 const lastRow = worksheet.lastRow;

 lastRow.eachCell((cell, colNumber) => {
     cell.font = { bold: true };
 });
    return workbook.xlsx

}



async function getMyTdsLedgerExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let amount = req.body.amount || req.query.amount
        let fromDate = req.body.fromDate || req.query.fromDate
        let toDate = req.body.toDate || req.query.toDate
        let salaryOfMonth = req.body.salaryOfMonth || req.query.salaryOfMonth
        let salaryOfYear = req.body.salaryOfYear || req.query.salaryOfYear

        let apiData = await fetchData({ token, pageNo, limit, amount, fromDate, toDate, salaryOfMonth, salaryOfYear })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Tds .xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMyTdsLedgerExcel, getMyTdsLedgerExcelSheet }