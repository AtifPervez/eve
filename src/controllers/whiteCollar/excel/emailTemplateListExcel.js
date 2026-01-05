let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
// const cheerio = require('cheerio');


// function extractTextFromHTML(html) {
//   const $ = cheerio.load(html);
//   return $('body').text().trim() || $.root().text().trim();
// }

function extractText(html) {
  // Remove all HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&ndash;/g, '-')  // en dash
             .replace(/&mdash;/g, '—')  // em dash
             .replace(/&hellip;/g, '…') // ellipsis
             .replace(/&rsquo;/g, '`')  // right single quote
             .replace(/&lsquo;/g, '`')  // left single quote
             .replace(/&rdquo;/g, '”')  // right double quote
             .replace(/&ldquo;/g, '“'); // left double quote

  // Collapse multiple spaces and trim
  return text.replace(/\s+/g, ' ').trim();
}




const getEmailTemplateListExcel = async (req, res) => {
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
        const { branchName, templateName, templateType, subCompany } = data
        const countQuery = await db.query(
            `
                            SELECT COUNT(*) AS total
                            
                            FROM eve_hrm_template_master AS a                               
                      
                            WHERE a.status='A'
                            AND (:branchName IS NULL OR createdByBranch=:branchName )
                               AND (:templateName IS NULL OR templateName=:templateName )
                               AND (:templateType IS NULL OR letterType=:templateType )
                                AND (:subCompany IS NULL OR subCompanyId=:subCompany )
                                                                              
            `, {
            replacements: {
                branchName: branchName || null,
                templateName: templateName || null,
                templateType: templateType || null,
                subCompany: subCompany || null,

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
                          
                               letterType,
                               templateBody,
                               subCompanyId,
                               createdByBranch,
                               templateName

                               FROM eve_hrm_template_master AS a
                               WHERE a.status='A'
                                     AND (:branchName IS NULL OR createdByBranch=:branchName )
                                     AND (:templateName IS NULL OR templateName=:templateName )
                                           AND (:templateType IS NULL OR letterType=:templateType )
                                           AND (:subCompany IS NULL OR subCompanyId=:subCompany )
                               ORDER BY templateName
                               LIMIT :limit
                               OFFSET :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    branchName: branchName || null,
                    templateName: templateName || null,
                    templateType: templateType || null,
                    subCompany: subCompany || null,

                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e, i) => {
            e.slno = i + 1
            e.subComapanyName = await myFunc.getSubCompanyNameById(e.subCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.createdByBranch, db)
            
            if(e.templateBody){
                e.templateBody =extractText(e.templateBody)
            }
        }))

        const excelData = getData.map(e =>

        ({
            'Sl. No.': e.slno,
            'Template Name': e.templateName,
            'Template Type': e.letterType,
            'Sub Company': e.subComapanyName,
            'Branch': e.branchName,
            'Template': e.templateBody,
        }))

        return res.status(200).json({
            status: true,
            recordedPerPage: limit, 
            currentPage: pageNo,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}

async function fetchData({ token, pageNo, limit, branchName, templateName, templateType, subCompany }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getEmailTemplateListExcel`,
            data: { token, pageNo, limit, branchName, templateName, templateType, subCompany }
        }

        const response = await axios(config)

        return response.data

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

async function getEmailTemplateListExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, branchName, templateName, templateType, subCompany } = data
        let apiData = await fetchData({ token, pageNo, limit, branchName, templateName, templateType, subCompany })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Email Template List.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getEmailTemplateListExcel, getEmailTemplateListExcelSheet }