let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))
const phpUnserialize = require('php-serialize');

const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id && status="A"', {
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
}


const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId ', {
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
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
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
}

function formatAmount(numericString) {

    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
}

const getPfReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME, finYear } = data
        let db = sequelize(DB_NAME)

        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignation as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName from eve_acc_employee as emp where emp.status="A"',
            {
                replacements: {}, type: QueryTypes.SELECT
            }
        )
        let salaryReport = await sequelize(DB_NAME).query('select * from  eve_acc_employee_payslip_preview where status="A" && isGenerated="yes"', {
            type: QueryTypes.SELECT
        })


        for (i in getData) {

            let e = getData[i]

            e.jan = 0
            e.feb = 0
            e.mar = 0
            e.apr = 0
            e.may = 0
            e.jun = 0
            e.jul = 0
            e.aug = 0
            e.sep = 0
            e.oct = 0
            e.nov = 0
            e.dec = 0
            e.totalEmployeePF = 0
            
            e.createDate = ''
            e.paidDate = ''

            if (e.empId != null) {
                e.empId = e.empId.toString()
            }


            e.branchName = await getBranchNameByBranchId(e.branchName, db)
            if (e.branchName === undefined) {
                e.branchName = null
            }
            if (e.SubdepartmentName != null && e.SubdepartmentName != '') {
                e.SubdepartmentName = await getSubDepartmentNameBySubDepartmentId(e.SubdepartmentName, db)
            }
            for (j in salaryReport) {


                let x = salaryReport[j]
                if (e.empId == x.employeeId && finYear == x.salaryOfYear &&x.salaryAmount!=undefined) {




                    if (x.salaryOfMonth == '04') {
                        let aprilObj = phpUnserialize.unserialize(x.salary_types)
                        let aprilObj1 = aprilObj.deductionDetails
                        let aprilObj2 = aprilObj1[0].salaryAmount

                        if (aprilObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += aprilObj2

                            e.apr = (aprilObj2)
                        }
                    }

                    else if (x.salaryOfMonth == '05') {
                        let mayObj = phpUnserialize.unserialize(x.salary_types)
                        let mayObj1 = mayObj.deductionDetails
                        let mayObj2 = mayObj1[0].salaryAmount

                        if (mayObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += mayObj2

                            e.may = (mayObj2)
                        }
                    }
                    else if (x.salaryOfMonth == '06') {
                        let junObj = phpUnserialize.unserialize(x.salary_types)
                        let junObj1 = junObj.deductionDetails
                        let junObj2 = junObj1[0].salaryAmount

                        if (junObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += junObj2

                            e.jun = (junObj2)
                        }

                    }
                    else if (x.salaryOfMonth == '07') {

                        let julObj = phpUnserialize.unserialize(x.salary_types)
                        let julObj1 = julObj.deductionDetails
                        let julObj2 = julObj1[0].salaryAmount
                        if (julObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += julObj2
                            e.jul = (julObj2)
                        }


                    }

                    else if (x.salaryOfMonth == '08') {
                        let augObj = phpUnserialize.unserialize(x.salary_types)
                        let augObj1 = augObj.deductionDetails
                        let augObj2 = augObj1[0].salaryAmount

                        if (augObj1[0].salaryLabel == 'PF(Employees Contribution)') {

                            e.totalEmployeePF += augObj2
                            e.aug = (augObj2)
                        }
                    }

                    else if (x.salaryOfMonth == '09') {
                        let sepObj = phpUnserialize.unserialize(x.salary_types)
                        let sepObj1 = sepObj.deductionDetails

                        let sepObj2 = sepObj1[0].salaryAmount

                        if (sepObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += sepObj2
                            e.sep = (sepObj2)
                        }
                    }

                    else if (x.salaryOfMonth == '10') {
                        let octObj = phpUnserialize.unserialize(x.salary_types)
                        let octObj1 = octObj.deductionDetails

                        let octObj2 = octObj1[0].salaryAmount
                        if (octObj1[0].salaryLabel == 'PF(Employees Contribution)') {

                            e.totalEmployeePF += octObj2
                            e.oct = (octObj2)
                        }
                    }
                    else if (x.salaryOfMonth == '11') {
                        let novObj = phpUnserialize.unserialize(x.salary_types)
                        let novObj1 = novObj.deductionDetails

                        let novObj2 = novObj1[0].salaryAmount
                        if (novObj1[0].salaryLabel == 'PF(Employees Contribution)') {

                            e.totalEmployeePF += novObj2
                            e.nov = (novObj2)
                        }

                    }

                    else if (x.salaryOfMonth == '12') {
                        let decObj = phpUnserialize.unserialize(x.salary_types)
                        let decObj1 = decObj.deductionDetails

                        let decObj2 = decObj1[0].salaryAmount

                        if (decObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += decObj2
                            e.dec = (decObj2)
                        }
                    }
                }

                if ((parseInt(finYear) + 1) == (parseInt(x.salaryOfYear)) && e.empId == x.employeeId && x.salaryAmount!=undefined) {
                    if (x.salaryOfMonth == '01') {
                        let janObj = phpUnserialize.unserialize(x.salary_types)
                        let janObj1 = janObj.deductionDetails

                        let janObj2 = janObj1[0].salaryAmount
                        if (janObj1[0].salaryLabel == 'PF(Employees Contribution)') {

                            e.totalEmployeePF += janObj2
                            e.jan = (janObj2)

                        }

                    }
                    else if (x.salaryOfMonth == '02') {
                        let febObj = phpUnserialize.unserialize(x.salary_types)
                        let febObj1 = febObj.deductionDetails

                        let febObj2 = febObj1[0].salaryAmount

                        if (febObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += febObj2
                            e.feb = (febObj2)
                        }
                    }
                    else if (x.salaryOfMonth == '03') {
                        let marObj = phpUnserialize.unserialize(x.salary_types)
                        let marObj1 = marObj.deductionDetails

                        let marObj2 = marObj1[0].salaryAmount

                        if (marObj1[0].salaryLabel == 'PF(Employees Contribution)') {
                            e.totalEmployeePF += marObj2
                            e.mar = (marObj2)
                        }
                    }
                }

            }
        }
        
        getData.sort((a, b) => a.name.localeCompare(b.name));
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);
     

        let jan = 0, feb = 0, mar = 0, apr = 0, may = 0, jun = 0, jul = 0, aug = 0, sep = 0, oct = 0, nov = 0, dec = 0

        // for (let i = startIndex; i < endIndex; i++) {
        //     let e = getData[i]
            
        //     jan += e.jan, feb += e.feb, mar += e.mar, apr += e.apr, may += e.may, jun += e.jun, jul += e.jul, aug += e.aug, sep += e.sep, oct += e.oct, nov += e.nov, dec += e.dec
        // }
        let index = startIndex
        while (index < endIndex && index < getData.length) {
            let e = getData[index]
            jan += e.jan, feb += e.feb, mar += e.mar, apr += e.apr, may += e.may, jun += e.jun, jul += e.jul, aug += e.aug, sep += e.sep, oct += e.oct, nov += e.nov, dec += e.dec

            index++

        }

       
        let financialYearShow = `${finYear}-${parseInt(finYear) + 1}`
       let netEmployeePF=0
        paginatedData.map((e,i)=>{
                 e.slNo=Number(i+1)
                 netEmployeePF+=(e.totalEmployeePF)
                })
              
                getData.map((e) => {
                    if (e.jan == 0) {
                        e.jan = '--'
                    }
                    e.jan = formatAmount(e.jan)
                    if (e.feb == 0) {
                        e.feb = '--'
                    }
                    e.feb = formatAmount(e.feb)
                    if (e.mar == 0) {
                        e.mar = '--'
                    }
                    e.mar = formatAmount(e.mar)
                    if (e.apr == 0) {
                        e.apr = '--'
                    }
                    e.apr = formatAmount(e.apr)
                    if (e.may == 0) {
                        e.may = '--'
                    }
                    e.may = formatAmount(e.may)
        
        
                    if (e.jun == 0) {
                        e.jun = '--'
                    }
        
                    e.jun = formatAmount(e.jun)
        
                    if (e.jul == 0) {
                        e.jul = '--'
                    }
                    e.jul = formatAmount(e.jul)
        
        
                    if (e.aug == 0) {
                        e.aug = '--'
                    }
        
                    e.aug = formatAmount(e.aug)
        
        
                    if (e.sep == 0) {
                        e.sep = '--'
                    }
        
                    e.sep = formatAmount(e.sep)
        
        
                    if (e.oct == 0) {
                        e.oct = '--'
                    }
                    e.oct = formatAmount(e.oct)
        
        
                    if (e.nov == 0) {
                        e.nov = '--'
                    }
        
                    e.nov = formatAmount(e.nov)
        
                    if (e.dec == 0) {
                        e.dec = '--'
                    }
                    e.dec = formatAmount(e.dec)
        
                    jan = formatAmount(jan)
                    jan =formatAmount(jan)
                    feb = formatAmount(feb)
                    mar = formatAmount(mar)
                    apr = formatAmount(apr)
                    may = formatAmount(may)
                    jun = formatAmount(jun)
                    jul = formatAmount(jul)
                    aug = formatAmount(aug)
                    sep = formatAmount(sep)
                    oct = formatAmount(oct)
                    nov = formatAmount(nov)
                    dec = formatAmount(dec)
                   
                    e.totalEmployeePF = formatAmount((e.totalEmployeePF))
                })
                netEmployeePF=formatAmount(netEmployeePF)
        return res.status(200).send({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: getData.length,
            financialYearShow: financialYearShow,
            employeeList: paginatedData,
            list: {
                netEmployeePF:((netEmployeePF)),
                jan: jan, feb: feb, mar: mar, apr: apr, may: may, jun: jun, jul: jul, aug: aug, sep: sep, oct: oct, nov: nov, dec: dec
            },
        })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getPfReport }