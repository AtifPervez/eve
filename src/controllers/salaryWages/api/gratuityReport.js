let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const getGratuityReport = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        let data = { ...req.body, ...req.query }
        const { branchId, departmentId, designationId, employeeCode, employeeName, subCompanyId, GratuityAmount,subDepartmentId } = data
        let countQuery = await db.query(`
                                        SELECT COUNT(*) AS total
                                        FROM eve_blue_gratuity_list_setting AS a
                                        LEFT JOIN eve_acc_employee AS b ON a.empId=b.id
                                        WHERE a.status='A' 
                                       -- AND b.id IS NOT NULL AND a.amount IS NOT NULL 
                                        AND b.employeeType='Blue Collar'

                                          AND (:branchId IS NULL OR b.employeeBranchId=:branchId)
                                            AND (:departmentId IS NULL OR b.employeeDepartmentId=:departmentId)
                                            AND (:designationId IS NULL OR b.employeeDesignationId=:designationId)
                                            AND (:employeeCode IS NULL OR b.employeeCode=:employeeCode)
                                            AND (:employeeName IS NULL OR b.id=:employeeName)
                                            AND (:subCompanyId IS NULL OR b.employeeSubCompanyId=:subCompanyId)
                                            AND (:subDepartmentId IS NULL OR b.employeeSubDepartmentId=:subDepartmentId)
                                             AND (
                                                 :GratuityAmount IS NULL OR 
                                                 CAST(REPLACE(a.amount, ',', '') AS DECIMAL(10,2)) = :GratuityAmount
                                               )
            `, {
            replacements: {
                branchId: branchId || null,
                departmentId: departmentId || null,
                designationId: designationId || null,
                employeeCode: employeeCode || null,
                employeeName: employeeName || null,
                subCompanyId: subCompanyId || null,
                GratuityAmount: GratuityAmount || null,
                subDepartmentId: subDepartmentId || null,
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total
        if (totalData === 0) {
            return res.status(200).json({
            status: true,
            result: "success",
            msg: "No data found",
            totalData: totalData,
            employee: []
        })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit
        const sqlData = await db.query(`
                                            SELECT
                                            -- (@row_number:=@row_number + 1) AS slno,
                                            b.id,
                                            b.employeeName,
                                            b.employeeCode,
                                            b.employeeSubCompanyId,
                                            b.employeeBranchId,
                                            b.employeeDepartmentId,
                                            b.employeeSubDepartmentId,
                                            b.employeeDesignationId,
                                            a.amount,
                                            a.approveStatus,
                                            -- a.month,
                                            -- a.year,
                                            -- b.employeeType,
                                            a.paymentStatus,
                                            -- a.approveDate,
                                            -- a.endDate,
                                            c.appriserId,
                                            c.reviewerId,
                                            c.managerId,
                                            -- c.approvalRequired,
                                            a.appriserIdStatus,
                                            a.reviewerIdStatus,
                                            a.managerIdStatus

                                            FROM eve_blue_gratuity_list_setting AS a
                                            LEFT JOIN eve_acc_employee AS b ON a.empId=b.id
                                            LEFT JOIN eve_acc_employee_gratuity_report AS c ON a.empId=c.empId
                                            -- CROSS JOIN (SELECT @row_number := :offset) AS init
                                            WHERE a.status='A' 
                                            -- AND b.id IS NOT NULL AND a.amount IS NOT NULL 
                                            AND b.employeeType='Blue Collar'

                                            AND (:branchId IS NULL OR b.employeeBranchId=:branchId)
                                            AND (:departmentId IS NULL OR b.employeeDepartmentId=:departmentId)
                                            AND (:designationId IS NULL OR b.employeeDesignationId=:designationId)
                                            AND (:employeeCode IS NULL OR b.employeeCode=:employeeCode)
                                            AND (:employeeName IS NULL OR b.id=:employeeName)
                                             AND (:subDepartmentId IS NULL OR b.employeeSubDepartmentId=:subDepartmentId)
                                            AND (:subCompanyId IS NULL OR b.employeeSubCompanyId=:subCompanyId)
                                           -- AND (:GratuityAmount IS NULL OR CAST(a.amount AS DECIMAL(10,2)) = :GratuityAmount)
                                           AND (
                                                 :GratuityAmount IS NULL OR 
                                                 CAST(REPLACE(a.amount, ',', '') AS DECIMAL(10,2)) = :GratuityAmount
                                               )


                                            ORDER BY b.employeeName ASC
                                            LIMIT :limit
                                            OFFSET :offset  
            `, {
            replacements: {
                limit: limit,
                offset: offset,
                branchId: branchId || null,
                departmentId: departmentId || null,
                designationId: designationId || null,
                employeeCode: employeeCode || null,
                employeeName: employeeName || null,
                subCompanyId: subCompanyId || null,
                GratuityAmount: GratuityAmount || null,
                subDepartmentId: subDepartmentId || null,
            },
            type: QueryTypes.SELECT
        })

        await Promise.all(sqlData.map(async e => {

            e.slno=sqlData.indexOf(e)+1+offset
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.approvalStatus = e.approveStatus === 'A' ? 'Approved' : e.approvaStatus === 'W' ? 'Pending' : e.approvalStatus === 'C' ? 'Rejected' : ''

            if (e.appriserIdStatus === 'yes' && e.appriserId !== null) {
                e.r1Status = 'Approved'
            }
            else if (e.appriserIdStatus == '' && e.appriserId !== null) {
                e.r1Status = 'Pending'
            }
            else if (e.appriserIdStatus === 'no' && e.appriserId !== null) {
                e.r1Status = 'Rejected'
            }
            else {
                e.r1Status = 'N/A'
            }
            if (e.reviewerIdStatus === 'yes' && e.reviewerId !== null) {
                e.r2Status = 'Approved'
            }
            else if (e.reviewerIdStatus == '' && e.reviewerId !== null) {
                e.r2Status = 'Pending'
            }
            else if (e.reviewerIdStatus === 'no' && e.reviewerId !== null) {
                e.r2Status = 'Rejected'
            }
            else {
                e.r2Status = 'N/A'
            }

            if (e.managerIdStatus === 'yes' && e.managerId !== null) {
                e.r3Status = 'Approved'
            }

            else if (e.managerIdStatus == '' && e.managerId !== null) {
                e.r3Status = 'Pending'
            }

            else if (e.managerIdStatus === 'no' && e.managerId !== null) {
                e.r3Status = 'Rejected'
            }

            else {
                e.r3Status = 'N/A'
            }

            e.actionList = [
                { actionBy: 'R1', actionByName: await myFunc.getEmployeeNameById(e.appriserId, db), actionStatus: e.r1Status },
                { actionBy: 'R2', actionByName: await myFunc.getEmployeeNameById(e.reviewerId, db), actionStatus: e.r2Status },
                { actionBy: 'R3', actionByName: await myFunc.getEmployeeNameById(e.managerId, db), actionStatus: e.r3Status },
            ]

            const payDetails = await db.query(
                `                             SELECT * FROM eve_blue_gratuity_payment_details
                                              WHERE empId=:empId AND status='A'
                `, {
                replacements: { empId: e.id },
                type: QueryTypes.SELECT
            }
            )

            if (payDetails.length > 0) {
                e.paymentDate = payDetails[0]['dateOfPayment']
                e.paymentMode = payDetails[0]['paymentMode']
                e.paymentBy = await myFunc.getEmployeeNameById(payDetails[0]['paymentBy'], db)
            }

            else {
                e.paymentDate = ''
                e.paymentMode = ''
                e.paymentBy = ''
            }

        }))
        return res.status(200).json({
            status: true,
            result: "success",
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: totalData,
            employee: sqlData
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getGratuityReport }
















