let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))
const phpUnserialize = require('php-serialize');
const moment = require('moment');
const { parse } = require('dotenv');

const getSalaryVPFValues=async(employeeId,month,year,db)=>{
    let salaryVpfValue = await db.query('select salary_types  from eve_acc_employee_payslip_preview where employeeId=:employeeId && salaryOfMonth=:month && salaryOfYear=:year && isGenerated="yes" && status="A"', {
        replacements: {
            employeeId: employeeId,month:month,year:year
        },
        type: QueryTypes.SELECT
    })
    salaryVpfValue.map((e)=>{
        e.salary_types=phpUnserialize.unserialize(e.salary_types)

    })
   
    return salaryVpfValue[0]
}


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
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A" ', {
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
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}
const getTodayDate = () => {
    let today = new Date();
    let year = today.getFullYear().toString();
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    let day = today.getDate().toString().padStart(2, '0');

    let formattedDate = `${year}-${month}-${day}`;
    return formattedDate
}


const getVpfReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME, startYear, endYear } = data
        let db = sequelize(DB_NAME)

        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignation as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName,emp.employeeSubCompanyId,emp.employmentLeaveType as employmentLeaveTypeId from eve_acc_employee as emp where emp.status="A"', { replacements: {}, type: QueryTypes.SELECT })

        let vpfSetting = await sequelize(DB_NAME).query('select employeeId,startDate,vpfAmount,vpfDetails,vpfStatus from eve_employee_vpf_setting where status="A"', {

            type: QueryTypes.SELECT
        })
        // console.log(vpfSetting);

        await Promise.all(getData.map(async (e, i) => {
            e.slNo = Number(i + 1)
            e.empId = e.empId.toString()
            e.monthlyAmount = 0
            e.totalDepositedAmount = 0
            e.yearlyAmount = 0
            e.startDate = '-'
            
            
           if(e.employeeSubCompanyId!=null){
                e.employeeSubCompanyId = e.employeeSubCompanyId.toString()
            }

            if (e.designationName != '' && e.designationName != null) {
                e.designationName = await getDesignationNameById(e.designationName, db)
            }
            if (e.designationName == undefined) {
                e.designationName = ''
            }
            if (e.branchName != '' && e.branchName != null) {
                e.branchName = await getBranchNameByBranchId(e.branchName, db)
            }
            if (e.branchName == undefined) {
                e.branchName = ''
            }
            if (e.SubdepartmentName != '' && e.SubdepartmentName != null) {
                e.SubdepartmentName = await getSubDepartmentNameBySubDepartmentId(e.SubdepartmentName, db)
            }
            e.yearlyAmount=0
            vpfSetting.filter((x) => {
                if (x.employeeId == e.empId) {
                    e.monthlyAmount = x.vpfAmount
                    e.startDate = x.startDate
                    e.jan = '', e.feb = '', e.mar = '', e.apr = '', e.may = '', e.jun = '', e.jul = '', e.aug = '', e.sep = '', e.oct = '', e.nov = '', e.dec = ''
                }
                else {
                    e.monthlyAmount = ''
                }

                let dateString = x.startDate
                let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
                let monthBy = date.format('MM', "MM-DD-YYYY").toString();

                let myDateString = e.startDate
                let myDate = moment(myDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let myYearBy = myDate.format('YYYY', "MM-DD-YYYY").toString()
                let myMonthBy = myDate.format('MM', "MM-DD-YYYY").toString();
              

                if (e.empId == x.employeeId && x.startDate == e.startDate) {
                  
                    if (myMonthBy == '01') {
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '02') {
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '03') {
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '04') {
                        e.apr = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.may = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jun = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jul = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.aug = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.sep = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                        else if (myMonthBy == '05') {
                        e.may = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jun = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jul = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.aug = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.sep = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '06') {
                        e.jun = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jul = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.aug = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.sep = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '07') {
                        e.jul = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.aug = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.sep = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '08') {

                        e.aug = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.sep = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '09') {
                        e.sep = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.sep)
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.oct)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.nov)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.dec)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.jan)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.feb)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.mar)
                    }
                    else if (myMonthBy == '10') {
                        e.oct = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                      
                    else if (myMonthBy == '11') {
                        e.nov = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }
                    else if (myMonthBy == '12') {
                        e.dec = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.jan = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.feb = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                        e.mar = e.monthlyAmount
                        e.yearlyAmount+=parseFloat(e.monthlyAmount)
                    }

                }
            })
        }))
        let empPayslip=await sequelize(DB_NAME).query('select * from  eve_acc_employee_payslip_preview where status="A" && isGenerated="yes"', {
            type: QueryTypes.SELECT
        })

        empPayslip.map((e)=>{
            e.salary_types=phpUnserialize.unserialize(e.salary_types)

        })
        // console.log(empPayslip);
        // getData.map((e)=>{
        //     empPayslip.map((x)=>{
               
        //         if((x.salary_types.deductionDetails.length)>0){
        //             if(e.empId==x.employeeId && x.salary_types.deductionDetails[5].salaryLabel=='VPF' ){
                        // let fisrtPaySlip=(x.salary_types)
                        // let secondPaySlip=fisrtPaySlip.deductionDetails
                        // let thirdPaySlip=secondPaySlip[5].salaryAmount
                                            
                                            //   e.totalDepositedAmount=e.salary_types.deductionDetails[5].totalAmount
                                            //   console.log(thirdPaySlip);
                                           
        //             }

        //         }
              
        //     })
        // })


        getData.sort((a, b) => a.name.localeCompare(b.name));
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);
        return res.status(200).send({ 
            status: true, 
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: getData.length, 
            list: paginatedData,

         })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getVpfReport }