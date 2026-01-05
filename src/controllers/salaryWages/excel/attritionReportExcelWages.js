let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');

const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')

const getAttritionReportExcelWages = async (req, res) => {
    try {

        // const decodedToken = req.headerSession;
        // const userId = decodedToken.userId;
        // const companyId = decodedToken.companyId;
        // const branch_Id = decodedToken.branchId;
        // const mainUserId = decodedToken.mainUserId;
        // let db = sequelize(companyId);
        let db = sequelize('59');

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
        // await Promise.all(getData.map(async e => {

        //     e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
        //     e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
        //     e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
        //     e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
        //     e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
        //     e.joiningDesignation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
        //     e.damagedAssetsPenalty=e.damagedAssetsPenalty!==null?(parseFloat(e.damagedAssetsPenalty).toFixed(2)):''
        //     e.noticePeriodPenalty=e.noticePeriodPenalty!==null?(parseFloat(e.noticePeriodPenalty).toFixed(2)):''
        //     e.r1 = await myFunc.getEmployeeNameById(e.r1Id, db)
        //     e.r2 = await myFunc.getEmployeeNameById(e.r2Id, db)
        //     e.r3 = await myFunc.getEmployeeNameById(e.r3Id, db)
        //     e.ctc=''
        //     e.grossSalary=''
        //     e.netSalary=''


        //     let PFEmployeesContribution = await db.query(`
        //         SELECT templateId,status
        //         FROM eve_acc_company_salary_structure_new
        //         WHERE templateId=:templateId
        //         AND salaryLabel='PF(Employees Contribution)'
              
        //         `, {
        //         replacements: {
        //             templateId: e.salaryTemplateId,
        //         },
        //         type: QueryTypes.SELECT
        //     })


        //     if (PFEmployeesContribution.length != 0) {
        //         e.PFEmployeesContributionStatus = PFEmployeesContribution[0]['status']
        //     }


        //     let PFEmployerContribution = await db.query(`
        //         SELECT templateId,status
        //         FROM eve_acc_company_salary_structure_new
        //         WHERE templateId=:templateId
        //         AND salaryLabel='PF(Employer Contribution)'
             
        //         `, {
        //         replacements: {
        //             templateId: e.salaryTemplateId,
        //         },
        //         type: QueryTypes.SELECT
        //     })

        //     if (PFEmployerContribution.length != 0) {
        //         e.PFEmployerContributionStatus = PFEmployerContribution[0]['status']
        //     }


        //     let ESICEmployeesContribution = await db.query(`
        //         SELECT templateId,status
        //         FROM eve_acc_company_salary_structure_new
                
        //         WHERE templateId=:templateId
        //         AND salaryLabel='ESIC(Employees Contribution)'
               
        //         `, {
        //         replacements: {
        //             templateId: e.salaryTemplateId,
        //         },
        //         type: QueryTypes.SELECT
        //     })

        //     if (ESICEmployeesContribution.length != 0) {
        //         e.ESICEmployeesContributionStatus = ESICEmployeesContribution[0]['status']
        //     }

        //     let ESICEmployerContribution = await db.query(`
        //             SELECT templateId,status
        //             FROM eve_acc_company_salary_structure_new
                    
        //             WHERE templateId=:templateId
        //             AND salaryLabel='ESIC(Employer Contribution)'
                  
        //             `, {
        //         replacements: {
        //             templateId: e.salaryTemplateId,
        //         },
        //         type: QueryTypes.SELECT
        //     })

        //     if (ESICEmployerContribution.length != 0) {
        //         e.ESICEmployerContributionStatus = ESICEmployerContribution[0]['status']
        //     }

        //     if (e.PFEmployeesContributionStatus === 'A' || e.PFEmployerContributionStatus === 'A') {
        //         e.pfApplicable = 'Yes'
        //     }
        //     else {
        //         e.pfApplicable = 'No'
        //     }
        //     if (e.ESICEmployeesContributionStatus === 'A' || e.ESICEmployerContributionStatus === 'A') {
        //         e.esicApplicable = 'Yes'
        //     }
        //     else {
        //         e.esicApplicable = 'No'
        //     }
        // }))


      
        // if (pfApplicable || esicApplicable) {
        //     let searchData = {
        //         esicApplicable: esicApplicable,
        //         pfApplicable: pfApplicable,
        //     };

        //     getData = getData.filter(e => {
        //         let boo = true;
        //         for (let key in searchData) {
        //             if (searchData[key] && searchData[key] !== e[key]) {
        //                 boo = false;
        //                 break;
        //             }
        //         }
        //         return boo;
        //     });
        //     getData.map((e, i) => e.slno = i + 1)

        //     return res.status(200).json({
        //         status: true,
        //         pageNo: pageNo,
        //         recordedPerPage: limit,
        //         totalData: getData.length,
        //         employee: getData
        //     });
        // }
        let attritionReportExcel=getData.map(e=>({
            'Sl. No.':e.slno,
            'DOJ':e.doj,
            'Joining Designation':e.designationName,
            'Employee Name':e.employeeName,
            'Sub Company':e.subCompanyName,
            'Branch':e.branchName,
            'Department':e.departmentName,
            'Sub Department':e.subDepartmentName,
            'Designation':e.designationName,
            'Last Working Day':e.lastWorkingDate,
            'Tenure':e.tenure,
            'R1':e.r1,
            'R2':e.r2,
            'R3':e.r3,
            'Date Of Resignation':e.dateOfResignation,
            'Reason For Resignation':e.ReasonForResignation,
            'Resignation Status':e.resignStatus,
            'Notice Period Days':e.noticePeriodDays,
            'PF Applicable':e.pfApplicable,
            'ESIC Applicable':e.esicApplicable,
            'Damaged Assets Penalty':e.damagedAssetsPenalty,
            'Notice Period Penalty':e.noticePeriodPenalty,
            'CTC':'',
            'Gross Salary':'',
            'Net Salary':''
        }))


        res.status(200).json({
            status: true,
            pageNo: pageNo,
            recordedPerPage: limit,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(attritionReportExcel)
        });

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack });
    }
}

