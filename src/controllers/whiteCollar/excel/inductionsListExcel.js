let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getInductionsListExcel = async (req, res) => {
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
        const { branchName, title,fromDate,toDate } = data
        const countQuery = await db.query(
            `
                            select COUNT(*) as total
                            
                            from eve_hrm_induction_details                           
                      
                            where status='A'
                           and (:branchName is null or createdByBranch=:branchName )
                           and (:title IS null or title=:title )
                           and (:fromDate IS null or createdDate >= str_to_date(:fromDate,'%d-%m-%Y') )
                           and (:toDate IS null or createdDate <= str_to_date(:toDate,'%d-%m-%Y') )
                            
                                                                              
            `, {
            replacements: {
                branchName: branchName || null,
                title: title || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
             
            
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
                               select
                               date_format(createdDate,'%d-%m-%Y') as date,
                               title,
                               createdByBranch
                            from eve_hrm_induction_details                           
                      
                            where status='A'
                           and (:branchName is null or createdByBranch=:branchName )
                           and (:title IS null or title=:title )
                             and (:fromDate IS null or    (createdDate) >= str_to_date(:fromDate,'%d-%m-%Y') )
                          and (:toDate IS null or    (createdDate) <= str_to_date(:toDate,'%d-%m-%Y')  )
                               order by createdDate desc
                               limit :limit
                               offset :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    branchName: branchName || null,
                    title: title || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                 

                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e, i) => {
            e.slno = i + 1
            e.branchName = await myFunc.getBranchNameByBranchId(e.createdByBranch, db)
        }))
        const excelData = getData.map(e =>

        ({
            'Sl. No.': e.slno,
            'Created Date': e.date,
            'Document Name': e.title,
            'Branch': e.branchName,
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
async function fetchData({ token, pageNo, limit,  branchName, title,fromDate,toDate }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getInductionsListExcel`,
            data: { token, pageNo, limit,  branchName, title,fromDate,toDate }
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

async function getInductionsListExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit,  branchName, title,fromDate,toDate } = data
        let apiData = await fetchData({ token, pageNo, limit,  branchName, title,fromDate,toDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Inductions List.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getInductionsListExcel, getInductionsListExcelSheet }