let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

// function extractText(html) {
//   // Remove all HTML tags
//   let text = html.replace(/<[^>]*>/g, '');

//   // Decode common HTML entities
//   text = text.replace(/&nbsp;/g, ' ')
//              .replace(/&amp;/g, '&')
//              .replace(/&lt;/g, '<')
//              .replace(/&gt;/g, '>')
//              .replace(/&quot;/g, '"')
//              .replace(/&#39;/g, "'")
//              .replace(/&ndash;/g, '-')  // en dash
//              .replace(/&mdash;/g, '—')  // em dash
//              .replace(/&hellip;/g, '…') // ellipsis
//              .replace(/&rsquo;/g, '`')  // right single quote
//              .replace(/&lsquo;/g, '`')  // left single quote
//              .replace(/&rdquo;/g, '”')  // right double quote
//              .replace(/&ldquo;/g, '“'); // left double quote

//   // Collapse multiple spaces and trim
//   return text.replace(/\s+/g, ' ').trim();
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
             .replace(/&ndash;/g, '-')
             .replace(/&mdash;/g, '—')
             .replace(/&hellip;/g, '…')
             .replace(/&rsquo;/g, '`')
             .replace(/&lsquo;/g, '`')
             .replace(/&rdquo;/g, '”')
             .replace(/&ldquo;/g, '“');

  // Fix corrupted UTF-8 characters (common in misencoded text)
  text = text.replace(/â€“/g, '-')
             .replace(/â€”/g, '—')
             .replace(/â€™/g, '`')
             .replace(/â€œ/g, '“')
             .replace(/â€/g, '”')
             .replace(/â€˜/g, '`')
             .replace(/â€\s?/g, '"') // fallback for stray quotes
             .replace(/â/g, '');     // remove leftover stray 'â'

  // Collapse multiple spaces and trim
  return text.replace(/\s+/g, ' ').trim()
}

const getTemplateHistoryExcel = async (req, res) => {
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
        const { branchName, message, sendToMailId, subject, fromDate, toDate } = data
        const countQuery = await db.query(
            `
                            select count(*) AS total
                            from eve_hrm_email_history   
                            where status='A' 
                            and (:branchName is null or createdByBranch=:branchName )                           
                            and (:message is null or message=:message )                           
                            and (:sendToMailId is null or sendToMailId=:sendToMailId )                           
                            and (:subject is null or subject=:subject )   
                            and (:fromDate is null or date(createdDate) >= :fromDate)   
                            and (:toDate is null or date(createdDate) <= :toDate )                                  
                                                                      
            `, {
            replacements: {
                branchName: branchName || null,
                message: message || null,
                sendToMailId: sendToMailId || null,
                subject: subject || null,
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
                            createdByBranch,
                            sendToMailId,
                            subject,
                            message
                            from eve_hrm_email_history 
                            where status='A' 
                              and (:branchName is null or createdByBranch=:branchName )      
                                 and (:message is null or message=:message )  
                                    and (:sendToMailId is null or sendToMailId=:sendToMailId ) 
                                      and (:subject is null or subject=:subject )                               
                             

                            -- and (:fromDate is null or (createdDate) >= DATE_ADD(STR_TO_DATE(:fromDate, '%d-%m-%Y'), INTERVAL 1 DAY))                           
                            -- and (:toDate is null or (createdDate) <= DATE_ADD(STR_TO_DATE(:toDate, '%d-%m-%Y'), INTERVAL 1 DAY))   
                            
                                and (:fromDate is null or date(createdDate) >= :fromDate)   
                            and (:toDate is null or date(createdDate) <= :toDate )      
                              
                              order by createdDate desc
                               LIMIT :limit
                               OFFSET :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    branchName: branchName || null,
                    message: message || null,
                    sendToMailId: sendToMailId || null,
                    subject: subject || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                    // employeeCode: employeeCode || null,
                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e, i) => {

            e.branchName = await myFunc.getBranchNameByBranchId(e.createdByBranch, db)
            // if (e.message !== null) {
            //     const html = e.message
            //     const dom = new JSDOM(html);
            //     const document = dom.window.document;
            //     const samps = document.querySelectorAll('samp');
            //     const sentences = Array.from(samps).map(el => el.textContent.trim());
            //     e.message = sentences.join('\n') // Join the sentences with a space



               
            //     // e.message = plainText.replace(/\n/g, " "); // Replace newlines with spaces
            //     // e.message = e.message.replace(/<[^>]*>/g, "")
            // }
            if (e.message !== null) {
                e.message = extractText(e.message)
                let cleaned = e.message.replace(/Please update your status here.*$/i, '').trim();
             
                e.message = cleaned

            }
        }))
        const excelData = getData.map((e, i) =>

        ({
            'Sl. No.': i + 1,
            'Date': e.date,
            'Branch': e.branchName,
            'Sent To': e.sendToMailId,
            'Subject': e.subject,
            'Message': e.message,
        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo,
            totalData: totalData,
            // totalData: getData.length,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)


        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, branchName, message, sendToMailId, subject, fromDate, toDate }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getTemplateHistoryExcel`,
            data: { token, pageNo, limit, branchName, message, sendToMailId, subject, fromDate, toDate }
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

async function getTemplateHistoryExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, branchName, message, sendToMailId, subject, fromDate, toDate } = data
        let apiData = await fetchData({ token, pageNo, limit, branchName, message, sendToMailId, subject, fromDate, toDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Template History.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getTemplateHistoryExcel, getTemplateHistoryExcelSheet }