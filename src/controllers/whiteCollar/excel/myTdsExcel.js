let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getMyTdsExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '29'
        // let db = sequelize('59')
        let data = req.body;
        let { finYear, amount, date, month } = data

        let finYearStart = finYear
        let finYearEnd = parseInt(finYear) + 1
        finYearStart = `${finYearStart}-04`
        finYearEnd = `${finYearEnd}-03`

        const countQuery = await db.query(
            `
            SELECT COUNT(*) AS total 
            FROM eve_acc_employee_tds_amount AS a
            WHERE a.status='A'
            AND empId=:empId
            AND CONCAT(year,'-',month) >= :finYearStart
            AND CONCAT(year,'-',month) <= :finYearEnd

             and (:amount is null or amount=:amount)
            and (:date is null or createdDate=:date) 
                and (:month is null or DATE_FORMAT(createdDate, '%m') =:month) 
          
            `, {
            replacements: {
                empId: tokenUserId,
                finYearStart: finYearStart,
                finYearEnd: finYearEnd,
                amount: amount || null,
                date: date || null,
                month: month || null,


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
            (@row_number:=@row_number + 1) AS 'Sl. No.',
             DATE_FORMAT(createdDate,'%d-%m-%Y') AS 'Date',
     
               CASE month
    WHEN '01' THEN 'January'
    WHEN '02' THEN 'February'
    WHEN '03' THEN 'March'
    WHEN '04' THEN 'April'
    WHEN '05' THEN 'May'
    WHEN '06' THEN 'June'
    WHEN '07' THEN 'July'
    WHEN '08' THEN 'August'
    WHEN '09' THEN 'September'
    WHEN '10' THEN 'October'
    WHEN '11' THEN 'November'
    WHEN '12' THEN 'December'
  END AS Month,
           
           
          
            YEAR(createdDate) AS 'Year',
            amount AS 'Amount (₹)'

            FROM eve_acc_employee_tds_amount 
            CROSS JOIN (SELECT @row_number := :offset) AS init

            WHERE status='A'
            AND empId=:empId
            AND CONCAT(year,'-',month) >= :finYearStart
            AND CONCAT(year,'-',month) <= :finYearEnd

             and (:amount is null or amount=:amount)
            and (:date is null or createdDate=:date) 
                and (:month is null or DATE_FORMAT(createdDate, '%m') =:month) 
           
          
              
            LIMIT   :limit
            OFFSET :offset
            `,
            {
                replacements: {
                    offset: offset,
                    limit: limit,
                    empId: tokenUserId,
                    finYearStart: finYearStart,
                    finYearEnd: finYearEnd,
                    amount: amount || null,
                    date: date || null,
                    month: month || null,


                },
                type: QueryTypes.SELECT
            }
        )
        let totalAmount = 0
        await Promise.all(getData.map(async e => {
            totalAmount += parseFloat(e['Amount (₹)'])
            e['Amount (₹)'] = myFunc.formatAmount(e['Amount (₹)'])
        }))
        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            totalAmount: `₹${myFunc.formatAmount(totalAmount)}`,
            // employee: myFunc.replaceEmptyValues(getData)
            employee: getData
        })


    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, finYear, amount, date, month }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyTdsExcel`,

            data: { token, pageNo, limit, finYear, amount, date, month }

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

    let a = header.indexOf('Year')
    let b = header.indexOf('Amount (₹)')


    let len = header.length
    let row = new Array(len).fill('')

    row[a] = 'Total Amount :'
    row[b] = data['totalAmount']

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
            row.height = 20

        });
    });
    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    worksheet.columns.forEach(column => {
        column.width = 25;
    });

    //totalAmount Bold 
    const lastRow = worksheet.lastRow;

    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });


    return workbook.xlsx

}



async function getMyTdsExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let finYear = req.body.finYear || req.query.finYear
        let amount = req.body.amount || req.query.amount
        let date = req.body.date || req.query.date
        let month = req.body.month || req.query.month



        let apiData = await fetchData({ token, pageNo, limit, finYear, amount, date, month })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My tds.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMyTdsExcel, getMyTdsExcelSheet }