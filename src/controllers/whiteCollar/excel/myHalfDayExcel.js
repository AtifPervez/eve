let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');


const getMyHalfDayExcel = async (req, res) => {
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
        const { leavetype, HalfDayType, status, appliedFormDate,appliedToDate,leaveFormDate,leaveToDate } = data

        let countQuery = await db.query(`
            
            select COUNT(*) AS total
            from eve_acc_employee_halfday_leave_history as a 
            left join eve_acc_leave_type as b on a.leaveTypeId=b.id
            where a.status='A'
            and a.empId=:tokenUserId 
                and   (:leavetype is null or a.leaveTypeId=:leavetype) 
                and   (:HalfDayType is null or a.halfdayType=:HalfDayType) 

                  AND (:status IS NULL OR 
                              ( CASE 
                  WHEN a.leaveStatus = 'C' THEN 'Rejected'
                  WHEN a.leaveStatus = 'W' THEN 'Pending'
                  WHEN a.leaveStatus = 'A' THEN 'Approved'
                  ELSE a.leaveStatus
                              END ) = :status)

                                and (:appliedFormDate is null or (a.appliedDate) >= (:appliedFormDate))
                              and (:appliedToDate is null or (a.appliedDate) <= (:appliedToDate))

                                and (:leaveFormDate is null or (a.leaveDate) >= (:leaveFormDate))
                              and (:leaveToDate is null or (a.leaveDate) <= (:leaveToDate))

            `,
            {
                replacements: {
                    tokenUserId: tokenUserId,
                    leavetype: leavetype||null,
                    HalfDayType: HalfDayType||null,
                    status: status||null,
                    appliedFormDate: appliedFormDate||null,
                    appliedToDate: appliedToDate||null,
                    leaveFormDate: leaveFormDate||null,
                    leaveToDate: leaveToDate||null,
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
            
             select 
             (@row_number:=@row_number + 1) as 'slno',

            a.empId,
            a.leaveTypeId,

            date_format(a.appliedDate,'%d-%m-%Y') as appliedDate,
            date_format(a.leaveDate,'%d-%m-%Y') as leaveDate,
           
            a.halfdayType,
            a.leaveStatus AS leaveStatusBy,
            a.appriserId,
            a.reviewerId,
            a.managerId,
            a.actionedBy,
            b.name as leaveName,

                              case
            when a.leaveStatus='C' then 'Rejected'                   
            when a.leaveStatus='W' then 'Pending'                   
            when a.leaveStatus='A' then 'Approved'
            else a.leaveStatus
            end as leaveStatus,
            
            a.isAppriserAccepted,
            a.isReviewerAccepted,
            a.isManagerAccepted,

                                          CASE 
             WHEN     a.isAppriserAccepted = 'no' THEN 'Pending'
             WHEN   a.isAppriserAccepted = 'yes' THEN 'Approved'
             ELSE    a.isAppriserAccepted
             END AS r1status,

                                          CASE 
             WHEN      a.isReviewerAccepted = 'no' THEN 'Pending'
             WHEN    a.isReviewerAccepted = 'yes' THEN 'Approved'
             ELSE     a.isReviewerAccepted
             END AS r2status,


                                          CASE 
             WHEN      a.isManagerAccepted = 'no' THEN 'Pending'
             WHEN    a.isManagerAccepted = 'yes' THEN 'Approved'
             ELSE     a.isManagerAccepted
             END AS r3status,
            
            
                                 CASE 
             WHEN    a.leaveStatus = 'A' THEN 'Leave is Confirmed'
             WHEN   a.leaveStatus = 'W' THEN 'Leave is Pending'
             WHEN    a.leaveStatus = 'C' THEN 'Leave is Rejected'
             ELSE    a.leaveStatus
             END AS appliedLeaveStatus


            from eve_acc_employee_halfday_leave_history as a 
            left join eve_acc_leave_type as b on a.leaveTypeId=b.id

          cross join (SELECT @row_number := :offset) as init

            where a.status='A'
         
            and a.empId=:tokenUserId
            and   (:leavetype is null or a.leaveTypeId=:leavetype)
              and   (:HalfDayType is null or a.halfdayType=:HalfDayType)  

             AND (:status IS NULL OR 
                              ( CASE 
                  WHEN a.leaveStatus = 'C' THEN 'Rejected'
                  WHEN a.leaveStatus = 'W' THEN 'Pending'
                  WHEN a.leaveStatus = 'A' THEN 'Approved'
                  ELSE a.leaveStatus
                              END ) = :status)

                                      and (:appliedFormDate is null or (a.appliedDate) >= (:appliedFormDate))
                              and (:appliedToDate is null or (a.appliedDate) <= (:appliedToDate))

                                and (:leaveFormDate is null or (a.leaveDate) >= (:leaveFormDate))
                              and (:leaveToDate is null or (a.leaveDate) <= (:leaveToDate))


            order by a.appliedDate desc
             limit :limit
             offset :offset  
            `, {
            replacements:
            {
                limit: limit,
                offset: offset,
                tokenUserId: tokenUserId,
                leavetype: leavetype||null,
                HalfDayType: HalfDayType||null,
                status: status||null,
                appliedFormDate: appliedFormDate||null,
                appliedToDate: appliedToDate||null,
                leaveFormDate: leaveFormDate||null,
                leaveToDate: leaveToDate||null,
            },
            type: QueryTypes.SELECT
        })
        // await Promise.all(getData.map(async (e) => {

            // if (e.appriserId !== '') {
            //     if (e.actionedBy === e.appriserId && e.leaveStatusBy === 'C') {
            //         e.r1status = 'Rejected'
            //     }

            // }


        // }))
        let myHalfDayExcel = getData.map((e, i) => ({
            'Sl. No.': e.slno,
            'Applied Date': e.appliedDate,
            'Leave Type': e.leaveName,
            'Half Day Type': e.halfdayType,
            'Leave Date': e.leaveDate,
            'R1': e.r1status,
            'R2': e.r2status,
            'R3': e.r3status,
            'Status': e.leaveStatus,
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

async function fetchData({ token,leavetype, HalfDayType, status, appliedFormDate,appliedToDate,leaveFormDate,leaveToDate }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyHalfDayExcel`,

            data: { token,leavetype, HalfDayType, status, appliedFormDate,appliedToDate,leaveFormDate,leaveToDate }
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

async function getMyHalfDayExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { leavetype, HalfDayType, status, appliedFormDate,appliedToDate,leaveFormDate,leaveToDate } = data

        let apiData = await fetchData({ token,leavetype, HalfDayType, status, appliedFormDate,appliedToDate,leaveFormDate,leaveToDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="MyHalfDay.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyHalfDayExcel, getMyHalfDayExcelSheet }