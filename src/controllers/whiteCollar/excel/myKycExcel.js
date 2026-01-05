let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')

//phpCode [eve/hr/model/hr-model-employee-upload-document.php]
//header [https://www.eveserver.ind.in/eve/mode/employee-upload-document-model/getMyKYCDetails]
//DB [hrm_employee_document_upload_details]
const getMykycExcel = async (req, res) => {
    try {
        // const tokenUserId = '29'
        // let db = sequelize('59')
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)

        let data = req.body
        let { fromDate, toDate, name, referanceNumber } = data

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total

            FROM eve_hrm_employee_document_upload_details AS doc
            LEFT JOIN eve_acc_employee as emp on emp.id=doc.employeeId 
            WHERE doc.status="A"
            AND doc.employeeId=:tokenUserId

              AND  (:fromDate IS NULL OR DATE_FORMAT(doc.createdDate,'%d-%m-%Y')>=:fromDate)
                AND  (:toDate IS NULL OR (DATE_FORMAT(doc.createdDate,'%d-%m-%Y')<=:toDate))

                  AND (:name IS NULL OR  doc.documentName=:name)
           
`, {
            replacements: {
                tokenUserId: tokenUserId,
                fromDate: fromDate || null,
                toDate: toDate || null,
                name: name || null,


            },



            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

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
            doc.id,
            doc.employeeId,
            doc.documentName AS documentId,
            doc.referanceNumber,
            doc.currentStatus,
            doc.imgPreview,
            doc.createdByBranch,
            
            DATE_FORMAT(doc.createdDate,'%d-%m-%Y') AS createdDate,

            emp.employeeName,
            emp.employeeEmail,
            emp.employeeMobile,
            emp.employeeCode 

            FROM eve_hrm_employee_document_upload_details AS doc
            LEFT JOIN eve_acc_employee as emp on emp.id=doc.employeeId 
            WHERE doc.status="A"
            AND doc.employeeId=:tokenUserId

          AND  (:fromDate IS NULL OR DATE_FORMAT(doc.createdDate,'%d-%m-%Y')>=:fromDate)
                AND  (:toDate IS NULL OR (DATE_FORMAT(doc.createdDate,'%d-%m-%Y')<=:toDate))

             AND (:name IS NULL OR  doc.documentName=:name)
           

             LIMIT :limit
             OFFSET :offset  
            `, {
            replacements:
            {
                limit: limit,
                offset: offset,
                tokenUserId: tokenUserId,
                fromDate: fromDate || null,
                toDate: toDate || null,
                name: name || null,
                referanceNumber: referanceNumber || null,
            },
            type: QueryTypes.SELECT
        })

        await Promise.all(getData.map(async (e) => {
           

            e.documentName = await myFunc.getDocumentNameById(e.documentId, db)
            e.referanceNumber = myFunc.openSSLDecryption(e.referanceNumber)

        }))



        let kycExcel = getData.map((e, i) => (

            {
                'Sl. No.': Number(i + 1),
                'Employee Code': e.employeeCode,
                'Employee Name': e.employeeName,
                // 'Email': e.employeeEmail,
                // 'Mobile': e.employeeMobile,
                'Date': e.createdDate,
                'Document Name': e.documentName,
                'Reference Number': e.referanceNumber
            }
        ))

        if(referanceNumber){
            
           getData=getData.filter(e=>{   
                if((e.referanceNumber)===referanceNumber){
                    return true
                }
            })
            if (getData.length === 0) {
                return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
            }
            let kycExcel = getData.map((e, i) => (

                {
                    'Sl. No.': Number(i + 1),
                    'Employee Code': e.employeeCode,
                    'Employee Name': e.employeeName,
                    // 'Email': e.employeeEmail,
                    // 'Mobile': e.employeeMobile,
                    'Date': e.createdDate,
                    'Document Name': e.documentName,
                    'Reference Number': e.referanceNumber
                }
            ))
            return res.status(200).send({
                status: true, totalData: getData.length,
                // employee: getData
                employee: myFunc.replaceEmptyValues(kycExcel)
            })
        }
        return res.status(200).send({
            status: true, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(kycExcel)
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

async function fetchData({ token, fromDate, toDate, name, referanceNumber }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyKycExcel`,

            data: { token, fromDate, toDate, name, referanceNumber }
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
            row.height = 40
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

async function getMykycExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let fromDate = req.body.fromDate || req.query.fromDate
        let toDate = req.body.toDate || req.query.toDate
        let name = req.body.name || req.query.name
        let referanceNumber = req.body.referanceNumber || req.query.referanceNumber
       
        let apiData = await fetchData({
            token,fromDate, toDate, name, referanceNumber
        })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My KYC.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getMykycExcel, getMykycExcelSheet }