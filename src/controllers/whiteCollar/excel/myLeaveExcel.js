let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')
const getMyLeaveExcel = async (req, res) => {
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
        const {leavetype,day,status,appliedFormDate,appliedToDate,leaveFormDate,leaveToDate } = data

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total

               FROM eve_acc_employee_leave_history AS leavehistory
                                       LEFT JOIN eve_acc_leave_type AS leaveType ON leavehistory.leaveTypeId=leaveType.id

                                       WHERE leavehistory.status='A'
                                        
                                       AND leavehistory.empId=:empId
                                         AND (:leavetype IS NULL OR leavehistory.leaveTypeId=:leavetype)
                                           AND (:day IS NULL OR  leavehistory.totalDays=:day)
                                              AND (:status IS NULL OR   leavehistory.leaveStatus=:status)

           AND (:appliedFormDate IS NULL OR (DATE_FORMAT(leavehistory.appliedDate,'%d-%m-%Y'))>=:appliedFormDate)
            AND (:appliedToDate IS NULL OR (DATE_FORMAT(leavehistory.appliedDate,'%d-%m-%Y'))<=:appliedToDate)

            AND 
           (
                :leaveFormDate IS NULL 
                OR :leaveToDate IS NULL 
                OR (
                    leavehistory.fromDate >= STR_TO_DATE(:leaveFormDate, '%d-%m-%Y')
                    AND leavehistory.toDate <= STR_TO_DATE(:leaveToDate, '%d-%m-%Y')
                )
            )

     

`, {
            replacements: {
                empId: tokenUserId,
                leavetype:leavetype||null,
                day:day||null,
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
                                       
            leavehistory.empId,
                                       
            leavehistory.leaveTypeId,
                                       
            leaveType.name AS leaveName,

                                       
            DATE_FORMAT(leavehistory.appliedDate,'%d-%m-%Y') AS appliedDate,
                                       
            DATE_FORMAT(leavehistory.toDate,'%d-%m-%Y') AS toDate,
                                       
            DATE_FORMAT(leavehistory.fromDate,'%d-%m-%Y') AS fromDate,

                                       
            leavehistory.totalDays,
                                
                                          CASE 
             WHEN    leavehistory.leaveStatus = 'A' THEN 'Approved'
             WHEN   leavehistory.leaveStatus = 'W' THEN 'Pending'
             WHEN    leavehistory.leaveStatus = 'C' THEN 'Rejected'
             ELSE    leavehistory.leaveStatus
             END AS leaveStatus,
                                          CASE 
             WHEN    leavehistory.leaveStatus = 'A' THEN 'Leave is Confirmed'
             WHEN   leavehistory.leaveStatus = 'W' THEN 'Leave is Pending'
             WHEN    leavehistory.leaveStatus = 'C' THEN 'Leave is Rejected'
             ELSE    leavehistory.leaveStatus
             END AS appliedLeaveStatus,

                                          CASE 
             WHEN     leavehistory.isAppriserAccepted = 'no' THEN 'Pending'
             WHEN   leavehistory.isAppriserAccepted = 'yes' THEN 'Approved'
             ELSE    leavehistory.isAppriserAccepted
             END AS r1status,

                                          CASE 
             WHEN      leavehistory.isReviewerAccepted = 'no' THEN 'Pending'
             WHEN    leavehistory.isReviewerAccepted = 'yes' THEN 'Approved'
             ELSE     leavehistory.isReviewerAccepted
             END AS r2status,


                                          CASE 
             WHEN      leavehistory.isManagerAccepted = 'no' THEN 'Pending'
             WHEN    leavehistory.isManagerAccepted = 'yes' THEN 'Approved'
             ELSE     leavehistory.isManagerAccepted
             END AS r3status,
           
                                    
                                       
             leavehistory.reason,
             leavehistory.actionedBy,

             leavehistory.appriserId,
             leavehistory.isAppriserVisible,
           
             leavehistory.reviewerId,
             leavehistory.isReviewerVisible,
             
             leavehistory.managerId,
             leavehistory.isManagerVisible
            

                                       FROM eve_acc_employee_leave_history AS leavehistory
                                       LEFT JOIN eve_acc_leave_type AS leaveType ON leavehistory.leaveTypeId=leaveType.id

                                       WHERE leavehistory.status='A'
                                        
                                       AND leavehistory.empId=:empId

                                       AND (:leavetype IS NULL OR leavehistory.leaveTypeId=:leavetype)

                                       AND (:day IS NULL OR  leavehistory.totalDays=:day)

                                       AND (:status IS NULL OR   leavehistory.leaveStatus=:status)

            AND (:appliedFormDate IS NULL OR (DATE_FORMAT(leavehistory.appliedDate,'%d-%m-%Y'))>=:appliedFormDate)
            AND (:appliedToDate IS NULL OR (DATE_FORMAT(leavehistory.appliedDate,'%d-%m-%Y'))<=:appliedToDate)
            AND 
            (:leaveFormDate IS NULL OR :leaveToDate IS NULL 
            OR (
                    leavehistory.fromDate >= STR_TO_DATE(:leaveFormDate, '%d-%m-%Y')
                    AND leavehistory.toDate <= STR_TO_DATE(:leaveToDate, '%d-%m-%Y')
                )
            )         
            ORDER BY leavehistory.appliedDate  DESC    
               LIMIT :limit
             OFFSET :offset      


                                       `,
            {
                replacements:
                {
                    empId: tokenUserId,
                    limit: limit,
                    offset: offset,
                    leavetype:leavetype||null,
                    day:day||null,
                    status:status||null,
                    appliedFormDate:appliedFormDate||null,
                    appliedToDate:appliedToDate||null,
                    leaveFormDate:leaveFormDate||null,
                    leaveToDate:leaveToDate||null,
                },
                type: QueryTypes.SELECT
            })

        await Promise.all(getData.map(async (e, i) => {

            e.leaveDate = `${e.fromDate} - ${e.toDate}`
            e.r1 = `${await myFunc.getEmployeeNameById(e.appriserId, db)}-${e.r1status}`
            e.r2 = `${await myFunc.getEmployeeNameById(e.reviewerId, db)}-${e.r2status}`
            e.r3 = `${await myFunc.getEmployeeNameById(e.managerId, db)}-${e.r3status}`
            if(e.appriserId===''||e.appriserId===null){
                e.r1='N/A'
            }
            if(e.reviewerId===''||e.reviewerId===null){
                e.r2='N/A'
            }
            if(e.managerId===''||e.managerId===null){
                e.r3='N/A'
            }



        }))
      
        
        let myLeaveExcel = getData.map((e, i) => ({
            'Sl. No.': Number(i + 1),
            'Applied Date': e.appliedDate,
            'Leave Type': e.leaveName,
            'Day (s)': e.totalDays,
            'Leave Date': e.leaveDate,
            'R1': e.r1,
            'R2': e.r2,
            'R3': e.r3,
            'Status': e.leaveStatus,
            'Applied Leave Status': e.appliedLeaveStatus
        }))
        return res.status(200).send({
            status: true, totalData: totalData,
            employee: myFunc.replaceEmptyValues(myLeaveExcel)
            // employee: getData
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })
    }
}

async function fetchData({ token,leavetype,day,status,appliedFormDate,appliedToDate,leaveFormDate,leaveToDate }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyLeaveExcel`,
           
            data: { token,leavetype,day,status,appliedFormDate,appliedToDate,leaveFormDate,leaveToDate }
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
        cell.font = { bold: true };
    });

    worksheet.columns.forEach(column => {
        column.width = 20;
    });


   


    return workbook.xlsx
}

async function getMyLeaveExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let leavetype = req.body.leavetype || req.query.leavetype
        let day = req.body.day || req.query.day
        let status = req.body.status || req.query.status
        let appliedFormDate = req.body.appliedFormDate || req.query.appliedFormDate
        let appliedToDate = req.body.appliedToDate || req.query.appliedToDate
        let leaveFormDate = req.body.leaveFormDate || req.query.leaveFormDate
        let leaveToDate = req.body.leaveToDate || req.query.leaveToDate


        let apiData = await fetchData({ token,leavetype,day,status,appliedFormDate,appliedToDate,leaveFormDate,leaveToDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="myLeave.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })
    }
}
module.exports = { getMyLeaveExcel, getMyLeaveExcelSheet }