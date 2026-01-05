let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');


const getMyCompOffLeaveExcel = async (req, res) => {
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
        let { status, appliedFormDate, appliedToDate, leaveFormDate,leaveToDate } = data

        let countQuery = await db.query(`
            
            SELECT COUNT(*) AS total
              FROM eve_acc_employee_compensatoryoff_leave_history
              WHERE status='A'
              AND empId=:tokenUserId
                AND (:status IS NULL OR leaveStatus=:status)

                 AND (:appliedFormDate IS NULL OR appliedDate >= STR_TO_DATE(:appliedFormDate, '%d-%m-%Y'))
                 AND (:appliedToDate IS NULL OR appliedDate <= STR_TO_DATE(:appliedToDate, '%d-%m-%Y'))

                 AND (:leaveFormDate IS NULL OR fromDate >= STR_TO_DATE(:leaveFormDate, '%d-%m-%Y'))
                 AND (:leaveToDate IS NULL OR toDate <= STR_TO_DATE(:leaveToDate, '%d-%m-%Y'))
            `,
            {
                replacements: {
                    tokenUserId: tokenUserId,
                    status:status||null,
                    appliedFormDate:appliedFormDate||null,
                    appliedToDate:appliedToDate||null,
                    leaveFormDate:leaveFormDate||null,
                    leaveToDate:leaveToDate||null,
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

        (@row_number:=@row_number + 1) as 'slno',

        DATE_FORMAT(appliedDate, '%d-%m-%Y') AS appliedDate,

        totalDays,

        DATE_FORMAT(fromDate, '%d-%m-%Y') AS fromDate,
        DATE_FORMAT(toDate, '%d-%m-%Y') AS toDate,

        CONCAT(DATE_FORMAT(fromDate, '%d-%m-%Y'), ' - ', DATE_FORMAT(toDate, '%d-%m-%Y')) AS leaveDate,

                              CASE 
             WHEN    leaveStatus = 'A' THEN 'Approved'
             WHEN   leaveStatus = 'W' THEN 'Pending'
             WHEN    leaveStatus = 'C' THEN 'Rejected'
             ELSE    leaveStatus
             END AS status,

             appriserId,
             reviewerId,
             managerId,

                                          CASE 
             WHEN     isAppriserAccepted = 'no' THEN 'Pending'
             WHEN   isAppriserAccepted = 'yes' THEN 'Approved'
             ELSE    isAppriserAccepted
             END AS r1status,

                                   CASE
                  WHEN      isReviewerAccepted = 'no' THEN 'Pending'
             WHEN    isReviewerAccepted = 'yes' THEN 'Approved'
             ELSE     isReviewerAccepted
             END AS r2status,

                                         CASE 
             WHEN      isManagerAccepted = 'no' THEN 'Pending'
             WHEN    isManagerAccepted = 'yes' THEN 'Approved'
             ELSE     isManagerAccepted
             END AS r3status

        FROM eve_acc_employee_compensatoryoff_leave_history

            cross join (SELECT @row_number := :offset) as init

        WHERE status = 'A'
        AND empId = :tokenUserId

        AND (:status IS NULL OR leaveStatus=:status)

          AND (:appliedFormDate IS NULL OR appliedDate >= STR_TO_DATE(:appliedFormDate, '%d-%m-%Y'))
         AND (:appliedToDate IS NULL OR appliedDate <= STR_TO_DATE(:appliedToDate, '%d-%m-%Y'))

           AND (:leaveFormDate IS NULL OR fromDate >= STR_TO_DATE(:leaveFormDate, '%d-%m-%Y'))
            AND (:leaveToDate IS NULL OR toDate <= STR_TO_DATE(:leaveToDate, '%d-%m-%Y'))

        ORDER BY appliedDate DESC

         LIMIT :limit
         OFFSET :offset
            `, {
            replacements:
            {
                limit: limit,
                offset: offset,
                tokenUserId: tokenUserId,
                status:status||null,
                appliedFormDate:appliedFormDate||null,
                appliedToDate:appliedToDate||null,
                leaveFormDate:leaveFormDate||null,
                leaveToDate:leaveToDate||null,


            },
            type: QueryTypes.SELECT
        })
       
        await Promise.all(getData.map(async (e) => {
          

       e.r1=`${await myFunc.getEmployeeNameById(e.appriserId,db)} - ${e.r1status}`
       e.r2=`${await myFunc.getEmployeeNameById(e.reviewerId,db)} - ${e.r2status}`
       e.r3=`${await myFunc.getEmployeeNameById(e.managerId,db)} - ${e.r3status}`

       if(e.appriserId===''){
        e.r1='N/A'
       }
       if(e.reviewerId===''){
        e.r2='N/A'
       }
       if(e.managerId===''){
        e.r3='N/A'
       }
       


        }))
        let myHalfDayExcel = getData.map((e, i) => ({
            'Sl. No.': e.slno,
            'Applied Date': e.appliedDate,
            'Day (s)': e.totalDays,
            'Half Day Type': e.halfdayType,
            'Leave Date': e.leaveDate,
            'R1': e.r1,
            'R2': e.r2,
            'R3': e.r3,
            'Status': e.status,
            'Applied Leave Status': e.appliedLeaveStatus
        }))

        return res.status(200).send({
            status: true, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(myHalfDayExcel)
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}

async function fetchData({ token, status, appliedFormDate, appliedToDate, leaveFormDate,leaveToDate }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyCompOffLeaveExcel`,

            data: { token, status, appliedFormDate, appliedToDate, leaveFormDate,leaveToDate }
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
            row.height = 20
        });
    });
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };
    });

    worksheet.columns.forEach(column => {
        column.width = 30
    });





    return workbook.xlsx
}

async function getMyCompOffLeaveExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let status = req.body.status || req.query.status
        let appliedFormDate = req.body.appliedFormDate || req.query.appliedFormDate
        let appliedToDate = req.body.appliedToDate || req.query.appliedToDate
        let leaveFormDate = req.body.leaveFormDate || req.query.leaveFormDate
        let leaveToDate = req.body.leaveToDate || req.query.leaveToDate


        let apiData = await fetchData({ token, status, appliedFormDate, appliedToDate, leaveFormDate,leaveToDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="myCompOffLeave.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyCompOffLeaveExcel, getMyCompOffLeaveExcelSheet }