let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')
const moment = require('moment')

function safeParse(val) {

  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

const getCtcReportExcel = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
      
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()

        let data = { ...req.body, ...req.query }
        const { year, month, empId, api, subCompanyId, templateId } = data

        const countQuery = await db.query(
            `
                                       SELECT COUNT(*) AS total
                                       FROM eve_blue_employee_monthly_salary_summary as a
        left join eve_acc_employee as b on a.employeeId=b.id
        left join eve_blue_company_salary_components as c on a.salaryTempId=c.id
      
        WHERE (a.status='A' )
      
        AND employeeType='Blue Collar'
      
                                       AND (employeeCurrentStatus = '' 
                                       OR employeeCurrentStatus IS NULL 
                                       OR employeeCurrentStatus = 'Active'
                                    
                                       OR employeeCurrentStatus = 'joining'
                                  
                                       OR employeeCurrentStatus = 'offerletter')

                                        AND (:empId is null or b.id=:empId)
                                        -- and a.inputType='ctc'
                                         and c.wageSetting='monthly'

                                     --     and month(a.createdDateTime)=:month
                                       --   and year(a.createdDateTime)=:year
            and (:employeeSubCompanyId is null or b.employeeSubCompanyId=:employeeSubCompanyId)
            and (:salaryTempId is null or a.salaryTempId=:salaryTempId)
                         
                                                           
            `, {
            replacements: {

                empId: empId || null,
                month: month,
                year: year,
                employeeSubCompanyId: subCompanyId||null,
                salaryTempId: templateId||null,
            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
     
        if (totalData === 0) {
            return res.status(200).json({ status: true, result:'error', alert: 'No Data Found' })
        }
       
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let sqlData = await db.query(
            `
                                            SELECT
            
                                             a.inputType,
                                             b.employeeSubCompanyId,
                                             a.salaryTempId,
                                             b.employeeDoj,
                                             a.id,

        b.id AS empId,
        b.employeeCode as 'Worker Code',
        b.employeeName as 'Worker Name',
        month(a.createdDateTime) as month,
        year(a.createdDateTime) as year,
        b.employeeBranchId,
        b.employeeDepartmentId,
        b.employeeSubDepartmentId,
        b.employeeDesignationId,
        b.locationID,
        -- b.employeeType,
        c.templateName as 'Template Name',
        c.wageSetting,
       -- b.salaryTemplateId,
       a.inputGross,
       a.inputCtc,
        -- a.grossAddition,
        -- a.grossSalary,
        -- a.grossDeduction,
        a.netPayout
        FROM eve_blue_employee_monthly_salary_summary as a
        left join eve_acc_employee as b on a.employeeId=b.id
        left join eve_blue_company_salary_components as c on a.salaryTempId=c.id
      
       WHERE (a.status='A')
       -- c.wageSetting='monthly'
        AND (a.inputType='ctc' OR a.inputType='gross')
        AND employeeType='Blue Collar'
      
                                       AND (employeeCurrentStatus = '' 
                                       OR employeeCurrentStatus IS NULL 
                                       OR employeeCurrentStatus = 'Active'
                                    
                                       OR employeeCurrentStatus = 'joining'
                                  
                                       OR employeeCurrentStatus = 'offerletter')

          AND (:empId is null or b.id=:empId)
         -- and month(a.createdDateTime)=:month
          -- and year(a.createdDateTime)=:year
          and month(b.employeeDoj)<= :month
          and year(b.employeeDoj)<= :year

             -- and a.inputType='ctc'
             and (:employeeSubCompanyId is null or b.employeeSubCompanyId=:employeeSubCompanyId)
             and (:salaryTempId is null or a.salaryTempId=:salaryTempId)

        ORDER BY b.employeeName asc
        LIMIT :limit
        OFFSET :offset
                                 
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    empId: empId || null,
                    month: month,
                    year: year,
                    employeeSubCompanyId: subCompanyId||null,
                    salaryTempId: templateId||null,


                }, type: QueryTypes.SELECT
            }
        )

let columnTotals = {}
let finalData = [];    
        await Promise.all(sqlData.map(async (e, i) => {
                           
            e['Sub Company'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.Branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.Department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['Sub Department'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.Designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)

    let sqlSummary=await db.query(`
              SELECT
              a.inputType,
              b.employeeSubCompanyId,
              a.salaryTempId,
              b.employeeDoj,
              a.createdDateTime,
              a.id,

        b.id AS empId,
        b.employeeCode as 'Worker Code',
        b.employeeName as 'Worker Name',
        month(a.createdDateTime) as month,
        year(a.createdDateTime) as year,
        b.employeeBranchId,
        b.employeeDepartmentId,
        b.employeeSubDepartmentId,
        b.employeeDesignationId,
        b.locationID,
        -- b.employeeType,
        c.templateName as 'Template Name',
        c.wageSetting,
       -- b.salaryTemplateId,
       a.inputGross,
       a.inputCtc,
        -- a.grossAddition,
        -- a.grossSalary,
        -- a.grossDeduction,
        a.netPayout
        FROM eve_blue_employee_monthly_salary_summary as a
        left join eve_acc_employee as b on a.employeeId=b.id
        left join eve_blue_company_salary_components as c on a.salaryTempId=c.id
      
       WHERE (a.status='A' OR a.status='I')
        AND c.wageSetting='monthly'
      
        AND employeeType='Blue Collar'
      
                                       AND (employeeCurrentStatus = '' 
                                       OR employeeCurrentStatus IS NULL 
                                       OR employeeCurrentStatus = 'Active'
                                    
                                       OR employeeCurrentStatus = 'joining'
                                  
                                       OR employeeCurrentStatus = 'offerletter')

          
       
          and month(b.employeeDoj)<= :month
          and year(b.employeeDoj)<= :year
          and a.employeeId=:employeeId

             -- and a.inputType='ctc'
           

             AND  YEAR(a.createdDateTime)=:year AND MONTH(a.createdDateTime)=:month
               ORDER BY b.employeeName asc
      
        `,{
            replacements:{
                employeeId:e.empId,year:year,month:month

            },type:QueryTypes.SELECT
        }
    )
   
    
    if(sqlSummary.length>0){

       await Promise.all(sqlSummary.map(async x => {
          x['Sub Company'] = await myFunc.getSubCompanyNameById(x.employeeSubCompanyId, db)
            x.Branch = await myFunc.getBranchNameByBranchId(x.employeeBranchId, db)
            x.Department = await myFunc.getDepartmentNameByDepartmentId(x.employeeDepartmentId, db)
            x['Sub Department'] = await myFunc.getSubDepartmentNameBySubDepartmentId(x.employeeSubDepartmentId, db)
            x.Designation = await myFunc.getDesignationNameById(x.employeeDesignationId, db)
             let sqlComponent = await db.query(
                       `
    
                       SELECT DISTINCT  a.salaryLabel,b.salaryAmount
                       FROM eve_blue_company_salary_structure_new AS a
                       LEFT JOIN eve_blue_set_monthly_salary_employee_wise AS b 
                       ON (
                                   b.employeeId=:employeeId 
                                   AND b.salaryTempId=a.templateId 
                                   AND b.salaryId=a.id 
                                   AND salarySummaryId=:salarySummaryId
                          )
                       WHERE a.status='A'
                       AND a.templateId=:templateId
                                    
                       `, {
                       replacements: {
           
                          
                           templateId: x.salaryTempId,
                           employeeId:e.empId,
                           salarySummaryId:x.id,
           
                       }, type: QueryTypes.SELECT
                   }
                   )
                           sqlComponent.forEach(item=>{
            let amount = Number(item.salaryAmount);
            x[item.salaryLabel] = isNaN(amount) ? '' : (item.salaryAmount);

             
            
        })
                 x['Monthly Gross']=myFunc.formatAmount(x['inputGross'])
        
                 x['Net Payable Salary']=myFunc.formatAmount(x['netPayout'])
       
                if(x.inputType==='ctc'){
                 x['CTC']=myFunc.formatAmount(x['inputCtc'])
          
                }
              

                
        
    })); 
  
    
    finalData.push(...sqlSummary);
    
}
else {

    if(e.month < month){

        let sqlComponent = await db.query(
                   `
        
                   SELECT DISTINCT  a.salaryLabel,b.salaryAmount
                           FROM eve_blue_company_salary_structure_new AS a
                           LEFT JOIN eve_blue_set_monthly_salary_employee_wise AS b 
                           ON (
                                       b.employeeId=:employeeId 
                                       AND b.salaryTempId=a.templateId 
                                       AND b.salaryId=a.id 
                                       AND salarySummaryId=:salarySummaryId
                              )
                           WHERE a.status='A'
                           AND a.templateId=:templateId
                                
                   `, {
                   replacements: {
        
                      
                        templateId: e.salaryTempId,
                               employeeId:e.empId,
                               salarySummaryId:e.id,
        
                   }, type: QueryTypes.SELECT
               }
               )
              sqlComponent.forEach(item=>{
                let amount = Number(item.salaryAmount);
                e[item.salaryLabel] = isNaN(amount) ? '' : (item.salaryAmount);
              })
           
             e['Monthly Gross']=myFunc.formatAmount(e['inputGross'])
            
                     e['Net Payable Salary']=myFunc.formatAmount(e['netPayout'])
           
                    if(e.inputType==='ctc'){
                     e['CTC']=myFunc.formatAmount(e['inputCtc'])
              
                    }
    }
    else{
          let sqlComponent = await db.query(
                   `
        
                   SELECT a.salaryLabel
                   -- b.salaryAmount
                           FROM eve_blue_company_salary_structure_new AS a
                          -- LEFT JOIN eve_blue_set_monthly_salary_employee_wise AS b 
                          -- ON (
                            --           b.employeeId=:employeeId 
                              --         AND b.salaryTempId=a.templateId 
                                --       AND b.salaryId=a.id 
                                  --     AND salarySummaryId=:salarySummaryId
                             -- )
                           WHERE a.status='A'
                           AND a.templateId=:templateId
                                
                   `, {
                   replacements: {
        
                      
                        templateId: e.salaryTempId,
                            //    employeeId:e.empId,
                            //    salarySummaryId:e.id,
        
                   }, type: QueryTypes.SELECT
               }
               )
              sqlComponent.forEach(item=>{
                  e[item.salaryLabel] = ''
              })
               e['Monthly Gross']=''
               e['Net Payable Salary']=''
                    
           
              if(e.inputType==='ctc'){
                     e['CTC']=''
                    }
              
                }
    
           

   
    finalData.push(e)
}


}))
    finalData.sort((a, b) => {
    const nameA = a["Worker Name"]?.toUpperCase() || '';
    const nameB = b["Worker Name"]?.toUpperCase() || '';
    return nameA.localeCompare(nameB);
    })

if (api === 'raw') {

        return res.status(200).json({
        status: true,
        message: 'success',
        recordedPerPage: limit,
        currentPage: pageNo,
        totalData: finalData.length,
        data: finalData       
    })
}

finalData.map(e => {
            delete e.employeeSubCompanyId
           delete e.employeeBranchId
    delete e.employeeId
    delete e.employeeDepartmentId
    delete e.employeeSubDepartmentId
    delete e.employeeDesignationId
    delete e.salaryTempId
            delete e.templateName
            delete e.templateType
            delete e.salary_types
            delete e.salaryOfMonth
            delete e.salaryOfYear
            delete e.salaryType
            delete e.templateName
            delete e.month
            delete e.year
            // delete e.empId
            delete e.locationID 
            delete e.inputCtc 
            delete e.inputGross 
            delete e.netPayout 
            delete e.inputType 
            delete e.wageSetting 
            delete e.employeeDoj 
            delete e.createdDateTime 
            delete e.empId 
            delete e.id
        })


        finalData.map(e=>{
            const excludeFields = new Set([
           'Worker Code',
           'Worker Name',
            'Template Name',
           'Sub Company',
           'Branch',
           'Department',
           'Sub Department',
           'Sl. No.'
  
])
           Object.entries(e).forEach(([key, value]) => {
    if (!excludeFields.has(key)) {
        const numericVal = safeParse((value ?? '').toString().replace(/,/g, ''))
        if (!isNaN(numericVal)) {
            columnTotals[key] = (columnTotals[key] || 0) + numericVal;
        }
    }
})
        })
       
        
  finalData = finalData.map((e, index) => {
            e['Sl. No.'] = index + 1;
            const { ['Sl. No.']: slNo, ...rest } = e;
            return { 'Sl. No.': slNo, ...rest };
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ctc Report');
        let values = []

        const headers = Object.keys(finalData[0]);
        worksheet.addRow(headers);

        finalData = myFunc.replaceEmptyValues(finalData)

        finalData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });



let len = headers.length;
let row = new Array(len).fill('');

headers.forEach((header, idx) => {
    if (header in columnTotals) {
        row[idx] = myFunc.formatAmount(columnTotals[header]);
    }
});

row[headers.indexOf('Designation')] = 'Total :';

values.push(row);

       
        worksheet.addRows(values);
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            row.height = 25
        });

        // Header style
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
            cell.font = { bold: true };
        });

        worksheet.columns.forEach(column => {
            column.width = 30
        });

        const lastRow = worksheet.lastRow;
        lastRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
        });

        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `CtcReport_${month}_${year}_${Date.now()}.xlsx`;
        const customPathToDisplay = `${process.env.CUSTUM_PATH_DISPLAY}\\${fileName}`

        if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
        }

        const filePath = path.join(customPath, fileName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Save the file
        await workbook.xlsx.writeFile(filePath);

        // Insert file info into DB
        await db.query(
          `
          INSERT INTO eve_blue_all_report_download_log (createdDate, createdSession, createdIp, excelFileUrl, status,expiryDate,excelName,type)
          VALUES (NOW(), :session, :ip, :file,:status,:expiryDate, :excelName,:type)

          `,
            {
                replacements: {

                    session: `${moment(month, 'MM').format('MMMM')} ${year}`,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    file: customPathToDisplay, // or use filePath if you want to store full path
                    status: 'A',
                    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days expiry for testing                                                   
                    // expiryDate: new Date(Date.now() + 1000*60 ), // 1 min expiry for testing                                                   
                    excelName: fileName,
                    type: 'CTC Report'
                },
                type: QueryTypes.INSERT
            }
        );
        res.status(200).json({
            status: true,
            result: "success",
            alert: 'Excel file generated successfully',
            filePath: `${customPathToDisplay}`, // Return path if needed on front-end
        });


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })

    }
}
module.exports = { getCtcReportExcel }











// let sequelize = require('../../../config/db')
// const { QueryTypes } = require('sequelize')
// const myFunc = require('../../../functions/functions')
// const ExcelJS = require('exceljs')
// const serialize = require('php-serialize')
// const fs = require('fs')
// const path = require('path')
// const moment = require('moment')
// const getCtcReportExcel = async (req, res) => {
//     try {

//         const decodedToken = req.headerSession
//         const tokenUserId = decodedToken.userId
//         const tokenBranchId = decodedToken.branchId
//         const tokenMainUserId = decodedToken.mainUserId
//         const tokenCompanyId = decodedToken.companyId
//         let db = sequelize(tokenCompanyId)
//         let db1 = sequelize()

//         let data = { ...req.body, ...req.query }
//         const { year, month, empId, api, subCompanyId, templateId } = data

//         const countQuery = await db.query(
//             `
//                              SELECT distinct COUNT(*)  AS total
//                             FROM eve_acc_blue_coller_employee_payslip_preview AS a
//                          left join eve_blue_company_salary_components AS b on (a.salaryTemplateId = b.id and b.status = 'A')
//                          left join eve_acc_employee AS c on (a.employeeId = c.id and c.status = 'A')
//                          WHERE a.status ='A'
//                          AND c.employeeType = 'Blue Collar' 
//                             and a.salaryOfMonth = :month
//                          and a.salaryOfYear = :year
//                            and a.wagesType = 'monthly'
//                          and b.templateType='CTC'
                        

//                          and c.employeeSubCompanyId = :subCompanyId
//                          and a.salaryTemplateId = :templateId
                                                           
//             `, {
//             replacements: {

//                 empId: empId || null,
//                 month: month,
//                 year: year,
//                 subCompanyId: subCompanyId,
//                 templateId: templateId,

//             }, type: QueryTypes.SELECT
//         }
//         )
//         const totalData = countQuery[0]['total']
//         if (totalData === 0) {
//             return res.status(200).json({ status: false, totalData: 0, msg: 'no data found', employee: [] })
//         }
//         let limit = parseInt(req.body.limit) || totalData;
//         let maxPage = Math.ceil(totalData / limit)
//         let pageNo = parseInt(req.body.pageNo) || 1;
//         pageNo = pageNo <= maxPage ? pageNo : maxPage
//         let offset = (pageNo - 1) * limit;

//         const sqlData = await db.query(
//             `
//                          SELECT 
                         
//                          c.employeeCode AS 'Worker Code',
//                          c.employeeName AS 'Worker Name',
//                          c.employeeSubCompanyId,
//                          -- c.employeeDoj,
//                          c.employeeBranchId,
//                          a.employeeId,
//                           c.employeeDepartmentId,
//                          c.employeeSubDepartmentId,
//                          c.employeeDesignationId,
//                          c.salaryTemplateId,
//                          -- c.employeeType,
//                          -- c.employeeUAN,
//                          b.templateName,
//                          b.templateType,
//                          a.salary_types,
//                          a.salaryOfMonth,
//                          a.salaryOfYear
                            
//                          FROM eve_acc_blue_coller_employee_payslip_preview AS a
//                             left join eve_blue_company_salary_components AS b on (a.salaryTemplateId = b.id and b.status = 'A')
//                          left join eve_acc_employee AS c on (a.employeeId = c.id and c.status = 'A')
//                          WHERE a.status ='A'
//                          AND c.employeeType = 'Blue Collar' 
//                          and a.salaryOfMonth = :month
//                          and a.salaryOfYear = :year
//                          and a.wagesType = 'monthly'
//                           and b.templateType='CTC'
                      
//                         and c.employeeSubCompanyId = :subCompanyId
//                          and a.salaryTemplateId = :templateId
                       

//                          ORDER BY c.employeeName asc
//                             limit :limit
//                             offset :offset                       
//             `
//             , {
//                 replacements: {

//                     offset: offset,
//                     limit: limit,
//                     empId: empId || null,
//                     month: month,
//                     year: year,
//                     subCompanyId: subCompanyId,
//                     templateId: templateId,


//                 }, type: QueryTypes.SELECT
//             }
//         )


//         let totalPfEmployeesContribution = 0

//         let totalPfEmployerContribution = 0

//         let totalNetPayableSalary = 0

//         let totalEsicEmployerContribution = 0
//         let totalEsicEmployeesContribution = 0
//         let totalBasic = 0
//         let totalHra = 0
//         let totalCca = 0
//         let totalPt = 0
//         let totalCtc = 0
//         let totalMonthlyGross = 0
//         let totalConveyanceallowance = 0
//         let totalDearnessAllowance = 0
//         let totalMedicalAllowance = 0
//         let totalMonthlyAdHoc = 0
//         let totalOverTime = 0
//         let totalSpclAllw = 0
//         let totalVariablePay = 0
//         let totalWashingAllowance = 0
//         let totalLabourWelfareFund = 0
//         let totalTds = 0
//         let totalSa = 0
//         let totalPenulty = 0
//         let totalVpf = 0

//         let ctcArr = []

//         await Promise.all(sqlData.map(async (e, i) => {



//             let salaryTypes = serialize.unserialize(e.salary_types)

//             e.salaryType = (salaryTypes['salaryType'])
//             if (e.salaryType === 'ctc') {
//                 ctcArr.push(e)
//             }
//         }))


//         await Promise.all(ctcArr.map(async (e, i) => {


//             e['Sub Company'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
//             e.Branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
//             e.Department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
//             e['Sub Department'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
//             e.Designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
//             let salaryTypes = serialize.unserialize(e.salary_types)


//             e.salaryType = (salaryTypes['salaryType'])

//             e['Monthly Gross'] = myFunc.formatAmount(salaryTypes['inputGross'])
//             totalMonthlyGross += parseFloat(salaryTypes['inputGross'])

//             let additionDetails = salaryTypes['additionDetails']
//             let deductionDetails = salaryTypes['deductionDetails']
//             Object.keys(additionDetails).forEach(key => {
//                 if (!isNaN(key)) {
//                     let item = additionDetails[key];

//                     // Check if salaryLabel exists and is not empty
//                     if (item.salaryLabel && item.salaryAmount !== undefined && item.salaryLabel !== '') {
//                         e[item.salaryLabel] = item.salaryAmount;
//                     }
//                 }
//             });
//             Object.keys(deductionDetails).forEach(key => {
//                 if (!isNaN(key)) {
//                     let item = deductionDetails[key];

//                     // Check if salaryLabel exists and is not empty
//                     if (item.salaryLabel && item.salaryAmount !== undefined && item.salaryLabel !== '') {
//                         e[item.salaryLabel] = item.salaryAmount;
//                     }
//                 }
//             });
//             if (!e['VPF']) {
//                 e['VPF'] = '0.00';
//             }

//             e['Net Payable Salary'] = myFunc.formatAmount(salaryTypes['netPay'])
//             totalNetPayableSalary += parseFloat(salaryTypes['netPay'])

//             e.CTC = myFunc.formatAmount(salaryTypes['inputCtc'])
//             totalCtc += parseFloat(salaryTypes['inputCtc'])

//             Object.values(additionDetails).forEach(item => {

//                 if (item?.salaryLabel === 'ESIC(Employer Contribution)') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e.esicEmployerContribution = item.salaryAmount;
//                     totalEsicEmployerContribution += amount;
//                 }

//                 if (item?.salaryLabel === 'Basic') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e.basic = item.salaryAmount;
//                     totalBasic += amount;
//                 }

//                 if (item?.salaryLabel === 'HRA') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e.hra = item.salaryAmount;
//                     totalHra += amount;
//                 }

//                 if (item?.salaryLabel === 'CCA') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e.cca = item.salaryAmount;
//                     totalCca += amount;
//                 }

//                 if (item?.salaryLabel === 'PF(Employer Contribution)') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalPfEmployerContribution += amount;
//                 }
//                 if (item?.salaryLabel === 'Conveyance allowance') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalConveyanceallowance += amount;
//                 }
//                 if (item?.salaryLabel === 'DA (Dearness Allowance)') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalDearnessAllowance += amount;
//                 }
//                 if (item?.salaryLabel === 'Medical Allowance') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalMedicalAllowance += amount;
//                 }
//                 if (item?.salaryLabel === 'Monthly ad hoc') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalMonthlyAdHoc += amount;
//                 }

//                 if (item?.salaryLabel === 'Over Time') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalOverTime += amount;
//                 }
//                 if (item?.salaryLabel === 'Spcl.Allw') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalSpclAllw += amount;
//                 }
//                 if (item?.salaryLabel === 'Variable Pay') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalVariablePay += amount;
//                 }

//                 if (item?.salaryLabel === 'Washing Allowance') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalWashingAllowance += amount;
//                 }
//                 if (item?.salaryLabel === 'SA') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalSa += amount;
//                 }

//             })
//             Object.values(deductionDetails).forEach(item => {
//                 if (item?.salaryLabel === 'ESIC(Employees Contribution)') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e.esicEmployeesContribution = item.salaryAmount;
//                     totalEsicEmployeesContribution += amount;
//                 }

//                 if (item?.salaryLabel === 'PT') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e.ptax = item.salaryAmount;
//                     totalPt += amount

//                 }

//                 if (item?.salaryLabel === 'PF(Employees Contribution)') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employees Contribution)'] = item.salaryAmount;
//                     totalPfEmployeesContribution += amount;
//                 }
//                 if (item?.salaryLabel === 'VPF') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employees Contribution)'] = item.salaryAmount;
//                     totalVpf += amount;
//                 }

//                 if (item?.salaryLabel === 'Labour Welfare Fund') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalLabourWelfareFund += amount;
//                 }
//                 if (item?.salaryLabel === 'TDS') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalTds += amount;
//                 }

//                 if (item?.salaryLabel === 'penulty') {
//                     const amount = parseFloat((item?.salaryAmount ?? '0').toString().replace(/,/g, '')) || 0;
//                     // e['PF(Employer Contribution)'] = item.salaryAmount;
//                     totalPenulty += amount;
//                 }



//             });

//         }))
//         ctcArr.map(e => {
//             delete e.employeeSubCompanyId
//             delete e.employeeBranchId
//             delete e.employeeId
//             delete e.employeeDepartmentId
//             delete e.employeeSubDepartmentId
//             delete e.employeeDesignationId
//             delete e.salaryTemplateId
//             delete e.templateName
//             delete e.templateType
//             delete e.salary_types
//             delete e.salaryOfMonth
//             delete e.salaryOfYear
//             delete e.salaryType
//             delete e.templateName



//         })
//         ctcArr = ctcArr.map((e, index) => {
//             e['Sl. No.'] = index + 1;

//             // Reorder object: Sl. No. at the top
//             const { ['Sl. No.']: slNo, ...rest } = e;
//             return { 'Sl. No.': slNo, ...rest };
//         });

     

//         if (api === 'raw') {

//             return res.status(200).json({
//                 status: true,
//                 message: 'success',
//                 recordedPerPage: limit,
//                 currentPage: pageNo,
//                 totalData: ctcArr.length,
//                 data: ctcArr
//             })
//         }

    
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Ctc Report');
//         let values = []

//         const headers = Object.keys(ctcArr[0]);
//         worksheet.addRow(headers);

//         ctcArr = myFunc.replaceEmptyValues(ctcArr)

//         ctcArr.forEach(emp => {
//             worksheet.addRow(Object.values(emp));
//         });

//         let len = headers.length;
//         let row = new Array(len).fill('');
//         row[headers.indexOf('Basic')] = myFunc.formatAmount(totalBasic)
//         row[headers.indexOf('Conveyance allowance')] = myFunc.formatAmount(totalConveyanceallowance)
//         row[headers.indexOf('HRA')] = myFunc.formatAmount(totalHra)
//         row[headers.indexOf('CCA')] = myFunc.formatAmount(totalCca)
//         row[headers.indexOf('Monthly Gross')] = myFunc.formatAmount(totalMonthlyGross)
//         row[headers.indexOf('PF(Employer Contribution)')] = myFunc.formatAmount(totalPfEmployerContribution)
//         row[headers.indexOf('ESIC(Employer Contribution)')] = myFunc.formatAmount(totalEsicEmployerContribution)
//         row[headers.indexOf('PF(Employees Contribution)')] = myFunc.formatAmount(totalPfEmployeesContribution)
//         row[headers.indexOf('ESIC(Employees Contribution)')] = myFunc.formatAmount(totalEsicEmployeesContribution)
//         // row[headers.indexOf('PTax')] = myFunc.formatAmount(totalPtax)
//         row[headers.indexOf('Net Payable Salary')] = myFunc.formatAmount(totalNetPayableSalary)
//         row[headers.indexOf('CTC')] = myFunc.formatAmount(totalCtc)
//         row[headers.indexOf('DA (Dearness Allowance)')] = myFunc.formatAmount(totalDearnessAllowance)
//         row[headers.indexOf('Medical Allowance')] = myFunc.formatAmount(totalMedicalAllowance)
//         row[headers.indexOf('Monthly ad hoc')] = myFunc.formatAmount(totalMonthlyAdHoc)
//         row[headers.indexOf('Over Time')] = myFunc.formatAmount(totalOverTime)
//         row[headers.indexOf('Spcl.Allw')] = myFunc.formatAmount(totalSpclAllw)
//         row[headers.indexOf('Variable Pay')] = myFunc.formatAmount(totalVariablePay)
//         row[headers.indexOf('Washing Allowance')] = myFunc.formatAmount(totalWashingAllowance)
//         row[headers.indexOf('Labour Welfare Fund')] = myFunc.formatAmount(totalLabourWelfareFund)
//         row[headers.indexOf('PT')] = myFunc.formatAmount(totalPt)
//         row[headers.indexOf('TDS')] = myFunc.formatAmount(totalTds)
//         row[headers.indexOf('SA')] = myFunc.formatAmount(totalSa)
//         row[headers.indexOf('penulty')] = myFunc.formatAmount(totalPenulty)
//         row[headers.indexOf('VPF')] = myFunc.formatAmount(totalVpf)
//         row[headers.indexOf('Designation')] = 'Total :'

//         values.push(row);
//         worksheet.addRows(values);



//         worksheet.eachRow((row, rowNumber) => {
//             row.eachCell(cell => {
//                 cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
//                 cell.border = {
//                     top: { style: 'thin' },
//                     left: { style: 'thin' },
//                     bottom: { style: 'thin' },
//                     right: { style: 'thin' }
//                 };
//             });
//             row.height = 20
//         });

//         // Header style
//         const headerRow = worksheet.getRow(1);
//         headerRow.eachCell(cell => {
//             cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
//             cell.font = { bold: true };
//         });

//         worksheet.columns.forEach(column => {
//             column.width = 30
//         });

//         const lastRow = worksheet.lastRow;
//         lastRow.eachCell((cell, colNumber) => {
//             cell.font = { bold: true };
//         });

//         const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
//         const fileName = `CtcReport_${month}_${year}_${Date.now()}.xlsx`;
//         const customPathToDisplay = `${process.env.CUSTUM_PATH_DISPLAY}\\${fileName}`

//         if (!fs.existsSync(customPath)) {
//             fs.mkdirSync(customPath, { recursive: true });
//         }

//         const filePath = path.join(customPath, fileName);

//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

//         // Save the file
//         await workbook.xlsx.writeFile(filePath);

//         // Insert file info into DB
//         await db.query(
//             `
//           INSERT INTO eve_blue_all_report_download_log (createdDate, createdSession, createdIp, excelFileUrl, status,expiryDate,excelName,type)
//           VALUES (NOW(), :session, :ip, :file,:status,:expiryDate, :excelName,:type)
//           `,
//             {
//                 replacements: {

//                     session: `${moment(month, 'MM').format('MMMM')} ${year}`,
//                     ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//                     file: customPathToDisplay, // or use filePath if you want to store full path
//                     status: 'A',
//                     expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days expiry for testing                                                   
//                     // expiryDate: new Date(Date.now() + 1000*60 ), // 1 min expiry for testing                                                   
//                     excelName: fileName,
//                     type: 'CTC Report'
//                 },
//                 type: QueryTypes.INSERT
//             }
//         );
//         res.status(200).json({
//             status: true,
//             result: "success",
//             alert: 'Excel file generated successfully',
//             filePath: `${customPathToDisplay}`, // Return path if needed on front-end
//         });


//     } catch (error) {
//         return res.status(500).send({ status: false, msg: error.message, err: error.stack })

//     }
// }
// module.exports = { getCtcReportExcel }