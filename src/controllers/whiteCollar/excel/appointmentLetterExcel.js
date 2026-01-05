let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getAppointmentLetterExcel = async (req, res) => {
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
        const { email, employeeId, fromDate, mobileNo, noticePeriod,templateName,toDate } = data
        const countQuery = await db.query(
            `
                            select count(*) AS total

                            from eve_hrm_employee_joining_details as a

                            left join eve_hrm_candidate as b on a.employeeId = b.id

                            left join eve_hrm_template_master as c on a.joiningNameId = b.id

                            where a.status='A'       
                            
                            and (:email is null or b.email=:email)

                            and (:employeeId is null or b.name=:employeeId)
                        
                            and (:mobileNo is null or b.contactNo=:mobileNo)

                            and (:noticePeriod is null or a.noticePeriod=:noticePeriod)

                              and (:templateName is null or a.joiningNameId=:templateName)

                                and (:fromDate is null or a.joiningDate >= str_to_date(:fromDate,'%d-%m-%Y'))

                     and (:toDate is null or a.joiningDate <= str_to_date(:toDate,'%d-%m-%Y'))
            `, {
            replacements: {
                email: email || null,
                employeeId: employeeId || null,
                mobileNo: mobileNo || null,
                noticePeriod: noticePeriod || null,
                templateName: templateName || null,
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
                            
                            -- a.id,

                            a.employeeId,

                            a.noticePeriod,

                            date_format(a.joiningDate,'%d-%m-%Y') as appointmentDate,

                            a.joiningNameId,
                           
                            a.createdByBranch,

                            b.name,

                            b.email,

                            b.contactNo,

                          
                            c.templateName

                            
                    from eve_hrm_employee_joining_details as a   

                    left join eve_hrm_candidate as b on a.employeeId = b.id

                    left join eve_hrm_template_master as c on a.joiningNameId = c.id
                            
                    where a.status='A'    
                    
                   and (:email is null or b.email=:email)

                   and (:employeeId is null or b.name=:employeeId)

                   and (:mobileNo is null or b.contactNo=:mobileNo)

                    and (:noticePeriod is null or a.noticePeriod=:noticePeriod)

                     and (:templateName is null or a.joiningNameId=:templateName)

                     and (:fromDate is null or a.joiningDate >= str_to_date(:fromDate,'%d-%m-%Y'))

                     and (:toDate is null or a.joiningDate <= str_to_date(:toDate,'%d-%m-%Y'))
                               
                    order by joiningDate desc
                                     
                    LIMIT :limit OFFSET :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    email: email || null,
                    employeeId: employeeId || null,
                    mobileNo: mobileNo || null,
                    noticePeriod: noticePeriod || null,
                    templateName: templateName || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                }, type: QueryTypes.SELECT
            }
        )
      
        const excelData = getData.map((e,i) =>

        ({
            'Sl. No.': i+1,
            'Appointment Date': e.appointmentDate,
            'Employee Name': e.name,
            'Mobile Number': e.contactNo,
            'Email': e.email,
            'Notice Period (Days)': e.noticePeriod,
            'Template Name': e.templateName,
          


        }))
        return res.status(200).json({
            status: true,recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)
            

        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, email, employeeId, fromDate, mobileNo, noticePeriod,templateName,toDate}) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getAppointmentLetterExcel`,
            data: { token, pageNo, limit, email, employeeId, fromDate, mobileNo, noticePeriod,templateName,toDate }
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
        column.width = 25;
    });
    return workbook.xlsx
}

async function getAppointmentLetterExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, email, employeeId, fromDate, mobileNo, noticePeriod,templateName,toDate } = data
        let apiData = await fetchData({ token, pageNo, limit, email, employeeId, fromDate, mobileNo, noticePeriod,templateName,toDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Appointment Letter.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getAppointmentLetterExcel, getAppointmentLetterExcelSheet }