let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')
const getInterviewRoundExcel = async (req, res) => {
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
        const { interviewName, designationName, branchId } = data
        const countQuery = await db.query(
            `
                                        SELECT COUNT(*) AS total
                                        FROM eve_hrm_candidate_interview_process_type
                                        WHERE status='A'    
                                        AND (:interviewName IS NULL OR name=:interviewName)
                                        AND (:designationName IS NULL OR designation=:designationName)
                                        AND (:branchId IS NULL OR createdByBranch=:branchId)
            `, {
            replacements: {
                interviewName: interviewName || null,
                designationName: designationName || null,
                branchId: branchId || null,

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
                                name AS interviewType,
                                designation,
                                createdByBranch AS branch
                           
                               FROM eve_hrm_candidate_interview_process_type
                               CROSS JOIN (SELECT @row_number := :offset) AS init
                               WHERE status='A'
                               AND (:interviewName IS NULL OR name=:interviewName)
                               AND (:designationName IS NULL OR designation=:designationName)
                               AND (:branchId IS NULL OR createdByBranch=:branchId)

                               
                           
                               ORDER BY name
                               LIMIT   :limit
                               OFFSET :offset
        `, {
            replacements: {

                offset: offset,
                limit: limit,
                interviewName: interviewName || null,
                designationName: designationName || null,
                branchId: branchId || null,


            }, type: QueryTypes.SELECT
        }
        )
        await Promise.all(getData.map(async e => {
            e.designationName = e.designation === null ? 'This is default interview type' : await myFunc.getDesignationNameById(e.designation, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.branch, db)

        }))
        const excelData = getData.map(e => ({
            'Sl. No.': e.slno,
            'Interview Type': e.interviewType,
            'Designation': e.designationName,
            'Branch': e.branchName,
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
async function fetchData({ token, pageNo, limit, interviewName, designationName, branchId }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getInterviewRoundExcel`,

            data: { token, pageNo, limit, interviewName, designationName, branchId }

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

async function getInterviewRoundExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body };
        let { pageNo, limit, interviewName, designationName, branchId } = data
        let apiData = await fetchData({token, pageNo, limit, interviewName, designationName, branchId})
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Interview Round.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getInterviewRoundExcel, getInterviewRoundExcelSheet }