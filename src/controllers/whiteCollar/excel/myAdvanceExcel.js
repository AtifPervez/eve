let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')
const getMyAdvanceExcel = async (req, res) => {
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
        let { amount, description, status, formDate, toDate } = data
        const countQuery = await db.query(
            `
                              SELECT COUNT(*) AS total FROM eve_acc_employee_advance
                              WHERE status='A'    
                               AND employeeId=:employeeId  
                               
                                  AND (:amount IS NULL OR amount=:amount)
                                  AND (:description IS NULL OR description=:description)
                                     AND (:status IS NULL OR advanceStatus=:status)
                                        AND (:formDate IS NULL OR applyDate >= :formDate)
                                      AND (:toDate IS NULL OR applyDate <= :toDate)

            
            `, {
            replacements: {
                employeeId: tokenUserId,
                amount: amount || null,
                description: description || null,
                status: status || null,
                formDate: formDate || null,
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
        let getData = await db.query(
            `
                                 SELECT
                                 (@row_number:=@row_number + 1) AS 'slno',
                                 employeeId,

                                 FORMAT(amount,2) AS amount,

                                 modeOfPayment,
                                 description,
                                 

                                 DATE_FORMAT(applyDate, '%d-%m-%Y') AS formattedApplyDate,
                               

                                 appriserId,
                                 isAppriserAccepted,
                                 reviewerId,
                                 isReviewerAccepted,
                                 managerId,
                                 isManagerAccepted,
                                 advanceStatus,

                                   CASE 
             WHEN  modeOfPayment = 'monthly' THEN 'Adjust With Monthly Salary'
             ELSE  modeOfPayment
             END AS modeOfPayment,
          

                                         CASE
                         WHEN advanceStatus='Waiting' THEN 'Pending'                
                               ELSE advanceStatus END AS advanceStatus

                                  FROM eve_acc_employee_advance
                                    CROSS JOIN (SELECT @row_number := :offset) AS init
                                 WHERE status='A'
                                 AND employeeId=:employeeId

                                 AND (:amount IS NULL OR amount=:amount)
                                 AND (:description IS NULL OR description=:description)
                                 AND (:status IS NULL OR advanceStatus=:status)

                                    AND (:formDate IS NULL OR applyDate >= :formDate)
                                      AND (:toDate IS NULL OR applyDate <= :toDate)

                                 ORDER BY applyDate DESC  

                                 LIMIT :limit
                                 OFFSET :offset
                                 
                                 `, {
            replacements: {
                offset: offset,
                limit: limit,
                employeeId: tokenUserId,
                amount: amount || null,
                description: description || null,
                status: status || null,
                formDate: formDate || null,
                toDate: toDate || null,

            }, type: QueryTypes.SELECT
        }
        )
        await Promise.all(getData.map(async e => {

            e.r1Name = await myFunc.getEmployeeNameById(e.appriserId, db)
            e.r2Name = await myFunc.getEmployeeNameById(e.reviewerId, db)
            e.r3Name = await myFunc.getEmployeeNameById(e.managerId, db)

            if (e.appriserId === '' || e.appriserId === null) {
                e.r1Status = 'rejected'
            }
            else if (e.isAppriserAccepted === 'yes') {
                e.r1Status = 'Approved'
            }
            else if (e.isAppriserAccepted === 'no') {
                e.r1Status = 'Pending'
            }


            if (e.reviewerId === '' || e.reviewerId === null) {
                e.r2Status = 'rejected'
            }
            else if (e.isReviewerAccepted === 'yes') {
                e.r2Status = 'Approved'
            }
            else if (e.isReviewerAccepted === 'no') {
                e.r2Status = 'Pending'
            }
            if (e.managerId === '' || e.managerId === null) {
                e.r3Status = 'rejected'
            }
            else if (e.isManagerAccepted === 'yes') {
                e.r3Status = 'Approved'
            }
            else if (e.isManagerAccepted === 'no') {
                e.r3Status = 'Pending'
            }
            e.r1 = `${e.r1Name} - ${e.r1Status}`
            e.r2 = `${e.r2Name} - ${e.r2Status}`
            e.r3 = `${e.r3Name} - ${e.r3Status}`

            if (e.appriserId === '' || e.appriserId === null) {
                e.r1 = 'N/A'
            }
            if (e.reviewerId === '' || e.reviewerId === null) {
                e.r2 = 'N/A'
            }
            if (e.managerId === '' || e.managerId === null) {
                e.r3 = 'N/A'
            }


        }))
        const myAdvanceExcel = getData.map(e => ({
            'Sl. No.': e.slno,
            'Date': e.formattedApplyDate,
            'Amount (₹)': e.amount,
            'Description': e.description,
            'Mode of Payment': e.modeOfPayment,
            'R1': e.r1,
            'R2': e.r2,
            'R3': e.r3,
            'Status': e.advanceStatus,

        }))
        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData,
            employee: myFunc.replaceEmptyValues(myAdvanceExcel)
        })


    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack });
    }
}

async function fetchData({ token, pageNo, limit, amount, description, status, formDate, toDate }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyAdvanceExcel`,

            data: { token, pageNo, limit, amount, description, status, formDate, toDate }
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

async function getMyAdvanceExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let status = req.body.status || req.query.status
        let amount = req.body.amount || req.query.amount
        let description = req.body.description || req.query.description
        let formDate = req.body.formDate || req.query.formDate
        let toDate = req.body.toDate || req.query.toDate


        let apiData = await fetchData({ token, pageNo, limit, amount, description, status, formDate, toDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="MyAdvance.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyAdvanceExcel, getMyAdvanceExcelSheet }