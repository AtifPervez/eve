let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const axios = require('axios')
const ExcelJS = require('exceljs')
const moment = require('moment')
const phpUnserialize = require('php-serialize');

const getDepartmentNameByDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getTemplateNameByTemplateId = async (id, db) => {
    let templateName = await db.query('select templateName from eve_acc_company_salary_components where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (templateName[0]) {
        let res = Object.values(templateName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (employeeName[0]) {

        let res = Object.values(employeeName[0])
        let newRes = (res.toString());
        return newRes
    }
    else {
        return ''
    }
}
const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if (branchName[0]) {
        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
    else {
        return ''
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    }
    )
    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
    else {
        return ''
    }
}
const getDesignationIdFromEmpId = async (id, db) => {
    let designationName = await db.query('select employeeDesignationId  from eve_acc_employee where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    }
    )
    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
    else {
        return ''
    }
}
const getSubCompanyNameById = async (id, db) => {
    let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subCompanyName[0]) {
        let res = Object.values(subCompanyName[0])
        let newRes = (res.toString())
        return newRes
    }
    else {
        return ''
    }
}
const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
function convertDateDDMMYYYY(date) {
    let parsedDate = moment(date)
    let newDate = parsedDate.format('DD-MM-YYYY')
    return newDate
}
const getEmpCodeFromEmpId = async (id, db) => {
    let empCode = await db.query('select employeeCode from eve_acc_employee where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (empCode[0]) {
        let res = Object.values(empCode[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
function formatAmount(numericString) {
    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
}
const getLocationNameById = async (id, db) => {
    let location = await db.query('select location from eve_acc_locationmaster where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (location[0]) {
        let res = Object.values(location[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
function reorderObjectProperties(obj) {
    const slNo = obj['Sl. No.'];
    delete obj['Sl. No.'];
    const reorderedObj = { 'Sl. No.': slNo, ...obj };
    return reorderedObj;
}



function arrangeKeys(arr) {

    const maxKeysObj = arr.reduce((max, obj) => Object.keys(obj).length > Object.keys(max).length ? obj : max, {});


    const keysInOrder = Object.keys(maxKeysObj);


    function addMissingKeys(obj) {
        const newObj = {};
        keysInOrder.forEach(key => {
            newObj[key] = obj.hasOwnProperty(key) ? obj[key] : '--';
        });
        return newObj;
    }


    return arr.map(obj => addMissingKeys(obj));
}

function trimAllKeys(obj) {
    let trimmedObj = {};
    for (let key in obj) {
        let trimmedKey = key.trim();
        trimmedObj[trimmedKey] = obj[key];
    }
    return trimmedObj;
}

const getTemplateWisePayrollExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        // const userId = '29'
        const companyId = decodedToken.companyId
        const branchId = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let db = sequelize(companyId)
        // let db = sequelize('59')
        let data = req.body
        let { year, month, subCompanyId, employeeBranchId, employeeDepartmentId, templateId,locationID } = data

        if (!year && !month) {
            return res.status(400).send({ status: false, msg: 'enter the month and year' })
        }

        //employeeSubCompanyId
        let countQuery = await db.query(`
                                         SELECT COUNT(*) AS total
                                         FROM eve_acc_blue_coller_employee_payslip_preview AS payslip
                                         LEFT JOIN eve_acc_employee as emp on emp.id=payslip.employeeId 
                                         WHERE payslip.status='A' 
                                         
                                         AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId=:subCompanyId )
                                         AND (:employeeBranchId IS NULL OR emp.employeeBranchId=:employeeBranchId )
                                         AND (:employeeDepartmentId IS NULL OR emp.employeeDepartmentId=:employeeDepartmentId )
                                         AND (:locationID IS NULL OR emp.locationID=:locationID )
                                         AND (:templateId IS NULL OR   payslip.salaryTemplateId=:templateId )
                                         AND ( 
                                             (payslip.appriserId=:userId AND payslip.isAppriserVisible='yes') 
                                             OR (payslip.reviewerId=:userId AND payslip.isReviewerVisible='yes') 
                                             OR (payslip.managerId=:userId AND payslip.isManagerVisible='yes')
                                            )
                                        AND payslip.salaryOfMonth=:month
                                        AND payslip.salaryOfYear =:year
                                            

                          `, {
            replacements:
            {
                userId: userId,
                subCompanyId:subCompanyId||null,
                employeeBranchId:employeeBranchId||null,
                employeeDepartmentId:employeeDepartmentId||null,
                locationID: locationID||null,
                templateId: templateId||null,
                year: year,
                month: month,
            },

            type: QueryTypes.SELECT
        })

        const totalData = countQuery[0].total
       
        if(totalData===0){
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        
        
        let getData = await db.query(`
        SELECT
            (@row_number:=@row_number + 1) AS 'Sl. No.',
            data.employeeId,
            data.employeeCode AS 'Employee Code',
            data.employeeName AS 'Employee Name',
            data.salaryTemplateId,
            data.salaryOfMonth,
            data.salaryOfYear,
            data.employeeDepartmentId,
            data.subCompanyId,
            data.templateId,
            data.employeeBranchId,
            data.locationID,
            data.designationId,
            data.employeeSubDepartmentId,
            data.DOJ,
            data.accNumber,
            data.bankName,
            data.IFSCnum,
            data.fromDate,
            data.toDate,
            data.daySummary,
            data.salary_types
        FROM (
            SELECT
                payslip.employeeId,
                emp.employeeCode,
                emp.employeeName,
                payslip.salaryTemplateId,
                payslip.salaryOfMonth,
                payslip.salaryOfYear,
                emp.employeeDepartmentId,
                emp.employeeSubCompanyId AS subCompanyId,
                emp.salaryTemplateId AS templateId,
                emp.employeeBranchId,
                emp.locationId AS locationID,
                emp.employeeDesignationId AS designationId,
                emp.employeeSubDepartmentId,
                DATE_FORMAT(emp.employeeDoj, '%d-%m-%Y') AS DOJ,
                emp.accNumber,
                emp.bankName,
                emp.IFSCnum,
                payslip.fromDate,
                payslip.toDate,
                payslip.daySummary,
                payslip.salary_types
            FROM eve_acc_blue_coller_employee_payslip_preview AS payslip
            LEFT JOIN eve_acc_employee AS emp ON emp.id = payslip.employeeId
            WHERE payslip.status = 'A'
            
            AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId)
            AND (:employeeBranchId IS NULL OR emp.employeeBranchId = :employeeBranchId)
            AND (:employeeDepartmentId IS NULL OR emp.employeeDepartmentId = :employeeDepartmentId)
            AND (:locationID IS NULL OR emp.locationID=:locationID )
            AND (:templateId IS NULL OR   payslip.salaryTemplateId=:templateId )
            AND (
                (payslip.appriserId = :userId AND payslip.isAppriserVisible = 'yes')
                OR (payslip.reviewerId = :userId AND payslip.isReviewerVisible = 'yes')
                OR (payslip.managerId = :userId AND payslip.isManagerVisible = 'yes')
            )
            AND payslip.salaryOfMonth=:month
            AND payslip.salaryOfYear =:year
            ORDER BY emp.employeeName
            LIMIT :limit
            OFFSET :offset
        ) AS data
        CROSS JOIN (SELECT @row_number := :offset) AS init
    `, {
        replacements: {
            userId: userId,
            subCompanyId: subCompanyId || null,
            employeeBranchId: employeeBranchId || null,
            employeeDepartmentId: employeeDepartmentId || null,
            locationID: locationID||null,
            templateId: templateId||null,
            limit: limit,
            offset: offset,
          
            year: year,
            month: month,
        },
        type: QueryTypes.SELECT
    });
    
    
    

        await Promise.all(getData.map(async (e,i) => {
           
            e['Sub Company'] = await getSubCompanyNameById(e.subCompanyId, db)
            e['Branch'] = await getBranchNameByBranchId(e.employeeBranchId, db)
            e['Department'] = await getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['Sub Department'] = await getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e['Designation'] = await getDesignationNameById(e.designationId, db)
            e['Location'] = await getLocationNameById(e.locationID, db)
            if (e.accNumber === null) {
                e.accNumber = ''
            }
            e['Bank A/c No.'] = e.accNumber
            if (e.bankName === null) {
                e.bankName = ''
            }
            e['Bank Name'] = e.bankName
            if (e.IFSCnum === null) {
                e.IFSCnum = ''
            }
            e['Bank IFSC'] = e.IFSCnum
            e['From Date'] = convertDateDDMMYYYY(e.fromDate)
            e['To Date'] = convertDateDDMMYYYY(e.toDate)
            if (e['From Date'] === null) {
                e['From Date'] = ''
            }
            if (e['To Date'] === null) {
                e['To Date'] = ''
            }
            if (e['From Date'] !== '' && e['To Date'] !== '') {
                e['Total Days'] = moment(e['To Date'], 'DD-MM-YYYY').diff(moment(e['From Date'], 'DD-MM-YYYY'), 'days') + 1
            }
            else {
                e['Total Days'] = ''
            }
            e.daySummary = phpUnserialize.unserialize(e.daySummary)
            if (e.daySummary != null) {

                e['Weekly-Off'] = e.daySummary.offDay
                e['Paid Holidays'] = e.daySummary.totalPaidHoliday
                e['Unpaid Holidays'] = e.daySummary.totalUnPaidHoliday
                e['Working Days'] = e.daySummary.WorkingDays
                e['Paid Leaves'] = e.daySummary.PaidLeaves
                e['LWP(Absent Days)'] = e.daySummary.absentDays
                e['Present Days'] = e.daySummary.presetntDays
                e['Max Payable Days'] = e.daySummary.MaxPayableDays
                e['Net Paid Days'] = e.daySummary.NetPaidDays
            }
            e.salary_types = phpUnserialize.unserialize(e.salary_types)

            if (e.salary_types != null) {

                if (e.salary_types?.additionDetails) {
                    for (let i in e.salary_types.additionDetails) {
                        let obj = e.salary_types.additionDetails[i]
                        if (typeof obj !== 'object') {
                            continue
                        }
                        e[obj.salaryLabel] = obj.salaryAmount


                    }
                    if (e.salary_types.salaryType == 'ctc') {
                        e['CTC'] = e.salary_types.additionDetails.totalEarning
                    }
                    else {
                        e['CTC'] = 0
                    }


                }
                if (e.salary_types?.deductionDetails) {
                    for (let i in e.salary_types.deductionDetails) {
                        let obj = e.salary_types.deductionDetails[i]
                        if (typeof obj !== 'object') {
                            continue
                        }
                        e[obj.salaryLabel] = obj.salaryAmount

                    }
                }

                e['Total Earnings'] = e.salary_types.additionDetails.totalEarning
                e['Total Deductions'] = e.salary_types.deductionDetails.totalDeduction
                e['Payable Gross'] = e.salary_types.payableGross
                e['Net Pay'] = e.salary_types.netPay
                e['In Words'] = e.salary_types.netPayAmount
            }

        }))
        getData.map((e) => {
            delete e.daySummary
            delete e.salary_types
            delete e.salaryTypes
        })
      
        let basic = 0
        let cca = 0
        let conveyanceAllowance = 0
        let esic = 0
        let extraDuty = 0
        let hra = 0
        let overtime = 0
        let test = 0
        let test1 = 0
        let ctc = 0
        let PfEmployeesContribution = 0
        let tds = 0
        let waterAllowance = 0
        let totalEarning = 0
        let totalDeduction = 0
        let payableGross = 0
        let netPay = 0
        let monthlyAdHoc = 0
        let wifi = 0
        let labourWelfareFund = 0
        let pt = 0
        let PfEmployerContribution = 0
        let ESICEmployerContribution = 0
        let specialAllownce = 0
        let OtherDeduction = 0
        let electricity = 0
        let deduction = 0
        let Nnn = 0



       

        getData.map((e, i) => {
            if (e['Special Allownce']) {
                specialAllownce += parseFloat(e['Special Allownce'])
                e['Special Allownce'] = formatAmount(e['Special Allownce'])
            }
            if (e['Electricity']) {
                electricity += parseFloat(e['Electricity'])
                e['Electricity'] = formatAmount(e['Electricity'])
            }
            if (e['Deduction']) {
                deduction += parseFloat(e['Deduction'])
                e['Deduction'] = formatAmount(e['Deduction'])
            }
            if (e['Nnn']) {
                Nnn += parseFloat(e['Nnn'])
                e['Nnn'] = formatAmount(e['Nnn'])
            }


            if (e['Other Deduction']) {
                OtherDeduction += parseFloat(e['Other Deduction'])
                e['Other Deduction'] = formatAmount(e['Other Deduction'])

            }
            if (e['Basic']) {
                basic += parseFloat(e['Basic'].replace(',', ''))
                e['Basic'] = formatAmount(e['Basic'])
            }

            if (e.CCA) {
                cca += parseFloat((e.CCA).replace(',', ''))
                e.CCA = formatAmount(e.CCA)
            }
            if (e['Conveyance allowance']) {
                conveyanceAllowance += parseFloat(e['Conveyance allowance'].replace(',', ''))
                e['Conveyance allowance'] = formatAmount(e['Conveyance allowance'])
            }

            if (e['Extra Duty']) {
                extraDuty += parseFloat(e['Extra Duty'].replace(',', ''))
                e['Extra Duty'] = formatAmount(e['Extra Duty'])
            }

            if (e.HRA) {
                hra += parseFloat((e.HRA).replace(',', ''))
                e.HRA = formatAmount(e.HRA)
            }
            if (e['Monthly ad hoc']) {
                monthlyAdHoc += parseFloat(e['Monthly ad hoc'].replace(',', ''))
                e['Monthly ad hoc'] = formatAmount(e['Monthly ad hoc'])
            }

            if (e['Over Time']) {
                overtime += parseFloat(e['Over Time'])
                e['Over Time'] = formatAmount(e['Over Time'])
            }

            if (e['Wifi']) {
                wifi += parseFloat(e['Wifi'].replace(',', ''))
                e['Wifi'] = formatAmount(e['Wifi'])
            }
            if (e.test) {
                test += parseFloat(e.test.replace(',', ''))
                e.test = formatAmount(e.test)
            }
            if (e.test1) {
                test1 += parseFloat(e.test1.replace(',', ''))
                e.test1 = formatAmount(e.test1)
            }

            if (e['CTC']) {
                ctc += parseFloat(e['CTC'])
                e['CTC'] = formatAmount(e['CTC'])
            }
            if (e['ESIC(Employees Contribution)']) {
                esic += parseFloat(e['ESIC(Employees Contribution)'])
                e['ESIC(Employees Contribution)'] = formatAmount(e['ESIC(Employees Contribution)'])
            }

            if (e['Labour Welfare Fund']) {
                labourWelfareFund += parseFloat(e['Labour Welfare Fund'].replace(',', ''))
                e['Labour Welfare Fund'] = formatAmount(e['Labour Welfare Fund'])
            }

            if (e.PT) {
                pt += parseFloat(e.PT.replace(',', ''))
                e.PT = formatAmount(e.PT)
            }

            if (e['PF(Employees Contribution)']) {
                PfEmployeesContribution += parseFloat(e['PF(Employees Contribution)'].replace(',', ''))
                e['PF(Employees Contribution)'] = formatAmount(e['PF(Employees Contribution)'])
            }
            if (e.TDS) {
                tds += parseFloat(e.TDS.replace(',', ''))
                e.TDS = formatAmount(e.TDS)

            }
            if (e['Water Allowance ']) {
                waterAllowance += parseFloat(e['Water Allowance '])
                e['Water Allowance '] = formatAmount(e['Water Allowance '])

            }
            if (e['Total Earnings']) {
                totalEarning += parseFloat(e['Total Earnings'])
                e['Total Earnings'] = formatAmount(e['Total Earnings'])
            }
            if (e['Total Deductions']) {

                totalDeduction += parseFloat(e['Total Deductions'])
                e['Total Deductions'] = formatAmount(e['Total Deductions'])
            }
            if (e['Payable Gross']) {
                payableGross += parseFloat(e['Payable Gross'])
                e['Payable Gross'] = formatAmount(e['Payable Gross'])

            }
            if (e['Net Pay']) {
                netPay += parseFloat(e['Net Pay'])
                e['Net Pay'] = formatAmount(e['Net Pay'])
            }


            if (e['In Words']) {
                e['In Words'] = e['In Words'] === "  Only" ? '-' : e['In Words']
            }

            if (e['PF(Employer Contribution)']) {
                PfEmployerContribution += parseFloat(e['PF(Employer Contribution)'])
                e['PF(Employer Contribution)'] = formatAmount(e['PF(Employer Contribution)'])

            }
            if (e['ESIC(Employer Contribution)']) {
                ESICEmployerContribution += parseFloat(e['ESIC(Employer Contribution)'])
                e['ESIC(Employer Contribution)'] = formatAmount(e['ESIC(Employer Contribution)'])

            }
            e.CTC = e.CTC === 0 ? '--' : e.CTC


            delete e.employeeId
            delete e.salaryTemplateId
            delete e.salaryOfMonth
            delete e.salaryOfYear
            delete e.employeeCode
            delete e.employeeDepartmentId
            delete e.subCompanyId
            delete e.templateId
            delete e.employeeBranchId
            delete e.locationID
            delete e.designationId
            delete e.employeeSubDepartmentId
            delete e.employeeDoj
            delete e.accNumber
            delete e.bankName
            delete e.IFSCnum
            delete e.fromDate
            delete e.toDate
            delete e['']
            delete e.totalEarning
            delete e['VPF']
            delete e['Bonus']
        })

        let result = arrangeKeys(getData)
       

        return res.status(200).send({
            status: true,
            totalData: totalData,
            specialAllownce: formatAmount(specialAllownce),
            electricity: formatAmount(electricity),
            deduction: formatAmount(deduction),
            Nnn: formatAmount(Nnn),
            basic: formatAmount(basic),
            cca: formatAmount(cca),
            conveyanceAllowance: formatAmount(conveyanceAllowance),
            extraDuty: formatAmount(extraDuty),
            hra: formatAmount(hra),
            monthlyAdHoc: formatAmount(monthlyAdHoc),
            overtime: formatAmount(overtime),
            test: formatAmount(test),
            test1: formatAmount(test1),
            wifi: formatAmount(wifi),
            ctc: formatAmount(ctc),
            esic: formatAmount(esic),
            labourWelfareFund: formatAmount(labourWelfareFund),
            pt: formatAmount(pt),
            PfEmployeesContribution: formatAmount(PfEmployeesContribution),
            waterAllowance: formatAmount(waterAllowance),
            OtherDeduction: formatAmount(OtherDeduction),
            tds: formatAmount(tds),
            totalEarning: formatAmount(totalEarning),
            totalDeduction: formatAmount(totalDeduction),
            payableGross: formatAmount(payableGross),
            netPay: formatAmount(netPay),
            PfEmployerContribution: formatAmount(PfEmployerContribution),
            ESICEmployerContribution: formatAmount(ESICEmployerContribution),
            employee: result,
        })
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message })
    }
}
async function fetchData({ token,templateId, year, month,pageNo,limit, subCompanyId, employeeBranchId, employeeDepartmentId, subDepartmentId, locationID }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            // url: 'http://localhost:5000/payroll/getTemplateWisePayrollExcel',
            url: `${process.env.BASE_URL}/payroll/getTemplateWisePayrollExcel`,
            data: { token,templateId, year, month,pageNo,limit, subCompanyId, employeeBranchId, employeeDepartmentId, subDepartmentId, locationID }
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
    let basicIndex = header.indexOf('Basic')
    let OtherDeductionIndex = header.indexOf('Other Deduction')
    // let BonusIndex = header.indexOf('Bonus')
    let ccaIndex = header.indexOf('CCA')
    let conveyanceAllowanceIndex = header.indexOf('Conveyance allowance')
    let extraDutyIndex = header.indexOf('Extra Duty')
    let hraIndex = header.indexOf('HRA')
    let monthlyAdHocIndex = header.indexOf('Monthly ad hoc')
    let overtimeIndex = header.indexOf('Over Time')
    let testIndex = header.indexOf('test')
    let test1Index = header.indexOf('test1')
    let wifiIndex = header.indexOf('Wifi')
    let ctcIndex = header.indexOf('CTC')
    let esicIndex = header.indexOf('ESIC(Employees Contribution)')
    let labourWelfareFundIndex = header.indexOf('Labour Welfare Fund')
    let ptIndex = header.indexOf('PT')
    let PfEmployeesContributionIndex = header.indexOf('PF(Employees Contribution)')
    let tdsIndex = header.indexOf('TDS')
    let waterAllowanceIndex = header.indexOf('Water Allowance ')
    let totalEarningIndex = header.indexOf('Total Earnings')
    let totalDeductionIndex = header.indexOf('Total Deductions')
    let payableGrossIndex = header.indexOf('Payable Gross')
    let netPayIndex = header.indexOf('Net Pay')
    let PfEmployerContributionIndex = header.indexOf('PF(Employer Contribution)')
    let ESICEmployerContributionIndex = header.indexOf('ESIC(Employer Contribution)')
    let specialAllownceIndex = header.indexOf('Special Allownce')
    let electricityIndex = header.indexOf('Electricity')
    let deductionIndex = header.indexOf('Deduction')
    let NnnIndex = header.indexOf('Nnn')

    let len = header.length
    let row = new Array(len).fill('')

    row[basicIndex] = data['basic']
    row[specialAllownceIndex] = data['specialAllownce']
    row[electricityIndex] = data['electricity']
    row[deductionIndex] = data['deduction']
    row[NnnIndex] = data['Nnn']
    row[OtherDeductionIndex] = data.OtherDeduction
    row[ccaIndex] = data.cca
    row[conveyanceAllowanceIndex] = data.conveyanceAllowance
    row[extraDutyIndex] = data.extraDuty
    row[hraIndex] = data.hra
    row[monthlyAdHocIndex] = data.monthlyAdHoc
    row[overtimeIndex] = data.overtime
    row[test1Index] = data.test1
    row[wifiIndex] = data.wifi
    row[ctcIndex] = data.ctc
    row[esicIndex] = data.esic
    row[labourWelfareFundIndex] = data.labourWelfareFund
    row[ptIndex] = data.pt
    row[PfEmployeesContributionIndex] = data.PfEmployeesContribution
    row[tdsIndex] = data.tds
    row[waterAllowanceIndex] = data.waterAllowance
    row[totalEarningIndex] = data.totalEarning
    row[totalDeductionIndex] = data.totalDeduction
    row[payableGrossIndex] = data.payableGross
    row[netPayIndex] = data.netPay
    row[PfEmployerContributionIndex] = data.PfEmployerContribution
    row[ESICEmployerContributionIndex] = data.ESICEmployerContribution
    values.push(row)
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
   
    worksheet.columns.forEach(column => {
        column.width = 20;
    });


    const lastRow = worksheet.lastRow;
    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    return workbook.xlsx
}

async function getTemplateWisePayrollExcelsheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let year = req.body.year || req.query.year
        let templateId = req.body.templateId || req.query.templateId
        let month = req.body.month || req.query.month
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let subCompanyId = req.body.subCompanyId || req.query.subCompanyId
        let employeeBranchId = req.body.employeeBranchId || req.query.employeeBranchId
        let employeeDepartmentId = req.body.employeeDepartmentId || req.query.employeeDepartmentId
        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId
        let locationID = req.body.locationID || req.query.locationID
        let apiData = await fetchData({
            token,templateId, year, month,pageNo,limit, subCompanyId, employeeBranchId, employeeDepartmentId, subDepartmentId, locationID
        })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="templateWisePayrollExcel.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })
    }
}
module.exports = { getTemplateWisePayrollExcel, getTemplateWisePayrollExcelsheet }