async function fetchData({token, pageNo, limit, joiningDesignationId,tenure, empId, subCompId, branchId, locationId, departmentId, subDepartmentId, designationId,r1Id,r2Id,r3Id,resignStatus,pfApplicable,esicApplicable }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: 'http://localhost:3000/reports/getAttritionReportExcel',
            // url:'https://www.ntest.eveserver.ind.in/reports/getAttritionReportExcel',

            data: { token, pageNo, limit, joiningDesignationId,tenure, empId, subCompId, branchId, locationId, departmentId, subDepartmentId, designationId,r1Id,r2Id,r3Id,resignStatus,pfApplicable,esicApplicable }

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

    // let amountIndex = header.indexOf('Amount(₹)')
    // let quantityIndex = header.indexOf('Quantity')
    // let len = header.length
    // let row = new Array(len).fill('')
   
    // row[amountIndex]=data['Total Amount']
    // row[quantityIndex]=data['Total Quantity']
    // values.push(row)
  
   
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
            row.height = 40

        });
    });
    headerRow.eachCell(cell => {
        
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    for (let i = 1; i <= 1000; i++) {
        const column = worksheet.getColumn(i);
        column.width = 20; // Set the desired width in characters
    }
    

    // //totalAmount Bold 
    // const lastRow = worksheet.lastRow;

    // lastRow.eachCell((cell, colNumber) => {
    //     cell.font = { bold: true };
    // });
    return workbook.xlsx



}

async function getAttritionReportExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let joiningDesignationId = req.body.joiningDesignationId || req.query.joiningDesignationId
        let tenure = req.body.tenure || req.query.tenure

        let empId = req.body.empName || req.query.empName
        let subCompId = req.body.subCompId || req.query.subCompId
        let branchId = req.body.branchId || req.query.branchId
       
        let departmentId = req.body.departmentId || req.query.departmentId
        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId
        let designationId = req.body.designationId || req.query.designationId
        let r1Id = req.body.r1Id || req.query.r1Id
        let r2Id = req.body.r2Id || req.query.r2Id
        let r3Id = req.body.r3Id || req.query.r3Id
        let resignStatus = req.body.resignStatus || req.query.resignStatus
        let pfApplicable = req.body.pfApplicable || req.query.pfApplicable
        let esicApplicable = req.body.esicApplicable || req.query.esicApplicable

        let apiData = await fetchData({
            token, pageNo, limit, joiningDesignationId, tenure,empId, subCompId, branchId, departmentId, subDepartmentId, designationId,r1Id,r2Id,r3Id,resignStatus,pfApplicable,esicApplicable
        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="AttritionReport.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { getAttritionReportExcelWages,getAttritionReportExcelSheet }

