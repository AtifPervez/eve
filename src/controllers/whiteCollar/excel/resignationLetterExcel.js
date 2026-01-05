let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')
const getResignationLetterExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '29'
        // let db = sequelize('59')
        let data = req.body
        const { branchName, empCode, email, employeeId, fromDate, toDate, mobileNo, noticePeriod,templateName } = data
        const countQuery = await db.query(
            `
                            select count(*) AS total
                             from eve_hrm_employee_resignation_details as a
                               left join eve_acc_employee as b on a.employeeId=b.id
                                   left join eve_hrm_template_master as c on a.resignationNameId=c.id

                                    where a.status='A'

                         and (:branchName is null or a.createdByBranch=:branchName)
                                 and (:empCode is null or b.employeeCode=:empCode)
                                      and (:employeeId is null or a.employeeId=:employeeId)
                                          and (:mobileNo is null or b.employeeMobile=:mobileNo)
                                          and (:templateName is null or a.resignationNameId=:templateName)
                                            and (:email is null or b.employeeEmail=:email)
                                            and (:noticePeriod is null or a.noticePeriod=:noticePeriod)

                                               and (:fromDate is null or a.resignationDate >= :fromDate)
                                                     and (:toDate is null or a.resignationDate <= :toDate)

                                                          and (b.employeeType = '' OR b.employeeType IS NULL OR b.employeeType = 'White Collar')          
                                                                      
            `, {
            replacements: {
                branchName: branchName || null,
                email: email || null,
                empCode: empCode || null,
                employeeId: employeeId || null,
                mobileNo: mobileNo || null,
                templateName: templateName || null,
                noticePeriod: noticePeriod || null,
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
                             a.id,
                              a.employeeId,
                              date_format(a.createdDate,'%d-%m-%Y') as appliedDate,
                               date_format(a.resignationDate,'%d-%m-%Y') as resignDate,
                                a.resignationNameId,
                                  a.createdByBranch,
                                  a.noticePeriod,
                                  a.currentStatus,
                                    b.employeeName,
                                      b.employeeEmail,
                                        b.employeeMobile,
                                            b.employeeCode,
                                              b.employeeName,
                                                c.templateName
                     
                        
              from eve_hrm_employee_resignation_details as a
                               left join eve_acc_employee as b on a.employeeId=b.id
                                   left join eve_hrm_template_master as c on a.resignationNameId=c.id

                                    where a.status='A'

                         and (:branchName is null or a.createdByBranch=:branchName)
                                 and (:empCode is null or b.employeeCode=:empCode)
                                      and (:employeeId is null or a.employeeId=:employeeId)
                                          and (:mobileNo is null or b.employeeMobile=:mobileNo)
                                          and (:templateName is null or a.resignationNameId=:templateName)
                                            and (:email is null or b.employeeEmail=:email)

                                                 and (:noticePeriod is null or a.noticePeriod=:noticePeriod)

                                              and (:fromDate is null or a.resignationDate >= :fromDate)
                                                     and (:toDate is null or a.resignationDate <= :toDate)

                                                          and (b.employeeType = '' OR b.employeeType IS NULL OR b.employeeType = 'White Collar')          


                        	ORDER BY a.resignationDate DESC
                            limit :limit
                            offset :offset                       
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    branchName: branchName || null,
                    email: email || null,
                    empCode: empCode || null,
                    employeeId: employeeId || null,
                    mobileNo: mobileNo || null,
                    noticePeriod: noticePeriod || null,
                    templateName: templateName || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map((e, i) => myFunc.getBranchNameByBranchId(e.createdByBranch, db).then(branchName => e.branchName = branchName)));
        const excelData = getData.map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Applied Date': e.appliedDate,
            'Resignation Date': e.resignDate,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Branch': e.branchName,
            'Mobile Number': e.employeeMobile,
            'Email': e.employeeEmail,
            'Notice Period (Days)':e.noticePeriod,
            'Template Name': e.templateName,
            'Current Status': e.currentStatus,
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
async function fetchData({ token, pageNo, limit, branchName, empCode, email, employeeId, fromDate, toDate, mobileNo, templateName,noticePeriod }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getResignationLetterExcel`,
            data: { token, pageNo, limit, branchName, empCode, email, employeeId, fromDate, toDate, mobileNo, templateName,noticePeriod }
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
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' }
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
        cell.font = { bold: true }
    })
    worksheet.columns.forEach(column => {
        column.width = 20;
    })
    return workbook.xlsx
}
async function getResignationLetterExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, branchName, empCode, email, employeeId, fromDate, toDate, mobileNo, templateName,noticePeriod } = data
        let apiData = await fetchData({ token, pageNo, limit, branchName, empCode, email, employeeId, fromDate, toDate, mobileNo, templateName,noticePeriod })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Resignation Letter.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getResignationLetterExcel, getResignationLetterExcelSheet }