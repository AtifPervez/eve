let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')
const getMyRoasterListExcel = async (req, res) => {
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
        let { shiftId, fromDate, toDate } = data
        const countQuery = await db.query(
            `
                         SELECT COUNT(*) AS total
                         FROM eve_hrm_employee_roaster
                         WHERE status='A'   
                         AND employeeId=:employeeId 
                         AND (:shiftId IS NULL OR shiftId=:shiftId)
                         AND (:fromDate is NULL OR fromDate >=STR_TO_DATE(:fromDate,'%d-%m-%Y'))
                         AND (:toDate is NULL OR toDate<=STR_TO_DATE(:toDate,'%d-%m-%Y'))
                
                `, {
            replacements: {
                employeeId: tokenUserId,
                shiftId: shiftId || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        let getData = await db.query(`

                            SELECT   
                            (@row_number:=@row_number + 1) AS 'slno',
                            employeeId,
                            shiftId,
                            DATE_FORMAT(fromDate,'%d-%m-%Y') AS frmtFromDate,
                            DATE_FORMAT(toDate,'%d-%m-%Y') AS frmtToDate 
                            FROM eve_hrm_employee_roaster
                            CROSS JOIN (SELECT @row_number := :offset) AS init
                            WHERE status='A'     
                            AND employeeId=:employeeId
                            AND (:shiftId IS NULL OR shiftId=:shiftId)
                            AND (:fromDate is NULL OR fromDate >=STR_TO_DATE(:fromDate,'%d-%m-%Y'))
                            AND (:toDate is NULL OR toDate<=STR_TO_DATE(:toDate,'%d-%m-%Y'))
                            ORDER BY fromDate DESC
                            LIMIT :limit
                            OFFSET :offset

                `, {
            replacements: {
                offset: offset,
                limit: limit,
                employeeId: tokenUserId,
                shiftId: shiftId || null,
                fromDate: fromDate || null,
                toDate: toDate || null,

            }, type: QueryTypes.SELECT
        }
        )
        await Promise.all(getData.map(async e => {
            e.shiftName = await myFunc.getShiftNameById(e.shiftId, db)
            e.employeeName = await myFunc.getEmployeeNameById(e.employeeId, db)
        }))
        const myRoasterExcel = getData.map(e => ({
            'Sl.No.': e.slno,
            'From Date': e.frmtFromDate,
            'To Date': e.frmtToDate,
            'Shift Name': e.shiftName,
            'Employee Name': e.employeeName,
        }))
        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData,
            employee: myFunc.replaceEmptyValues(myRoasterExcel)
        })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}

async function fetchData({ token,shiftId, fromDate, toDate }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyRoasterListExcel`,
           
            data: { token,shiftId, fromDate, toDate }
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


   


    return workbook.xlsx
}

async function getMyRoasterListExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let shiftId = req.body.shiftId || req.query.shiftId
        let fromDate = req.body.fromDate || req.query.fromDate
        let toDate = req.body.toDate || req.query.toDate
        let apiData = await fetchData({ token,shiftId, fromDate, toDate})
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Roaster.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })
    }
}

module.exports = { getMyRoasterListExcel,getMyRoasterListExcelSheet }