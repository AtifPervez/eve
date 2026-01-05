let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getChecklistCategoryExcel = async (req, res) => {
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
        const { checkListCategoryName } = data
        const countQuery = await db.query(
            `
                                        SELECT COUNT(*) AS total
                                        FROM eve_checklist_category 
                                        WHERE status='A'  
                                        AND (:checkListCategoryName IS NULL OR checkListName=:checkListCategoryName)
                                                              
            `, {
            replacements: {

                checkListCategoryName: checkListCategoryName || null,
               
               

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
                               checkListName
                               FROM eve_checklist_category 
                               CROSS JOIN (SELECT @row_number := :offset) AS init
                               WHERE status='A' 
                               AND (:checkListCategoryName IS NULL OR checkListName=:checkListCategoryName)
                               LIMIT   :limit
                               OFFSET :offset                            
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    checkListCategoryName: checkListCategoryName || null,
                  
                    
                }, type: QueryTypes.SELECT
            }
        )

        const excelData = getData.map(e => 
            
        ({
            'Sl. No.': e.slno,
            'Check List Category': e.checkListName,
        }))



        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)

        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit,checkListCategoryName }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getChecklistCategoryExcel`,

            data: { token, pageNo, limit,checkListCategoryName }

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

async function getChecklistCategoryExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }

        let { pageNo, limit, checkListCategoryName } = data

        let apiData = await fetchData({ token, pageNo, limit,checkListCategoryName })

        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Create Checklist Category.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getChecklistCategoryExcel, getChecklistCategoryExcelSheet }