let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')

const getLeaveBalanceReports = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let dbMain = sequelize()

        let data = req.body
        let { month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId } = data

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
        let financialYearFrom
        let financialYearTo

        if (leaveFinancialYear[0].financialYearTypeName == 'Calendar Year') {
            financialYearFrom = year
            financialYearTo = year
        }

        else {
            if (month <= 3) {
                financialYearFrom = `${parseInt(year) - 1}`
                financialYearTo = year

            } else {
                financialYearFrom = year
                financialYearTo = `${parseInt(year) + 1}`

            }
        }



        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_acc_employee
            WHERE status='A'
            AND employeeType='Blue Collar'
            AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
            AND (:empId IS NULL OR id=:empId)
            AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
            AND (:branchId IS NULL OR employeeBranchId=:branchId)
            AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
            AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
            AND (:designationId IS NULL OR employeeDesignationId=:designationId)

            AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth
            






                            AND (employeeCurrentStatus = '' 
                            OR employeeCurrentStatus IS NULL 
                            OR employeeCurrentStatus = 'Active'
                            OR employeeCurrentStatus = 'resignation' 
                            OR employeeCurrentStatus = 'joining'
                            OR employeeCurrentStatus = 'termination'
                            OR employeeCurrentStatus = 'release' 
                            OR employeeCurrentStatus = 'offerletter')
            
            
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
             (@row_number:=@row_number + 1) AS 'slno',
             id AS empId,
             employeeName,
             employeeCode,
             employeeSubCompanyId,
             employeeBranchId,
             employeeDepartmentId,
             employeeSubDepartmentId,
             employeeDesignationId,
             employmentLeaveType,
             employeeDoj

             FROM eve_acc_employee 
             CROSS JOIN (SELECT @row_number := :offset) AS init
             WHERE status='A'
             AND employeeType='Blue Collar'

               AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth

             AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
             AND (:empId IS NULL OR id=:empId)
             AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
               AND (:branchId IS NULL OR employeeBranchId=:branchId)
                 AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
                   AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
                    AND (:designationId IS NULL OR employeeDesignationId=:designationId)


                            AND (employeeCurrentStatus = '' 
                            OR employeeCurrentStatus IS NULL 
                            OR employeeCurrentStatus = 'Active'
                            OR employeeCurrentStatus = 'resignation' 
                            OR employeeCurrentStatus = 'joining'
                            OR employeeCurrentStatus = 'termination'
                            OR employeeCurrentStatus = 'release' 
                            OR employeeCurrentStatus = 'offerletter')

             ORDER BY employeeName               
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
            },
            type: QueryTypes.SELECT
        })
        await Promise.all(getData.map(async e => {
            e['subCompany'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e['branch'] = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e['Department'] = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['subDepartment'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e['designation'] = await myFunc.getDesignationNameById(e.employeeDesignationId, db)


            const leaveSummaryModel = await db.query(`
                        
                        SELECT
                        a.leaveTypeId ,
                        a.takeLeave,
                        a.availableLeave,
                        a.totalLeaveSum,
                       
                        b.name AS leaveTypeName,
                        b.prefix,
                        b.colorCode
                        FROM eve_acc_employee_leave_summary AS a
                        LEFT JOIN eve_acc_leave_type AS b ON a.leaveTypeId=b.id 
                        WHERE a.status='A'
                        AND b.status='A'
                        AND a.empId=:empId
                        AND a.fromDate=:financialYearFrom
                        AND a.toDate=:financialYearTo
                          
                        `, {
                replacements: {
                    empId: e.empId,
                    financialYearFrom: financialYearFrom,
                    financialYearTo: financialYearTo

                },
                type: QueryTypes.SELECT
            })



            console.log(leaveSummaryModel);




            const mergedLeaveDetails = leaveSummaryModel.reduce((acc, current) => {
                if (!acc[current.leaveTypeId]) {
                    acc[current.leaveTypeId] = { ...current, availableLeave: parseInt(current.availableLeave) };
                } else {
                    acc[current.leaveTypeId].availableLeave += parseInt(current.availableLeave);
                }
                return acc;
            }, {});


            let newLeaveData = Object.values(mergedLeaveDetails)
            e.leaveDetails = []
            e.leaveDetails.push(...newLeaveData)













            // const leaveTypeModel = await db.query(`
            //         SELECT

            //          CAST(id AS CHAR) AS id,
            //          name AS leaveTypeName,
            //          prefix,
            //          colorCode,
            //          numberOfDay

            //          FROM eve_acc_leave_type 

            //          WHERE status='A'



            //         `, {
            //     replacements: {


            //     },
            //     type: QueryTypes.SELECT
            // })

            // e.leaveDetails = []
            // e.leaveDetails.push(...leaveTypeModel)

            // const leaveSummaryModel = await db.query(`

            //             SELECT
            //             leaveTypeId,
            //             takeLeave,
            //             availableLeave,
            //             totalLeaveSum
            //             FROM eve_acc_employee_leave_summary
            //             WHERE status='A'
            //             AND empId=:empId
            //             AND fromDate=:financialYearFrom
            //             AND toDate=:financialYearTo

            //             `, {
            //     replacements: {
            //         empId: e.empId,
            //         financialYearFrom: financialYearFrom,
            //         financialYearTo: financialYearTo

            //     },
            //     type: QueryTypes.SELECT
            // })

            // e.leaveDetails.map(x=>{
            //     leaveSummaryModel.map(z=>{

            //         if(x.id==z.leaveTypeId){
            //             x.takeLeave=z.takeLeave
            //             x.availableLeave=z.availableLeave
            //             x.totalLeaveSum=z.totalLeaveSum
            //         }
            //         else{
            //             x.takeLeave=''
            //             x.availableLeave=''
            //             x.totalLeaveSum=''
            //         }
            //     })
            // })
            // const leaveSummaryMap = leaveSummaryModel.reduce((acc, z) => {
            //     acc[z.leaveTypeId] = z;
            //     return acc;
            // }, {});


            // e.leaveDetails.forEach(x => {
            //     if (leaveSummaryMap[x.id]) {
            //         //   x.takeLeave = leaveSummaryMap[x.id].takeLeave;
            //         x.availableLeave = leaveSummaryMap[x.id].availableLeave;
            //         //   x.totalLeaveSum = leaveSummaryMap[x.id].totalLeaveSum;
            //     } else {
            //         //   x.takeLeave = '';
            //         x.availableLeave = '';
            //         //   x.totalLeaveSum = '';
            //     }
            // });

         




        }))

        return res.status(200).json({ status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData, employee: getData });






    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getLeaveBalanceReports }