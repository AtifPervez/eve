let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))

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



const getTdsReport = async (req, res) => {
    try {
        // let jan = 0, feb = 0, mar = 0, apr = 0, may = 0, jun = 0, jul = 0, aug = 0, sep = 0, oct = 0, nov = 0, dec = 0

        let data = req.body
        let { DB_NAME, finYear } = data
        let db = sequelize(DB_NAME)
        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName ,emp.employeeDepartment as Department,emp.employeeDesignation as designationName,emp.employeeBranchId as Branch,emp.employeeCode,emp.employeeSubDepartmentId as SubDepartment from eve_acc_employee as emp where emp.status="A"',
            {
                replacements: {}, type: QueryTypes.SELECT
            }
        )
        for (i in getData) {
            let e = getData[i]
           
            if (e.empId != null) {
                e.empId = e.empId.toString()
            }


            e.Branch = await getBranchNameByBranchId(e.Branch, db)
            if (e.Branch === undefined) {
                e.Branch = null
            }
            if (e.SubDepartment != null && e.SubDepartment != '') {
                e.SubDepartment = await getSubDepartmentNameBySubDepartmentId(e.SubDepartment, db)
            }
        }
        let tdsReport = await sequelize(DB_NAME).query('select * from  eve_acc_employee_tds_amount where status="A"', {

            type: QueryTypes.SELECT
        })
        getData.map(async (e) => {
            e.paidByWithDateTime = ''

            e.jan = 0, e.feb = 0, e.mar = 0, e.apr = 0, e.may = 0, e.jun = 0, e.jul = 0, e.aug = 0, e.sep = 0, e.oct = 0, e.nov = 0, e.dec = 0, e.totalSalary = 0

            tdsReport.map(async (x) => {

                if (finYear == x.year && e.empId == x.empId) {

                    if (x.month == '04') {
                        e.apr += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // apr += parseInt(x.amount)
                    }
                    else if (x.month == '05') {
                        e.may += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // may += parseInt(x.amount)
                    }
                    else if (x.month == '06') {
                        e.jun += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // jun += parseInt(x.amount)
                    }
                    else if (x.month == '07') {
                        e.jul += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // jul += parseInt(x.amount)
                    }
                    else if (x.month == '08') {
                        e.aug += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // aug += parseInt(x.amount)
                    }
                    else if (x.month == '09') {
                        e.sep += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // sep += parseInt(x.amount)
                    }
                    else if (x.month == '10') {
                        e.oct += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // oct += parseInt(x.amount)
                    }
                    else if (x.month == '11') {
                        e.nov += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // nov += parseInt(x.amount)
                    }
                    else if (x.month == '12') {
                        e.dec += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // dec += parseInt(x.amount)
                    }
                }


                if ((parseInt(finYear) + 1) == (parseInt(x.year)) && e.empId == x.empId) {

                    if (x.month == '01') {
                        e.jan += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // jan += parseInt(x.amount)
                    }
                    else if (x.month == '02') {
                        e.feb += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // feb += parseInt(x.amount)
                    }
                    else if (x.month == '03') {
                        e.mar += parseFloat(x.amount)
                        e.totalSalary += parseFloat(x.amount)
                        // mar += parseInt(x.amount)
                    }
                }


            })
        })
        for (i in getData) {

            for (j in tdsReport) {
                let e = getData[i], x = tdsReport[j]

                if (e.empId == x.empId) {
                    e.paidByWithDateTime = `${await getEmployeeNameById(x.createdBy, db)} (${x.createdDate}-${x.createdTime})`
                }

            }
        }

        let financialYearShow = `${finYear}-${parseInt(finYear) + 1}`
        
        getData.sort((a, b) => a.name.localeCompare(b.name));
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);
        let jan = 0, feb = 0, mar = 0, apr = 0, may = 0, jun = 0, jul = 0, aug = 0, sep = 0, oct = 0, nov = 0, dec = 0

        for (let i = startIndex; i < endIndex; i++) {
            let e = getData[i]
          
                jan += e.jan, feb += e.feb, mar += e.mar, apr += e.apr, may += e.may, jun += e.jun, jul += e.jul, aug += e.aug, sep += e.sep, oct += e.oct, nov += e.nov, dec += e.dec
                
            }
        paginatedData.map((e,i)=>{
            e.slNo = Number(i + 1)
        })

        getData.map((e)=>{
            if(e.jan==0){
                e.jan='--'
            }
            e.jan=formatAmount(e.jan)

            if(e.feb==0){
                e.feb='--'
            }
            e.feb=formatAmount(e.feb)
            
            if(e.mar==0){
                e.mar='--'
            }
            e.mar=formatAmount(e.mar)

            if(e.apr==0){
                e.apr='--'
            }

            e.apr=formatAmount(e.apr)

            if(e.may==0){
                e.may='--'
            }

            e.may=formatAmount(e.may)


            if(e.jun==0){
                e.jun='--'
            }

            e.jun=formatAmount(e.jun)

            if(e.jul==0){
                e.jul='--'
            }
            e.jul=formatAmount(e.jul)
                       

            if(e.aug==0){
                e.aug='--'
            }

            e.aug=formatAmount(e.aug)


            if(e.sep==0){
                e.sep='--'
            }

            e.sep=formatAmount(e.sep)
                     

            if(e.oct==0){
                e.oct='--'
            }
            e.oct=formatAmount(e.oct)


            if(e.nov==0){
                e.nov='--'
            }

            e.nov=formatAmount(e.nov) 

            if(e.dec==0){
                e.dec='--'
            }
            e.dec=formatAmount(e.dec) 

            e.totalSalary=formatAmount(e.totalSalary)
                

        })


        return res.status(200).send({
            status: true,
            totalData: getData.length,
            currentPage: pageNo,
            recordedPerPage: limit,

            financialYearShow: financialYearShow,
            employeeList: paginatedData,
            monthlySalaryTotal: {
                jan: jan, feb: feb, mar: mar, apr: apr, may: may, jun: jun, jul: jul, aug: aug, sep: sep, oct: oct, nov: nov, dec: dec
            },
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message })
    }
}
module.exports = { getTdsReport }