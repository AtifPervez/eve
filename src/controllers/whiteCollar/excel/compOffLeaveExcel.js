let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getCompOffLeaveExcel = async (req, res) => {
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
        const { appliedFormDate, appliedToDate, empname, leaveFormDate, leaveToDate, status } = data
        const countQuery = await db.query(
            `
                            select count(*) AS total

                            from eve_acc_employee_compensatoryoff_leave_history as a   
                    left join eve_acc_leave_type as b on a.leaveTypeId=b.id
                    left join eve_acc_employee as c on a.empId=c.id

                  
                            
                    where a.status='A'    

                     and (:appliedFormDate IS NULL OR a.appliedDate >= :appliedFormDate)
                    and (:appliedToDate IS NULL OR a.appliedDate <= :appliedToDate)

                    and (:leaveFormDate IS NULL OR fromDate >= :leaveFormDate)
                    and (:leaveToDate IS NULL OR fromDate <= :leaveToDate)

                    and (:status IS NULL OR a.leaveStatus = :status)
                    and (:empname IS NULL OR c.employeeName LIKE :empname)


                    and (
                    (a.appriserId=:tokenUserId and a.isAppriserVisible='yes') 
                    or 
                    (a.reviewerId=:tokenUserId and a.isReviewerVisible='yes')
                    or
                    (a.managerId=:tokenUserId and a.isManagerVisible='yes')
                    )

                    	AND (c.employeeCurrentStatus= '' OR 
                             c.employeeCurrentStatus IS NULL OR 
                             c.employeeCurrentStatus = 'Active' OR 
                             c.employeeCurrentStatus = 'joining' OR 
                             c.employeeCurrentStatus = 'offerletter'
                             )

					AND (
                    c.employeeType = '' 
						OR c.employeeType IS NULL
						OR c.employeeType = 'White Collar'
					)

                          
            `, {
            replacements: {
                appliedFormDate: appliedFormDate || null,
                appliedToDate: appliedToDate || null,
                leaveFormDate: leaveFormDate || null,
                leaveToDate: leaveToDate || null,
                empname: empname || null,
                status: status || null,

                tokenUserId: tokenUserId
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
                            a.leaveTypeId,
                            DATE_FORMAT(a.appliedDate,'%d-%m-%Y') AS appliedDate,
                            concat(date_format(fromDate,'%d-%m-%Y'),' - ',date_format(toDate,'%d-%m-%Y')) as leaveDate,
                            a.totalDays as days,
                            a.leaveStatus,
                            a.appriserId,
                            a.isAppriserVisible,
                            a.isAppriserAccepted,
                            a.reviewerId,
                            a.isReviewerVisible,
                            a.isReviewerAccepted,
                            a.managerId,
                            a.isManagerVisible,
                            a.isManagerAccepted,
                                             c.employeeName,
                                             c.employeeBranchId,
                                             c.employeeSubCompanyId,
                                             c.id as employeeId,
                                             b.name   

                    from eve_acc_employee_compensatoryoff_leave_history as a   
                    left join eve_acc_leave_type as b on a.leaveTypeId=b.id
                    left join eve_acc_employee as c on a.empId=c.id

                  
                            
                    where a.status='A'    
                    and (:appliedFormDate IS NULL OR a.appliedDate >= :appliedFormDate)
                    and (:appliedToDate IS NULL OR a.appliedDate <= :appliedToDate)

                    and (:leaveFormDate IS NULL OR fromDate >= :leaveFormDate)
                    and (:leaveToDate IS NULL OR fromDate <= :leaveToDate)
                    and (:status IS NULL OR a.leaveStatus = :status)

                      and (:empname IS NULL OR c.employeeName LIKE :empname)

                    and (
                    (a.appriserId=:tokenUserId and a.isAppriserVisible='yes') 
                    or 
                    (a.reviewerId=:tokenUserId and a.isReviewerVisible='yes')
                    or
                    (a.managerId=:tokenUserId and a.isManagerVisible='yes')
                    )

                    	AND (c.employeeCurrentStatus= '' OR c.employeeCurrentStatus IS NULL OR c.employeeCurrentStatus = 'Active' OR c.employeeCurrentStatus = 'joining' OR c.employeeCurrentStatus = 'offerletter')

					AND (
                    c.employeeType = '' 
						OR c.employeeType IS NULL
						OR c.employeeType = 'White Collar'
					)
                    
                  
                    ORDER BY a.id DESC
                    LIMIT :limit OFFSET :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    appliedFormDate: appliedFormDate || null,
                    appliedToDate: appliedToDate || null,
                    leaveFormDate: leaveFormDate || null,
                    leaveToDate: leaveToDate || null,
                    empname: empname || null,
                    status: status || null,

                    tokenUserId: tokenUserId
                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e) => {

            if (e.isAppriserAccepted === 'yes') {
                e.appriserStatus = 'approved'
            }
            else if (e.isAppriserAccepted === 'no') {
                e.appriserStatus = 'pending'
            }
            if (e.isReviewerAccepted === 'yes') {
                e.reviewerStatus = 'approved'
            }
            else if (e.isReviewerAccepted === 'no') {
                e.reviewerStatus = 'pending'
            }
            if (e.isManagerAccepted === 'yes') {
                e.managerStatus = 'approved'
            }
            else if (e.isManagerAccepted === 'no') {
                e.managerStatus = 'pending'
            }
            if (e.appriserId) {
                e.r1 = `${await myFunc.getEmployeeNameById(e.appriserId, db)} - ${e.appriserStatus}`
            }
            else {
                e.r1 = ''
            }
            if (e.reviewerId) {
                e.r2 = `${await myFunc.getEmployeeNameById(e.reviewerId, db)} - ${e.reviewerStatus}`
            }
            else {
                e.r2 = ''
            }

            if (e.managerId) {
                e.r3 = `${await myFunc.getEmployeeNameById(e.managerId, db)} - ${e.managerStatus}`
            }
            else {
                e.r3 = ''
            }
            if (e.leaveStatus === 'A') {
                e.leaveStatusNew = 'Approved'
            }
            else if (e.leaveStatus === 'C') {
                e.leaveStatusNew = 'Rejected'
            }
            else if (e.leaveStatus === 'W') {
                e.leaveStatusNew = 'Pending'
            }
            e.branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.subCompany = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)

        }))
        const excelData = getData.map((e, i) =>

        ({
            'Sl. No.': i + 1,
            'Applied Date': e.appliedDate,
            'Leave Date': e.leaveDate,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Days': e.templateName,
            'R1': e.r1,
            'R2': e.r2,
            'R3': e.r3,
            'Approval Status': e.leaveStatusNew,



        }))
        return res.status(200).json({
            status: true, recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)


        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, appliedFormDate, appliedToDate, empname, leaveFormDate, leaveToDate, status }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getCompOffLeaveExcel`,
            data: { token, pageNo, limit, appliedFormDate, appliedToDate, empname, leaveFormDate, leaveToDate, status }
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

async function getCompOffLeaveExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, appliedFormDate, appliedToDate, empname, leaveFormDate, leaveToDate, status } = data
        let apiData = await fetchData({ token, pageNo, limit, appliedFormDate, appliedToDate, empname, leaveFormDate, leaveToDate, status })
     
        // if (!apiData.employee || apiData.employee.length === 0) {
        //      return res.status(200).json({ status: true, result:'error', alert: 'No Data Found'})
        // }

        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Comp-off Leave.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getCompOffLeaveExcel, getCompOffLeaveExcelSheet }