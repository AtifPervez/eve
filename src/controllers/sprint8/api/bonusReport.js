let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const phpUnserialize = require('php-serialize')
const myFunc = require('../../../functions/functions')
const getBonusReport = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId

        let db = sequelize(tokenCompanyId)

        let data = req.body

        let { yearFrom, yearTo, empCode, empId, subCompanyId, branchId, departmentId, designationId, bonusLabel, appliedMonths, addToPayslip, payrollGenerated } = data

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
           
            FROM eve_acc_employee AS emp
            LEFT JOIN eve_employee_bonus_payble_details AS bonus
            ON emp.id=bonus.employeeId

              
       
            WHERE emp.status='A'

            AND bonus.status='A'

           

           
               
            AND emp.employeeType='Blue Collar'

            AND (YEAR(bonus.createdDate) = :yearFrom OR YEAR(bonus.createdDate) = :yearTo)

            AND (:employeeCode IS NULL OR emp.employeeCode=:employeeCode)

            AND (:empId IS NULL OR emp.id=:empId)

            AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId=:subCompanyId)
            AND (:branchId IS NULL OR emp.employeeBranchId=:branchId)
            AND (:departmentId IS NULL OR emp.employeeDepartmentId=:departmentId)
          
            AND (:designationId IS NULL OR emp.employeeDesignationId=:designationId)

               AND (:bonusLabel IS NULL OR bonus.bonusLabel=:bonusLabel)

                 AND (:appliedMonths IS NULL OR   LPAD(bonus.appliedMonths, 2, '0') = :appliedMonths)
                 AND (:addToPayslip IS NULL OR   bonus.addToPayslip = :addToPayslip)
                  AND (:payrollGenerated IS NULL OR   bonus.addToPayslip = :payrollGenerated)
             

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
                yearFrom: yearFrom,
                yearTo: yearTo,
                employeeCode: empCode || null,
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,

                designationId: designationId || null,
                bonusLabel: bonusLabel || null,
                appliedMonths: appliedMonths || null,
                addToPayslip: addToPayslip || null,
                payrollGenerated: payrollGenerated || null,

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

               

            emp.id AS empId,
            emp.employeeName AS name,
            emp.employeeBranchId AS branchId,
            emp.employeeDesignationId AS designationId,
            emp.employeeDepartmentId AS departmentId,
            emp.employeeCode,
            emp.employeeSubcompanyId AS subCompanyId,
            emp.employeeSubDepartmentId AS subDepartmentId,
            bonus.id AS bonusId,
            bonus.bonusLabel,
           LPAD(bonus.appliedMonths, 2, '0') AS appliedMonths,
            bonus.addToPayslip,
            bonus.addToPayslip AS payrollGenerated,
          
            CAST(YEAR(bonus.createdDate) AS CHAR) AS year
            
          
            

            FROM eve_acc_employee AS emp
            LEFT JOIN eve_employee_bonus_payble_details AS bonus ON emp.id=bonus.employeeId
         
         
          
                
             

            WHERE emp.status='A'
            AND bonus.status='A'
          
          
          

                          AND emp.employeeType='Blue Collar'

              AND (:employeeCode IS NULL OR emp.employeeCode=:employeeCode)

            AND (:empId IS NULL OR emp.id=:empId)

            AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId=:subCompanyId)

            AND (:branchId IS NULL OR emp.employeeBranchId=:branchId)
            AND (:departmentId IS NULL OR emp.employeeDepartmentId=:departmentId)
        
            AND (:designationId IS NULL OR emp.employeeDesignationId=:designationId)

            AND (:bonusLabel IS NULL OR bonus.bonusLabel=:bonusLabel)

            AND (:appliedMonths IS NULL OR   LPAD(bonus.appliedMonths, 2, '0') = :appliedMonths)

              AND (:addToPayslip IS NULL OR   bonus.addToPayslip = :addToPayslip)
              AND (:payrollGenerated IS NULL OR   bonus.addToPayslip = :payrollGenerated)

             


            AND (YEAR(bonus.createdDate) = :yearFrom OR YEAR(bonus.createdDate) = :yearTo)

            AND (employeeCurrentStatus = '' 
            OR employeeCurrentStatus IS NULL 
            OR employeeCurrentStatus = 'Active'
            OR employeeCurrentStatus = 'resignation' 
            OR employeeCurrentStatus = 'joining'
            OR employeeCurrentStatus = 'termination'
            OR employeeCurrentStatus = 'release' 
            OR employeeCurrentStatus = 'offerletter')
            ORDER BY emp.employeeName
              LIMIT :limit
             OFFSET :offset  
            `,
            {
                replacements: {
                    limit: limit,
                    offset: offset,
                    yearFrom: yearFrom,
                    yearTo: yearTo,
                    employeeCode: empCode || null,
                    empId: empId || null,
                    subCompanyId: subCompanyId || null,
                    branchId: branchId || null,
                    departmentId: departmentId || null,

                    designationId: designationId || null,
                    bonusLabel: bonusLabel || null,
                    appliedMonths: appliedMonths || null,
                    addToPayslip: addToPayslip || null,
                    payrollGenerated: payrollGenerated || null,


                },
                type: QueryTypes.SELECT
            })


        let jan = 0, feb = 0, march = 0, apr = 0, may = 0, june = 0, july = 0, aug = 0, sep = 0, oct = 0, nov = 0, dec = 0

        const months = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];

        let slno = offset + 1


        await Promise.all(getData.map(async (e, i) => {

            e.componentToConsider = ''
            e.bonusAmount = ''
            // e.payRollGenerated = 'no'
            e.slno = slno + i
            e.branchName = await myFunc.getBranchNameByBranchId(e.branchId, db)
            e.designationName = await myFunc.getDesignationNameById(e.designationId, db)
            e.departmentName = await myFunc.departmentNameByDepartmentId(e.departmentId, db)
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.subCompanyId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.subDepartmentId, db)
            e.bonusLabel = e.bonusLabel === null ? '' : e.bonusLabel
            e.appliedMonths = e.appliedMonths === null ? '' : e.appliedMonths
            e.addToPayslip = e.addToPayslip === null ? '' : e.addToPayslip
            e.employeeCode = e.employeeCode === null ? '' : e.employeeCode
            if (e.appliedMonths != '') {

                e.appliedMonthsName = myFunc.convertMonthName(e.appliedMonths)
            }
            else {
                e.appliedMonthsName = ''
            }

            const bonusMasterModel = await db.query(`
                SELECT bonusDetails FROM eve_employee_bonus_master
                WHERE status='A'
                AND subCompanyId=:subCompanyId
                AND branchId=:branchId
                `, {
                replacements: {
                    subCompanyId: e.subCompanyId,
                    branchId: e.branchId,

                },
                type: QueryTypes.SELECT
            })




            if (bonusMasterModel.length > 0 && bonusMasterModel[0].bonusDetails) {

                let bonusMaster = phpUnserialize.unserialize(bonusMasterModel[0].bonusDetails)



                bonusMaster.map((x) => {
                    if (x.appliedOn) {
                        e.appliedOn = x.appliedOn[0]
                    }
                    if (e.bonusLabel == x.bonusLabel && x.calculatedOn === 'percentage') {
                        e.componentToConsider = `${x.bonusPercent}% of(${e.appliedOn})`
                    }
                    else if (e.bonusLabel == x.bonusLabel && x.calculatedOn === 'amount') {

                        e.bonusAmount = x.bonusAmount
                    }

                })
            }




            const paySlipModel = await db.query(`
            SELECT salary_types,isGenerated
            FROM eve_acc_blue_coller_employee_payslip_preview
            WHERE status='A'
            AND employeeId=:employeeId
            AND salaryOfMonth=:salaryOfMonth
            AND salaryOfYear=:salaryOfYear
            `, {
                replacements: {
                    employeeId: e.empId,
                    salaryOfMonth: e.appliedMonths,
                    salaryOfYear: e.year
                },
                type: QueryTypes.SELECT
            })

            if (paySlipModel.length > 0 && paySlipModel[0].salary_types) {
                // e.payRollGenerated = paySlipModel[0]['isGenerated']
                let paySlip = phpUnserialize.unserialize(paySlipModel[0].salary_types)

                let salaryData = paySlip.additionDetails


                for (const key in salaryData) {
                    if (salaryData.hasOwnProperty(key)) {
                        const item = salaryData[key];
                        if (item.salaryLabel === 'Bonus') {
                            e.bonusAmount = item.salaryAmount;
                        }
                        if (item.salaryLabel === e.appliedOn) {
                            e.totalamountComponentsSelected12months = item.salaryAmount;
                        }

                    }
                }
            }


            if (!e.totalamountComponentsSelected12months) {
                e.totalamountComponentsSelected12months = ''
            }

            months.forEach((month, index) => {
                e[month] = 0;
            });

            if (e.hasOwnProperty("appliedMonths") && e.appliedMonths != '' && e.bonusAmount) {
                let appliedMonthIndex = parseFloat(e["appliedMonths"]) - 1;
                let appliedMonth = months[appliedMonthIndex];
                e[appliedMonth] = parseFloat(e["bonusAmount"]);
            }

            let totalAmount = 0

            jan += e.January
            totalAmount += e.January
            e.January = myFunc.formatAmount(e.January)

            feb += e.February
            totalAmount += e.February
            e.February = myFunc.formatAmount(e.February)

            march += e.March
            totalAmount += e.March
            e.March = myFunc.formatAmount(e.March)

            apr += e.April
            totalAmount += e.April
            e.April = myFunc.formatAmount(e.April)

            may += e.May
            totalAmount += e.May
            e.May = myFunc.formatAmount(e.May)

            june += e.June
            totalAmount += e.June
            e.June = myFunc.formatAmount(e.June)

            july += e.July
            totalAmount += e.July
            e.July = myFunc.formatAmount(e.July)

            aug += e.August
            totalAmount += e.August
            e.August = myFunc.formatAmount(e.August)

            sep += e.September
            totalAmount += e.September
            e.September = myFunc.formatAmount(e.September)

            oct += e.October
            totalAmount += e.October
            e.October = myFunc.formatAmount(e.October)

            nov += e.November
            totalAmount += e.November
            e.November = myFunc.formatAmount(e.November)

            dec += e.December
            totalAmount += e.December
            e.December = myFunc.formatAmount(e.December)

            e.totalBonusAmount = myFunc.formatAmount((totalAmount))
            e.bonusAmount = myFunc.formatAmount(e.bonusAmount)

            
        }))

       
  
    

        return res.status(200).json({
            status: true,
            pageNo: pageNo,
            recordedPerPage: limit,
            totalData: totalData,
            employee: myFunc.replaceEmptyValuesApi(getData)
        });

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getBonusReport }