let sequelize = require('../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
let DB_NAME

async function getEmployeeNameById(id) {
    let employeeName = await sequelize(DB_NAME).query('select employeeName as name from eve_acc_employee where id=:id', {
        replacements: {
            id: id,

        },
        type: QueryTypes.SELECT
    })
    let res = Object.values(employeeName[0])
    let newRes = (res.toString());
    return newRes
}


const getResignationReport = async (req, res) => {
    try {

        //? eve_acc_employee as emp
        //? eve_employee_resignation_list as resign



        let getData = await sequelize(DB_NAME).query('select distinct resign.id,emp.id as empId,emp.EmployeeName,emp.employeeMobile as PhoneNo,emp.employeeEmail as Email,emp.employeeSubcompanyName as SubCompany,emp.employeeBranchId as BranchId,resign.submitDate as AppliedDate,resign.resignationDate as ResignationDate,resign.noticePeriod as NoticePeriod,resign.remarks as Remarks       from eve_acc_employee as emp right join eve_employee_resignation_list as resign on emp.id=resign.empId order by resign.id desc  ', {
            type: QueryTypes.SELECT
        })
        let branchDb = await sequelize(DB_NAME).query('select * from eve_acc_company_branch ', {
            type: QueryTypes.SELECT
        })

        getData.map((e) => {
            e.ActionBy = [
               
            ]
          
            e.empId = e.empId.toString()
            e.id = e.id.toString()
            if (e.Remarks == null) {
                e.Remarks = ''
            }
            branchDb.map((x) => {
                if (e.BranchId == x.branchId) {
                    e.BranchName = x.branchName
                }
            })

        })
        let resignDb = await sequelize(DB_NAME).query('select * from eve_employee_resignation_list ', {
            type: QueryTypes.SELECT
        })

        getData.map( async(e,i) => {

            resignDb.map( async(x,j) => {


                if (x.approvalRequired == 'All' && e.id == x.id) {
                    if (x.r1Status == 'Approved' && x.r2Status && 'Approved' && x.r3Status == 'Approved') {
                        e.approvalStatus = 'Approved'
                        e.finalStatusColor = 'green'
                    }
                    else if (x.r1Status == 'Rejected' && x.r2Status && 'Rejected' && x.r3Status == 'Rejected') {
                        e.approvalStatus = 'Rejected'
                        e.finalStatusColor = 'red'
                    }
                    else {
                        e.approvalStatus = 'Pending'
                        e.finalStatusColor = '#F1C40F';
                    }

                }
                if (x.approvalRequired == 'Anyone' && e.id == x.id) {
                    if (x.r1Status == 'Approved' || x.r2Status == 'Approved' || x.r3Status == 'Approved') {
                        e.approvalStatus = 'Approved'
                        e.finalStatusColor = 'green'
                    }
                    else if (x.r1Status == 'Rejected' || x.r2Status == 'Rejected' || x.r3Status == 'Rejected') {
                        e.approvalStatus = 'Rejected'
                        e.finalStatusColor = 'red'
                    }

                    else {
                        e.approvalStatus = 'Pending'
                        e.finalStatusColor = '#F1C40F'
                    }
                }

                if (e.id == x.id) {
                    if (x.r1Status == 'Approved' && x.r1Id != '') {
                        e.ActionBy.push({
                            r1Name: `R1- ${await getEmployeeNameById(x.r1Id)}`,
                            r1Status: `Approved`
                        })
                    }

                    else if ((x.r1Status == 'Pending' && x.r1Id != '')) {
                        e.ActionBy.push({
                            r1Name: `R1-${await getEmployeeNameById(x.r1Id)}`,
                            r1Status: 'Pending'
                        })

                    }
                    else if (x.r1Status == 'Pending' && x.r1Id == '') {
                        e.ActionBy.push({
                            r1Name: `R1-`,
                            r1Status: 'Pending'
                        })
                    }
                    if (x.r2Status == 'Approved' && x.r2Id != '') {
                        e.ActionBy.push({
                            r2Name: `R2-${await getEmployeeNameById(x.r2Id)}`,
                            r2Status: `Approved`
                        })
                    }
                    else if (x.r2Status == 'Pending' && x.r2Id != '') {
                        e.ActionBy.push({
                            r2Name: `R2-${await getEmployeeNameById(x.r2Id)}`,
                            r2Status: `Pending`
                        })


                    }
                    else if (x.r2Status == 'Pending' && x.r2Id == '') {
                        e.ActionBy.push({
                            r2Name: `R2-`,
                            r2Status: 'Pending'
                        })
                    }

                    if (x.r3Status == 'Approved' && x.r3Id != '') {
                        e.ActionBy.push({
                            r3Name: `R3-${await getEmployeeNameById(x.r3Id)}`,
                            r3Status: `Approved`
                        })
                    }
                    else if (x.r3Status == 'Pending' && x.r3Id != '') {
                        e.ActionBy.push({
                            r3Name: `R3-${await getEmployeeNameById(x.r3Id)}`,
                            r3Status: `Pending`
                        })


                    }
                    else if (x.r3Status == 'Pending' && x.r3Id == '') {
                        e.ActionBy.push({
                            r3Name: `R3-`,
                            r3Status: 'Pending'
                        })
                    }

                }



              
    
                    
            })
        })
             
        getData.map((e) => {
            delete e.empId
            delete e.BranchId
            e.totalRecords = getData.length

        })


        //? eve_acc_employee as emp
        //? eve_employee_resignation_list as resign

        let noticePeriod = await sequelize(DB_NAME).query('select resign.noticePeriod,resign.id  from eve_employee_resignation_list as resign order by resign.id desc ', {
            type: QueryTypes.SELECT
        })
        noticePeriod.map((e) => {
            delete e.id
        })

        let branchList = await sequelize(DB_NAME).query('select branchId as id,branchName from eve_acc_company_branch as branch where status="A"', {
            type: QueryTypes.SELECT
        })
        branchList.map((e) => {
            e.id = e.id.toString()
            return e

        })

        let subCompanyList = await sequelize(DB_NAME).query('select id,companyName as subCompanyName from eve_acc_subCompany where status="A"', {
            type: QueryTypes.SELECT
        })
        subCompanyList.map((e) => {
            e.id = e.id.toString()

        })

        return res.status(200).send({
            result: 'success',
            totalRecords: getData.length,
            NoticePeriodList: noticePeriod,
            branchList: branchList,
            resignationReportList: getData,
            subCompanyList: subCompanyList
        })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getResignationReport }