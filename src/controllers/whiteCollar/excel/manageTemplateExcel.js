let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getManageTemplateExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)

        // const tokenUserId = '29'
        // let db = sequelize('59')

        let data = req.body;
        const { empSubCompany, searchTitle } = data
        const countQuery = await db.query(
            `
                            SELECT COUNT(*) AS total
                            
                            FROM eve_hrm_template AS a                               
                      
                            WHERE a.status='A'
                           AND (:searchTitle IS NULL OR title=:searchTitle )
                           AND (:empSubCompany IS NULL OR subCompanyId=:empSubCompany )
                            
                                                                              
            `, {
            replacements: {
                searchTitle: searchTitle || null,
                empSubCompany: empSubCompany || null,
            
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
                          
                               subCompanyId,
                               branchId,
                               title,
                               body,
                               body2

                               FROM eve_hrm_template AS a
                               WHERE a.status='A'
                            AND (:searchTitle IS NULL OR title=:searchTitle )
                           AND (:empSubCompany IS NULL OR subCompanyId=:empSubCompany )
                               ORDER BY a.id DESC
                               LIMIT :limit
                               OFFSET :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    searchTitle: searchTitle || null,
                    empSubCompany: empSubCompany || null,

                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e, i) => {
            e.slno = i + 1
            e.subComapanyName = await myFunc.getSubCompanyNameById(e.subCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.branchId, db)
           


            e.header = (e.body || '').replace(/<[^>]*>/g, "");
            e.header1 = (e.body2 || '').replace(/<[^>]*>/g, "");
           
        }))
        const excelData = getData.map(e =>

        ({
            'Sl. No.': e.slno,
            'Sub Comapny': e.subComapanyName,
            'Branch': e.branchName,
            'Title': e.title,
            'Header': e.header,
            'Footer': e.header1,



        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)


        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, empSubCompany, searchTitle }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getManageTemplateExcel`,
            data: { token, pageNo, limit, empSubCompany, searchTitle }
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
            row.height = 15

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

async function getManageTemplateExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, empSubCompany, searchTitle } = data
        let apiData = await fetchData({ token, pageNo, limit, empSubCompany, searchTitle })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Manage Template.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getManageTemplateExcel, getManageTemplateExcelSheet }