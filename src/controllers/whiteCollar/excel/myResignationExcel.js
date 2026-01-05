let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getMyResignationExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '389'
        // let db = sequelize('59');
        let data = req.body;
        let {} = data
        const countQuery = await db.query(
            `
            SELECT COUNT(*) AS total 
            FROM eve_employee_resignation_list AS a

            WHERE a.status='A'
            AND empId=:empId
          
             
           
            `, {
            replacements: {
                empId: tokenUserId,
             

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

            (@row_number:=@row_number + 1) AS 'slno',
            DATE_FORMAT(a.submitDate,'%d-%m-%Y') AS appliedDate,
            DATE_FORMAT(a.resignationDate,'%d-%m-%Y') AS resignationDate,
            DATE_FORMAT(a.approvalDate,'%d-%m-%Y') AS approvalDate,
            CONCAT(a.noticePeriod, ' Days') AS noticePeriodWithAddedDays,
           
        
            a.createdBy,
            a.remarks,

                            CASE
            WHEN a.resignStatus='A' THEN 'Approved'
            WHEN a.resignStatus='C' THEN 'Rejected'
            WHEN a.resignStatus='W' THEN 'Pending'
            ELSE a.resignStatus END AS approvalStatus,
            r1Id,
            r1Status,
            r2Id,
            r2Status,
            r3Id,
            r3Status

             FROM eve_employee_resignation_list AS a
              CROSS JOIN (SELECT @row_number := :offset) AS init

            WHERE a.status='A'
            AND a.empId=:empId
         
              
            LIMIT   :limit
            OFFSET :offset
            `,
            {
                replacements: {
                    offset: offset,
                    limit: limit,
                    empId: tokenUserId,
                 
                 
                },
                type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async e=>{
             e.actionBy=await myFunc.getEmployeeNameById(e.createdBy,db)
             e.r1=`${await myFunc.getEmployeeNameById(e.r1Id,db)} - ${e.r1Status}`
             e.r2=`${await myFunc.getEmployeeNameById(e.r2Id,db)} - ${e.r2Status}`
             e.r3=`${await myFunc.getEmployeeNameById(e.r3Id,db)} - ${e.r3Status}`
            
        }))
        const myResignationExcel=getData.map(e=>({
            'Sl. No.':e.slno,
            'Applied Date':e.appliedDate,
            'Resignation Date':e.resignationDate,
            'Notice Period':e.noticePeriodWithAddedDays,
            'Approval Date':e.approvalDate,
            'R1':e.r1,
            'R2':e.r2,
            'R3':e.r3,
            'Remarks':e.remarks,
            'Approval Status':e.approvalStatus

        }))
       
     

        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
         
            employee: getData,
            employee: myFunc.replaceEmptyValues(myResignationExcel)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyResignationExcel`,

            data: { token, pageNo, limit }

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



async function getMyResignationExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        
     

        let apiData = await fetchData({ token, pageNo, limit})

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Resignation.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMyResignationExcel, getMyResignationExcelSheet }