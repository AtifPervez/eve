let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
// eve_custom_salary_componnet

const getCustomComponentReports = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId, locationId,componentId } = data

        let leaveFinancialYear = await db.query(`
            SELECT * 
            FROM eve_acc_leave_financial_year_master 
            WHERE status='A'`,
            {
                replacements: {

                },
                type: QueryTypes.SELECT
            }
        )
        if (leaveFinancialYear[0].financialYearTypeName == 'Calendar Year') {
            year = (year.split("-")[0])
        }
        else {
            if (month <= 3) {
                year = year.split("-")[1];
            } else {
                year = (year.split("-")[0])
            }
        }

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_acc_employee AS a
             LEFT JOIN eve_acc_custom_salary_set_payroll AS b ON (a.id=b.empId AND b.status='A')
             WHERE a.status='A'
                 AND (employeeType ='' OR employeeType IS NULL OR employeeType='White Collar')

               -- AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth

             AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
             AND (:empId IS NULL OR a.id=:empId)
             AND (:subCompanyId IS NULL OR a.employeeSubCompanyId=:subCompanyId)
               AND (:branchId IS NULL OR a.employeeBranchId=:branchId)
                 AND (:departmentId IS NULL OR a.employeeDepartmentId=:departmentId)
                   AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId=:subDepartmentId)
                    AND (:designationId IS NULL OR a.employeeDesignationId=:designationId)
                   AND (:locationId IS NULL OR a.locationID=:locationId)
                   AND (:componentId IS NULL OR b.salaryLabel=:componentId)


                            AND (a.employeeCurrentStatus = '' 
                            OR a.employeeCurrentStatus IS NULL 
                            OR a.employeeCurrentStatus = 'Active'
                            OR a.employeeCurrentStatus = 'resignation' 
                            OR a.employeeCurrentStatus = 'joining'
                            OR a.employeeCurrentStatus = 'termination'
                            OR a.employeeCurrentStatus = 'release' 
                            OR a.employeeCurrentStatus = 'offerletter')

                           AND b.year=:year
                           AND FIND_IN_SET(:month, b.monthArr)

                            AND b.monthArr IS NOT NULL
                            AND b.year IS NOT NULL
            
            
`, {
            replacements: {
                employeeCode: empCode || null,
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,
                subDepartmentId: subDepartmentId || null,
                designationId: designationId || null,
                yearMonth: year + '-' + month,
                year: year,
                month: month,
                locationId: locationId || null,
                 componentId: componentId || null,

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
             a.id,
             a.employeeName,
             a.employeeCode,
             a.employeeSubCompanyId,
             a.employeeBranchId,
             a.employeeDepartmentId,
             a.employeeSubDepartmentId,
             a.employeeDesignationId,
             a.locationID AS locationId,
             -- a.employmentLeaveType,
             -- a.employeeDoj,
             b.salaryType AS componentType,
             b.monthArr,b.year,
             b.amount,b.remarks,
             b.salaryLabel AS componentId,
             c.componentName,
             b.createdBy

             FROM eve_acc_employee AS a
             LEFT JOIN eve_acc_custom_salary_set_payroll AS b ON (a.id=b.empId AND b.status='A')
           

           LEFT JOIN eve_custom_salary_componnet AS c  
           ON (b.salaryLabel=c.id AND b.templateId IS NOT NULL AND b.templateId != '')

            
             WHERE a.status='A'
             AND (employeeType ='' OR employeeType IS NULL OR employeeType='White Collar')

               -- AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth

             AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
             AND (:empId IS NULL OR a.id=:empId)
             AND (:subCompanyId IS NULL OR a.employeeSubCompanyId=:subCompanyId)
               AND (:branchId IS NULL OR a.employeeBranchId=:branchId)
                 AND (:departmentId IS NULL OR a.employeeDepartmentId=:departmentId)
                   AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId=:subDepartmentId)
                    AND (:designationId IS NULL OR a.employeeDesignationId=:designationId)
                      AND (:locationId IS NULL OR a.locationID=:locationId)
                        AND (:componentId IS NULL OR b.salaryLabel=:componentId)



                            AND (a.employeeCurrentStatus = '' 
                            OR a.employeeCurrentStatus IS NULL 
                            OR a.employeeCurrentStatus = 'Active'
                            OR a.employeeCurrentStatus = 'resignation' 
                            OR a.employeeCurrentStatus = 'joining'
                            OR a.employeeCurrentStatus = 'termination'
                            OR a.employeeCurrentStatus = 'release' 
                            OR a.employeeCurrentStatus = 'offerletter')

                           AND b.year=:year
                           AND FIND_IN_SET(:month, b.monthArr)

             ORDER BY a.employeeName               
             LIMIT :limit
             OFFSET :offset  

            `, {
            replacements: {
                limit: limit,
                offset: offset,
                employeeCode: empCode || null,
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,
                subDepartmentId: subDepartmentId || null,
                designationId: designationId || null,
                yearMonth: year + '-' + month,
                year: year,
                month: month,
                locationId: locationId || null,
                componentId: componentId || null,
            },
            type: QueryTypes.SELECT
        })
        await Promise.all(getData.map(async (e, i) => {
            e.slno = offset + i + 1
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.locationName = await myFunc.getLocationNameById(e.locationId, db)
            e.addedBy = await myFunc.getEmployeeNameById(e.createdBy, db)
            e.componentType=capitalizeFirstLetter(e.componentType)


        }))
        //  status: true,
        //     pageNo: pageNo,
        //     recordedPerPage: limit,
        //     totalData: totalData,
        //     total: total,
        //     pending: pending,
        //     totalApplied: totalApplied,
        //     totalApproved: totalApproved,
        //     totalRejected: totalRejected,
        //     totalClosingBalance: totalClosingBalance,
        //     employee: getData
        return res.status(200).send({ 
            result: 'success',
            recordPerPage: limit,
            currentPage: pageNo,
            totalData: totalData,
            employeeList: getData 
            })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getCustomComponentReports }

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

