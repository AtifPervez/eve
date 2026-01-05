let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')
const getOfferLetterHistoryExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '29'
        // let db = sequelize('59')
        let data = req.body

        const { email, employeeId, mobileNo,templateName,fromDate,toDate } = data

        const countQuery = await db.query(
            `
                     select count(*) as total 
                     from eve_hrm_employee_offer_letter_details as a

                     left join eve_hrm_candidate as b on a.employeeId=b.id
                     left join eve_hrm_template_master as c on a.offerNameId=c.id

                     where a.status='A'
                     and (:email is null or b.email=:email)
                     and (:employeeId is null or   b.name=:employeeId)
                     and (:mobileNo is null or   b.contactNo=:mobileNo)
                     and (:templateName is null or   c.id=:templateName)
                     and (:fromDate is null or   a.offerDate >= :fromDate)
                     and (:toDate is null or   a.offerDate <= :toDate)
        
            `, {
            replacements: {
               
                email: email||null,
                employeeId: employeeId||null,
                mobileNo: mobileNo||null,
                templateName: templateName||null,
                fromDate: fromDate||null,
                toDate: toDate||null,

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
                 select
                 a.id, 
                 a.employeeId,
                 date_format(a.offerDate,'%d-%m-%Y') as newOfferDate,
                 a.offerNameId,
                 a.createdByBranch,
                 a.external_pdf_file,
                 a.offerLetterStatus,
                 b.name,
                 b.email,
                 b.contactNo,
                 c.id as templateId,
                 c.templateName
                 

                 from eve_hrm_employee_offer_letter_details as a
                 left join eve_hrm_candidate as b on a.employeeId=b.id
                 left join eve_hrm_template_master as c on a.offerNameId=c.id
                

                 where a.status='A'
                
                 and (:email is null or b.email=:email)
                 and (:employeeId is null or   b.name=:employeeId)
                 and (:mobileNo is null or   b.contactNo=:mobileNo)
                 and (:templateName is null or   c.id=:templateName)
                 and (:fromDate is null or   a.offerDate >= :fromDate)
                 and (:toDate is null or   a.offerDate <= :toDate)
                 

                 order by offerDate desc
                 limit :limit
                 offset :offset
                                    
                `, {
            replacements: {

                offset: offset,
                limit: limit,
                email: email||null,
                employeeId: employeeId||null,
                mobileNo: mobileNo||null,
                templateName: templateName||null,
                fromDate: fromDate||null,
                toDate: toDate||null,

            }, type: QueryTypes.SELECT
        }
        )
        await Promise.all(getData.map(async e => {
           
        }))
        const excelData = getData.map((e, i) => ({
            'Sl. No.':i+1,
            'Offer Letter Date':e.newOfferDate,
            'Employee Name': e.name,
            'Mobile Number': e.contactNo,
            'Email': e.email,
            'Template Name': e.templateName,
            'Offer Letter Status': e.offerLetterStatus,
        }))

        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData,
            employee: myFunc.replaceEmptyValues(excelData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, email, employeeId, mobileNo,templateName,fromDate,toDate }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getOfferLetterHistoryExcel`,

            data: { token, pageNo, limit, email, employeeId, mobileNo,templateName,fromDate,toDate }

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
        cell.font = { bold: true }

    })
    worksheet.columns.forEach(column => {
        column.width = 20
    })
    return workbook.xlsx
}

async function getOfferLetterHistoryExcelSheet(req, res) {
    try {
        
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, email, employeeId, mobileNo,templateName,fromDate,toDate } = data
    
        let apiData = await fetchData({
            token, pageNo, limit, email, employeeId, mobileNo,templateName,fromDate,toDate
        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Offer Letter.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getOfferLetterHistoryExcel,getOfferLetterHistoryExcelSheet }