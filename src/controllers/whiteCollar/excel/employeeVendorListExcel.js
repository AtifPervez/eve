let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getEmployeeVendorListExcel = async (req, res) => {
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

        const { companyName,companyMobile,companyEmail,contactPersonName,contactPersonMobile,contactPersonEmail,subCompanyId,branchName,formDate,toDate } = data

        const countQuery = await db.query(
            `
                                        SELECT COUNT(*) AS total
                                        FROM eve_hrm_manage_employee_vendor
                                        WHERE status='A'    
                                        AND (:companyName IS NULL OR companyName=:companyName)
                                        AND (:companyMobile IS NULL OR companyMobile=:companyMobile)
                                        AND (:companyEmail IS NULL OR companyEmail=:companyEmail)
                                        AND (:contactPersonName IS NULL OR contactPersonName=:contactPersonName)
                                        AND (:contactPersonMobile IS NULL OR contactPersonMobile=:contactPersonMobile)
                                        AND (:contactPersonEmail IS NULL OR contactPersonEmail=:contactPersonEmail)
                                        AND (:subCompanyId IS NULL OR subcompany=:subCompanyId)
                                        AND (:branchName IS NULL OR createdByBranch=:branchName)
                                           AND (:formDate is NULL OR date(createdDate) >= :formDate)
                                          AND (:toDate is NULL OR date(createdDate) <= :toDate)
            `, {
            replacements: {

                companyName:companyName||null,
                companyMobile:companyMobile||null,
                companyEmail:companyEmail||null,
                contactPersonName:contactPersonName||null,
                contactPersonMobile:contactPersonMobile||null,
                contactPersonEmail:contactPersonEmail||null,
                subCompanyId:subCompanyId||null,
                branchName:branchName||null,
                formDate:formDate||null,
                toDate:toDate||null,

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
        let getData = await db.query(
            `
                                   SELECT
                                   (@row_number:=@row_number + 1) AS 'slno',
                                   DATE_FORMAT(createdDate,'%d-%m-%Y') AS date,
                                   subcompany,
                                   createdByBranch,
                                   companyName,
                                   companyMobile,
                                   companyEmail,
                                   contactPersonName,
                                   contactPersonMobile,
                                   contactPersonEmail
                                   FROM eve_hrm_manage_employee_vendor
                                   CROSS JOIN (SELECT @row_number := :offset) AS init
                                   WHERE status='A'
                                   AND (:companyName IS NULL OR companyName=:companyName)
                                   AND (:companyMobile IS NULL OR companyMobile=:companyMobile)
                                   AND (:companyEmail IS NULL OR companyEmail=:companyEmail)
                                   AND (:contactPersonName IS NULL OR contactPersonName=:contactPersonName)
                                   AND (:contactPersonMobile IS NULL OR contactPersonMobile=:contactPersonMobile)
                                     AND (:contactPersonEmail IS NULL OR contactPersonEmail=:contactPersonEmail)
                                      AND (:subCompanyId IS NULL OR subcompany=:subCompanyId)
                                        AND (:branchName IS NULL OR createdByBranch=:branchName)
                                             AND (:formDate is NULL OR date(createdDate) >= :formDate)
                                          AND (:toDate is NULL OR date(createdDate) <= :toDate)

                                   ORDER BY createdDate DESC
                                   LIMIT   :limit
                                   OFFSET :offset
            `, {
            replacements: {

                offset: offset,
                limit: limit,
                companyName:companyName||null,
                companyMobile:companyMobile||null,
                companyEmail:companyEmail||null,
                contactPersonName:contactPersonName||null,
                contactPersonMobile:contactPersonMobile||null,
                contactPersonEmail:contactPersonEmail||null,
                subCompanyId:subCompanyId||null,
                branchName:branchName||null,
                formDate:formDate||null,
                toDate:toDate||null,

            }, type: QueryTypes.SELECT
        }
        )
        await Promise.all(getData.map(async e => {
            e.subcompanyName = await myFunc.getSubCompanyNameById(e.subcompany, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.createdByBranch, db)

        }))
        const excelData = getData.map(e => ({
                        'Sl. No.':e.slno,
                        'Created Date':e.date,
                        'Sub Company':e.subcompanyName,
                        'Branch':e.branchName,
                        'Company Name':e.companyName,
                        'Company Mobile':e.companyMobile,
                        'Company Email':e.companyEmail,
                        'Contact Person':e.contactPersonName,
                        'Contact Mobile':e.contactPersonMobile,
                        'Contact Email':e.contactPersonEmail
        }))

        return res.status(200).send({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)

        })


    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, companyName,companyMobile,companyEmail,contactPersonName,contactPersonMobile,contactPersonEmail,subCompanyId,branchName,formDate,toDate }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getEmployeeVendorListExcel`,

            data: { token, pageNo, limit, companyName,companyMobile,companyEmail,contactPersonName,contactPersonMobile,contactPersonEmail,subCompanyId,branchName,formDate,toDate }

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

   


    return workbook.xlsx

}



async function getEmployeeVendorListExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let data = { ...req.query, ...req.body };
        let{pageNo,limit,companyName,companyMobile,companyEmail,contactPersonName,contactPersonMobile,contactPersonEmail,subCompanyId,branchName,formDate,toDate}=data
    
        let apiData = await fetchData({ token, pageNo, limit, companyName,companyMobile,companyEmail,contactPersonName,contactPersonMobile,contactPersonEmail,subCompanyId,branchName,formDate,toDate })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Employee Vendor List.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getEmployeeVendorListExcel,getEmployeeVendorListExcelSheet }