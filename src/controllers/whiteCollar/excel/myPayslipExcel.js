let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const serialize = require('php-serialize')
const moment = require('moment');

const getMyPayslipExcel = async (req, res) => {
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
        let { year, months, status } = data

        if (!year) return res.status(200).json({ status: false, msg: 'year is required' })

        const getSalaryData = (year) => {
            const currentYear = new Date().getFullYear();


            const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-based index
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            let limit = year == currentYear ? currentMonth : 12;
            return months.slice(0, limit).reverse().map(month => ({
                "Year": year.toString(),
                "Month": month,
                "Salary Amount (₹)": "",
                "Status": "Not Generated"
            }));
        };

        const PayslipModel = await db.query(
            `
                SELECT 
                    salaryOfYear,
                    salaryOfMonth,
                    salary_types
                FROM eve_acc_employee_payslip_preview
                WHERE status='A'
                AND employeeId=:employeeId
                AND salaryOfYear=:year
                AND isGenerated='yes'
                `, {
            replacements: {
                employeeId: tokenUserId,
                year: year,
            },
            type: QueryTypes.SELECT
        });


        const salaryData = getSalaryData(year);
        let totalAmount = 0;

        for (const e of salaryData) {
            for (const payslip of PayslipModel) {
                if (e.Month === moment(payslip.salaryOfMonth, 'MM').format('MMMM')) {
                    e["Salary Amount (₹)"] = myFunc.formatAmount(serialize.unserialize(payslip.salary_types).netPay);
                    totalAmount += serialize.unserialize(payslip.salary_types).netPay;
                    e.Status = "Generated";
                }
            }
        }


        return res.status(200).json({
            status: true,
            totalAmount: `₹ ${myFunc.formatAmount(totalAmount)}`,
            employee: myFunc.replaceEmptyValues(salaryData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, year, months, status }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyPayslipExcel`,

            data: { token, pageNo, limit, year, months, status }

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
    let salaryAmountIndex = header.indexOf('Salary Amount (₹)')
    let len = header.length;
    let row = new Array(len).fill('');
    row[salaryAmountIndex] = data.totalAmount
    row[header.indexOf('Month')] = 'Total Amount'
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
            row.height = 30

        });
    });
    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    worksheet.columns.forEach(column => {
        column.width = 20;
    });

    const lastRow = worksheet.lastRow;
    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });



    return workbook.xlsx



}

async function getMyPayslipExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let year = req.body.year || req.query.year
        let months = req.body.months || req.query.months
        let status = req.body.status || req.query.status

        let apiData = await fetchData({
            token, pageNo, limit, year, months, status
        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Payslip .xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMyPayslipExcel, getMyPayslipExcelSheet }