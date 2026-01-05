let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const moment = require('moment');
const phpUnserialize = require('php-serialize');
const myFunc = require('../../../functions/functions');




const getAttritionReport = async (req, res) => {
    try {

        const decodedToken = req.headerSession;
        const userId = decodedToken.userId;
        const companyId = decodedToken.companyId;
        const branch_Id = decodedToken.branchId;
        const mainUserId = decodedToken.mainUserId;
        let db = sequelize(companyId);

        let data = req.body;
        let { joiningDesignationId, tenure,empId, subCompId, branchId, departmentId, subDepartmentId, designationId, r1Id, r2Id, r3Id, resignStatus, pfApplicable, esicApplicable } = data

        let countQuery = await db.query(`
             SELECT COUNT(*) AS total
             FROM eve_employee_resignation_list AS resignation
             
             LEFT JOIN eve_acc_employee AS emp ON emp.id=resignation.empId

             WHERE resignation.status='A'

             AND (:joiningDesignationId IS NULL OR emp.employeeDesignationId=:joiningDesignationId)
             AND (:empId IS NULL OR resignation.empId = :empId )
             AND (:employeeSubCompanyId IS NULL OR emp.employeeSubCompanyId=:employeeSubCompanyId)
             AND (:employeeBranchId IS NULL OR emp.employeeBranchId=:employeeBranchId)
             AND (:employeeDepartmentId IS NULL OR emp.employeeDepartmentId=:employeeDepartmentId)
             AND (:employeeSubDepartmentId IS NULL OR emp.employeeSubDepartmentId=:employeeSubDepartmentId)
             AND (:employeeDesignationId IS NULL OR emp.employeeDesignationId=:employeeDesignationId)
             AND (:r1Id IS NULL OR resignation.r1Id=:r1Id)
             AND (:r2Id IS NULL OR resignation.r2Id=:r2Id)
             AND (:r3Id IS NULL OR resignation.r3Id=:r3Id)
             AND (:tenure IS NULL OR CONCAT(DATEDIFF(resignation.lastWorkingDate, emp.employeeDoj) +1)=:tenure)

            AND (:resignStatus IS NULL OR resignation.resignStatus = 
                CASE 
                WHEN :resignStatus = 'Accepted' THEN 'A'
                WHEN :resignStatus = 'Pending' THEN 'W'
                WHEN :resignStatus = 'Rejected' THEN 'C'
                ELSE null
            END ) 

                                                AND (emp.employeeCurrentStatus = '' 
                                       OR emp.employeeCurrentStatus IS NULL 
                                       OR emp.employeeCurrentStatus = 'Active'
                                       
                                       OR emp.employeeCurrentStatus = 'joining'
                                       
                                        
                                       OR emp.employeeCurrentStatus = 'offerletter')

           
             

            `, {
            replacements: {

                joiningDesignationId: joiningDesignationId || null,
                empId: empId || null,
                employeeSubCompanyId: subCompId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                employeeDesignationId: designationId || null,
                r1Id: r1Id || null,
                r2Id: r2Id || null,
                r3Id: r3Id || null,
                resignStatus: resignStatus || null,
                pfApplicable: pfApplicable || null,
                esicApplicable: esicApplicable || null,
                tenure: tenure || null,


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

            (@row_number:=@row_number + 1) AS slno,

            resignation.empId,
            emp.employeeName,

          

            emp.employeeCode,
            emp.employeeSubCompanyId,
            emp.employeeBranchId,
            emp.employeeDepartmentId,
            emp.employeeSubDepartmentId,
            emp.employeeDesignationId,
            emp.employeeDesignationId AS joiningDesignationId,
            emp.salaryTemplateId,
            salaryTemplate.templateName,
            salaryTemplate.templateType,
          
            resignation.r1Id,
            resignation.r1Status,
            resignation.r2Id,
            resignation.r2Status,
            resignation.r3Id,
            resignation.r3Status,
            resignation.isR1Visible,
            resignation.isR2Visible,
            resignation.isR3Visible,
            resignation.approvalRequired,

            CASE 
                WHEN resignation.resignStatus = 'A' THEN 'Accepted'
                WHEN resignation.resignStatus = 'W' THEN 'Pending'
                WHEN resignation.resignStatus = 'C' THEN 'Rejected'
                ELSE resignation.resignStatus
                END AS resignStatus,
            
            DATE_FORMAT(emp.employeeDoj,'%d-%m-%Y') AS doj,
            DATE_FORMAT(resignation.lastWorkingDate,'%d-%m-%Y') AS lastWorkingDate,
            CONCAT(DATEDIFF(resignation.lastWorkingDate, emp.employeeDoj) +1, ' Days') AS tenure,
            DATE_FORMAT(resignation.resignationDate,'%d-%m-%Y') AS dateOfResignation,
            CONCAT((resignation.noticePeriod),' Days') AS noticePeriodDays,

            resignation.AppointednoticePeriod,
            resignation.resignationLetter,
            resignation.approvalDate,
            resignation.resignationLetter AS ReasonForResignation,
            resignation.assetDamagedAmount AS damagedAssetsPenalty, 
            resignation.noticePeriodPenaltyAmt AS noticePeriodPenalty	 

            FROM eve_employee_resignation_list AS resignation

            LEFT JOIN eve_acc_employee AS emp ON emp.id=resignation.empId
            LEFT JOIN eve_acc_company_salary_components AS salaryTemplate ON emp.salaryTemplateId=salaryTemplate.id
            

            CROSS JOIN (SELECT @row_number := :offset) AS init
            WHERE resignation.status='A'

            AND (:joiningDesignationId IS NULL OR emp.employeeDesignationId=:joiningDesignationId)
            AND (:empId IS NULL OR resignation.empId=:empId )
            AND (:employeeSubCompanyId IS NULL OR emp.employeeSubCompanyId=:employeeSubCompanyId)
            AND (:employeeBranchId IS NULL OR emp.employeeBranchId=:employeeBranchId)
            AND (:employeeDepartmentId IS NULL OR emp.employeeDepartmentId=:employeeDepartmentId)
            AND (:employeeSubDepartmentId IS NULL OR emp.employeeSubDepartmentId=:employeeSubDepartmentId)
            AND (:employeeDesignationId IS NULL OR emp.employeeDesignationId=:employeeDesignationId)
            AND (:r1Id IS NULL OR resignation.r1Id=:r1Id)
            AND (:r2Id IS NULL OR resignation.r2Id=:r2Id)
            AND (:r3Id IS NULL OR resignation.r3Id=:r3Id)
            AND (:tenure IS NULL OR CONCAT(DATEDIFF(resignation.lastWorkingDate, emp.employeeDoj) +1)=:tenure)

          AND (:resignStatus IS NULL OR resignation.resignStatus = 
               CASE 
               WHEN :resignStatus = 'Accepted' THEN 'A'
               WHEN :resignStatus = 'Pending' THEN 'W'
               WHEN :resignStatus = 'Rejected' THEN 'C'
               ELSE null
               END )


                                                       AND (emp.employeeCurrentStatus = '' 
                                       OR emp.employeeCurrentStatus IS NULL 
                                       OR emp.employeeCurrentStatus = 'Active'
                                       
                                       OR emp.employeeCurrentStatus = 'joining'
                                       
                                        
                                       OR emp.employeeCurrentStatus = 'offerletter')

            LIMIT :limit
            OFFSET :offset
            `, {
            replacements: {

                limit: limit,
                offset: offset,
                joiningDesignationId: joiningDesignationId || null,
                empId: empId || null,
                employeeSubCompanyId: subCompId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                employeeDesignationId: designationId || null,
                r1Id: r1Id || null,
                r2Id: r2Id || null,
                r3Id: r3Id || null,
                resignStatus: resignStatus || null,
                pfApplicable: pfApplicable || null,
                esicApplicable: esicApplicable || null,
                tenure: tenure || null,

            },
            type: QueryTypes.SELECT
        })

        await Promise.all(getData.map(async e => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.joiningDesignation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.damagedAssetsPenalty=e.damagedAssetsPenalty!==null?(parseFloat(e.damagedAssetsPenalty).toFixed(2)):''
            e.noticePeriodPenalty=e.noticePeriodPenalty!==null?(parseFloat(e.noticePeriodPenalty).toFixed(2)):''
            e.r1 = await myFunc.getEmployeeNameById(e.r1Id, db)
            e.r2 = await myFunc.getEmployeeNameById(e.r2Id, db)
            e.r3 = await myFunc.getEmployeeNameById(e.r3Id, db)
            e.ctc = ''
            e.grossSalary = ''
            e.netSalary = ''


            let PFEmployeesContribution = await db.query(`
                SELECT templateId,status
                FROM eve_acc_company_salary_structure_new
                WHERE templateId=:templateId
                AND salaryLabel='PF(Employees Contribution)'
              
                `, {
                replacements: {
                    templateId: e.salaryTemplateId,
                },
                type: QueryTypes.SELECT
            })


            if (PFEmployeesContribution.length != 0) {
                e.PFEmployeesContributionStatus = PFEmployeesContribution[0]['status']
            }


            let PFEmployerContribution = await db.query(`
                SELECT templateId,status
                FROM eve_acc_company_salary_structure_new
                WHERE templateId=:templateId
                AND salaryLabel='PF(Employer Contribution)'
             
                `, {
                replacements: {
                    templateId: e.salaryTemplateId,
                },
                type: QueryTypes.SELECT
            })

            if (PFEmployerContribution.length != 0) {
                e.PFEmployerContributionStatus = PFEmployerContribution[0]['status']
            }


            let ESICEmployeesContribution = await db.query(`
                SELECT templateId,status
                FROM eve_acc_company_salary_structure_new
                
                WHERE templateId=:templateId
                AND salaryLabel='ESIC(Employees Contribution)'
               
                `, {
                replacements: {
                    templateId: e.salaryTemplateId,
                },
                type: QueryTypes.SELECT
            })

            if (ESICEmployeesContribution.length != 0) {
                e.ESICEmployeesContributionStatus = ESICEmployeesContribution[0]['status']
            }

            let ESICEmployerContribution = await db.query(`
                    SELECT templateId,status
                    FROM eve_acc_company_salary_structure_new
                    
                    WHERE templateId=:templateId
                    AND salaryLabel='ESIC(Employer Contribution)'
                  
                    `, {
                replacements: {
                    templateId: e.salaryTemplateId,
                },
                type: QueryTypes.SELECT
            })

            if (ESICEmployerContribution.length != 0) {
                e.ESICEmployerContributionStatus = ESICEmployerContribution[0]['status']
            }

            if (e.PFEmployeesContributionStatus === 'A' || e.PFEmployerContributionStatus === 'A') {
                e.pfApplicable = 'Yes'
            }
            else {
                e.pfApplicable = 'No'
            }
            if (e.ESICEmployeesContributionStatus === 'A' || e.ESICEmployerContributionStatus === 'A') {
                e.esicApplicable = 'Yes'
            }
            else {
                e.esicApplicable = 'No'
            }
        }))



        if (pfApplicable || esicApplicable) {
            let searchData = {
                esicApplicable: esicApplicable,
                pfApplicable: pfApplicable,
            };

            getData = getData.filter((e, i) => {
               
                let boo = true;
                for (let key in searchData) {
                    if (searchData[key] && searchData[key] !== e[key]) {
                        boo = false;
                        break;
                    }
                }
                return boo;
            });
            getData.map((e, i) => e.slno = i + 1)

            return res.status(200).json({
                status: true,
                pageNo: pageNo,
                recordedPerPage: limit,
                totalData: getData.length,
                employee: getData
            });
        }


        res.status(200).json({
            status: true,
            pageNo: pageNo,
            recordedPerPage: limit,
            totalData: totalData,
            employee: getData
        });

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack });
    }
};
module.exports = { getAttritionReport }

