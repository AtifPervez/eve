let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const serialize = require('php-serialize')
const moment = require('moment');
const getContributions = async (req, res) => {

    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { departmentId, subCompanyId, year, month } = data
        if (month <= 3) {

            year = year.split("-")[1];
        } else {
            year = (year.split("-")[0])
        }

        const nodeSql = await db.query(
            `
                 SELECT 
                       CASE 
        WHEN 
            (YEAR(b.inActiveDate) = a.salaryOfYear AND MONTH(b.inActiveDate) = a.salaryOfMonth)
            OR
            (YEAR(b.employeelastWorkingDate) = a.salaryOfYear AND MONTH(b.employeelastWorkingDate) = a.salaryOfMonth)
        THEN 'Inactive'
        ELSE 'Active'
    END AS empStatus,
                 a.employeeId,
                 b.employeeName,
                 a.salaryOfYear,
                 a.salaryOfMonth,
                 a.wagesType,
                 a.payrollStatus,
                 a.isGenerated,
                 b.employeeSubCompanyId,
                 b.employeeDepartmentId,
                 c.employeeContribution,
                 c.employerContribution,
                 b.inActiveDate,
                 -- YEAR(b.inActiveDate) AS year,
                 -- MONTH(b.inActiveDate) AS month,
                 b.employeelastWorkingDate,
                 b.status,
                 a.salary_types

                 FROM eve_acc_blue_coller_employee_payslip_preview AS a 
                 LEFT JOIN eve_acc_employee AS b ON (a.employeeId = b.id)
                 LEFT JOIN eve_hr_employee_mediclaim AS c ON 
                 (
                        a.employeeId=c.employeeId 
                                AND 
                        a.salaryOfYear=YEAR(c.activationDate)
                                AND
                        a.salaryOfMonth >= MONTH(c.activationDate)
                                AND
                        a.salaryOfMonth <= MONTH(c.exitDate)                
                 )
                 
                 WHERE (a.status = 'A' AND (b.status='A' OR b.status='I'))
                 AND a.isGenerated='yes'
                 -- AND a.payrollStatus='Accept'
                 AND b.employeeName IS NOT NULL

                 AND (
                        b.employeeCurrentStatus = '' 
                        OR 
                        b.employeeCurrentStatus IS NULL 
                        OR 
                        b.employeeCurrentStatus = 'Active'
                        OR 
                        b.employeeCurrentStatus = 'joining'
                        OR 
                        b.employeeCurrentStatus = 'offerletter'
                        OR
                        b.employeeCurrentStatus = 'Inactive'
                        )
                 
                 AND (a.salaryOfYear=:year)
                 AND (a.salaryOfMonth=:month)
                 AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
                 AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)    

                `, {
            replacements:
            {
                subCompanyId: subCompanyId || null,
                departmentId: departmentId || null,
                year: year,
                month: month
            }, type: QueryTypes.SELECT
        })
            
        if (!nodeSql || nodeSql.length === 0) {

            return res.status(200).send({
                status: true,
                result: "success",
                totalData: 0,
                contributionsData:
                    [
                        {
                            label: 'pf',
                            employer: '-',
                            employee: '-',
                            employerIn: '-',
                            employerAc: '-',
                            employeeIn: '-',
                            employeeAc: '-',
                        },
                        {
                            label: 'esic',
                            employer: '-',
                            employee: '-',
                            employerIn: '-',
                            employerAc: '-',
                            employeeIn: '-',
                            employeeAc: '-',
                        },
                        {
                            label: 'mediclaim',
                            employer: '-',
                            employee: '-',
                            employerIn: '-',
                            employerAc: '-',
                            employeeIn: '-',
                            employeeAc: '-',
                        },
                    ]

            });
        }
        let PfEmployerContribution = 0
        let PfEmployeesContribution = 0
        let EsicEmployeesContribution = 0
        let EsicEmployerContribution = 0
        let mediclaimEmployer = 0
        let mediclaimEmployee = 0
        let activePfEmployerArr = []
        let inactivePfEmployerArr = []
        let activePfEmployeeArr = []
        let inactivePfEmployeeArr = []
        let activeEsicEmployerArr = []
        let inactiveEsicEmployerArr = []
        let activeEsicEmployeeArr = []
        let inactiveEsicEmployeeArr = []

        let medEmployerActiveArr = []
        let medEmployerInactiveArr = []
        let medEmployeeActiveArr = []
        let medEmployeeInactiveArr = []

        await Promise.all(nodeSql.map(async (e, i) => {
           
            let salary_types = serialize.unserialize(e.salary_types)
            let additional = salary_types.additionDetails || [];
            let deduction = salary_types.deductionDetails || [];



            if (e['wagesType'] === 'monthly' && e['payrollStatus'] === 'Accept') {
                Object.values(additional).forEach((item) => {

                    if (item.salaryLabel === 'PF(Employer Contribution)') {
                        PfEmployerContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0;

                        if (e.empStatus === 'Inactive') {
                            inactivePfEmployerArr.push(e.employeeId)
                        }
                        else {
                            activePfEmployerArr.push(e.employeeId)
                        }


                    }
                    if (item.salaryLabel === 'ESIC(Employer Contribution)') {
                        EsicEmployerContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0;


                        if (e.empStatus === 'Inactive') {
                            inactiveEsicEmployerArr.push(e.employeeId)
                        }
                        else {
                            activeEsicEmployerArr.push(e.employeeId)
                        }
                    }

                });
                Object.values(deduction).forEach((item) => {
                    if (item.salaryLabel === 'PF(Employees Contribution)') {

                        PfEmployeesContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0;

                        if (e.empStatus === 'Inactive') {
                            inactivePfEmployeeArr.push(e.employeeId)
                        }
                        else {
                            activePfEmployeeArr.push(e.employeeId)
                        }

                    }
                    if (item.salaryLabel === 'ESIC(Employees Contribution)') {
                        EsicEmployeesContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0;


                        if (e.empStatus === 'Inactive') {
                            inactiveEsicEmployeeArr.push(e.employeeId)
                        }
                        else {
                            activeEsicEmployeeArr.push(e.employeeId)
                        }
                    }


                });
            }
            else if (e['wagesType'] === 'dayTOday' && (e['payrollStatus'] === 'Accept' || e['payrollStatus'] === 'Pending')) {
                Object.values(additional).forEach((item) => {

                    if (item.salaryLabel === 'PF(Employer Contribution)') {
                        PfEmployerContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0;

                        if (e.empStatus === 'Inactive') {
                            inactivePfEmployerArr.push(e.employeeId)
                        }
                        else {
                            activePfEmployerArr.push(e.employeeId)
                        }

                    }
                    if (item.salaryLabel === 'ESIC(Employer Contribution)') {
                        EsicEmployerContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0

                        if (e.empStatus === 'Inactive') {
                            inactiveEsicEmployerArr.push(e.employeeId)
                        }
                        else {
                            activeEsicEmployerArr.push(e.employeeId)
                        }
                    }

                });
                Object.values(deduction).forEach((item) => {
                    if (item.salaryLabel === 'PF(Employees Contribution)') {

                        PfEmployeesContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0


                        if (e.empStatus === 'Inactive') {
                            inactivePfEmployeeArr.push(e.employeeId)
                        }
                        else {
                            activePfEmployeeArr.push(e.employeeId)
                        }
                    }
                    if (item.salaryLabel === 'ESIC(Employees Contribution)') {
                        EsicEmployeesContribution += parseFloat((item?.salaryAmount || '0').toString().replace(/,/g, '')) || 0;

                        if (e.empStatus === 'Inactive') {
                            inactiveEsicEmployeeArr.push(e.employeeId)
                        }
                        else {
                            activeEsicEmployeeArr.push(e.employeeId)
                        }
                    }
                });
            }

         
            if (e.employeeContribution !== null) {
                mediclaimEmployee += parseFloat(e['employeeContribution'])

                if (e.empStatus === 'Inactive') {
                    medEmployerInactiveArr.push(e.employeeId)
                } else{
                    medEmployerActiveArr.push(e.employeeId)
                }

            }
            if (e.employerContribution !== null) {
                mediclaimEmployer += parseFloat(e['employerContribution'])

                 if (e.empStatus === 'Inactive') {
                     medEmployeeInactiveArr.push(e.employeeId)
                } else{
                    medEmployeeActiveArr.push(e.employeeId)
                }
            }
        }))
  
        let pfEmployerActiveArr = [...new Set(activePfEmployerArr)]
        let pfEmployerActive = pfEmployerActiveArr.length
        let pfEmployerInactiveArr = [...new Set(inactivePfEmployerArr)]
        let pfEmployerInactive = pfEmployerInactiveArr.length
        let pfEmployeeActiveArr = [...new Set(activePfEmployeeArr)]
        let pfEmployeeActive = pfEmployeeActiveArr.length
        let pfEmployeeInactiveArr = [...new Set(inactivePfEmployeeArr)]
        let pfEmployeeInactive = pfEmployeeInactiveArr.length
        let esicEmployerActiveArr = [...new Set(activeEsicEmployerArr)]
        let esicEmployerActive = esicEmployerActiveArr.length
        let esicEmployerInactiveArr = [...new Set(inactiveEsicEmployerArr)]
        let esicEmployerInactive = esicEmployerInactiveArr.length
        let esicEmployeeActiveArr = [...new Set(activeEsicEmployeeArr)]
        let esicEmployeeActive = esicEmployeeActiveArr.length
        let esicEmployeeInactiveArr = [...new Set(inactiveEsicEmployeeArr)]
        let esicEmployeeInactive = esicEmployeeInactiveArr.length
        let medEmployerActArr=[...new Set(medEmployerActiveArr)]
        let medEmployerActive=medEmployerActArr.length
        let medEmployerinactArr=[...new Set(medEmployerInactiveArr)]
        let medEmployerInactive=medEmployerinactArr.length
        let medEmployeeActArr=[...new Set(medEmployeeActiveArr)]
        let medEmployeeActive=medEmployeeActArr.length
        let medEmployeeinactArr=[...new Set(medEmployeeInactiveArr)]
        let medEmployeeInactive=medEmployeeinactArr.length

      


        PfEmployerContribution = parseFloat(PfEmployerContribution.toFixed(2));
        PfEmployeesContribution = parseFloat(PfEmployeesContribution.toFixed(2));
        EsicEmployerContribution = parseFloat(EsicEmployerContribution.toFixed(2));
        EsicEmployeesContribution = parseFloat(EsicEmployeesContribution.toFixed(2));
        mediclaimEmployee = parseFloat(mediclaimEmployee.toFixed(2))
        mediclaimEmployer = parseFloat(mediclaimEmployer.toFixed(2))
        const contributionsData =
            [
                {
                    label: 'pf',
                    employer: PfEmployerContribution,
                    employee: PfEmployeesContribution,
                    employerAc: pfEmployerActive,
                    employerIn: pfEmployerInactive,
                    employeeAc: pfEmployeeActive,
                    employeeIn: pfEmployeeInactive,
                },

                {
                    label: 'esic',
                    employer: EsicEmployerContribution,
                    employee: EsicEmployeesContribution,
                    employerAc: esicEmployerActive,
                    employerIn: esicEmployerInactive,
                    employeeAc: esicEmployeeActive,
                    employeeIn: esicEmployeeInactive,
                },
                {
                    label: 'mediclaim',
                    employer: mediclaimEmployer,
                    employee: mediclaimEmployee,
                    employerAc: medEmployerActive,
                    employerIn: medEmployerInactive,
                    employeeAc: medEmployeeActive,
                    employeeIn: medEmployeeInactive,

                },
            ];

        return res.status(200).send({
            status: true,
            result: "success",
            totalData: nodeSql.length,
            contributionsData: contributionsData

        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getContributions }

