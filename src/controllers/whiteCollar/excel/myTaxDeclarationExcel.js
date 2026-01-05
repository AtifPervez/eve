let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getMyTaxDeclarationExcel = async (req, res) => {
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
        let { year } = data
        const countQuery = await db.query(
            `
            SELECT COUNT(*) AS total 
            FROM eve_accounts_tax_declaration_emp AS a

            WHERE a.status='A'
            AND empId=:empId
            AND REPLACE(a.assessmentYear, ' ', '') = :assessmentYear
             
           
            `, {
            replacements: {
                empId: tokenUserId,
                assessmentYear: year,
              

            }, type: QueryTypes.SELECT
        })
        const totalData = countQuery[0]['total']
        if (totalData === 0) {
            return res.status(200).json({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }
        let limit = parseInt(req.body.limit) || 1;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        let getData = await db.query(
            `
            SELECT

            (@row_number:=@row_number + 1) AS 'Sl. No.',
            assessmentYear AS 'Assessment Year',
            DATE_FORMAT(submitDate,'%d-%m%-%Y') AS 'Date of submission'

            FROM eve_accounts_tax_declaration_emp AS a
              CROSS JOIN (SELECT @row_number := :offset) AS init

            WHERE a.status='A'
            AND empId=:empId
            AND REPLACE(a.assessmentYear, ' ', '') = :assessmentYear
             ORDER BY id DESC 
              
            LIMIT   :limit
            OFFSET :offset
            `,
            {
                replacements: {
                    offset: offset,
                    limit: limit,
                    empId: tokenUserId,
                    assessmentYear: year,
                 
                },
                type: QueryTypes.SELECT
            }
        );
       
     

        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // totalAmount:`₹${myFunc.formatAmount(totalAmount)}`,
            // employee: getData,
            employee: myFunc.replaceEmptyValues(getData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, year }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyTaxDeclarationExcel`,

            data: { token, pageNo, limit, year }

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



    return workbook.xlsx

}



async function getMyTaxDeclarationExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let year = req.body.year || req.query.year
     

        let apiData = await fetchData({ token, pageNo, limit, year })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Tax Declaration.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMyTaxDeclarationExcel, getMyTaxDeclarationExcelSheet }