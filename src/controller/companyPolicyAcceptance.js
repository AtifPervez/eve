let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')

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
const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId  ', {
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


const getCompanyPolicyAcceptance = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME} = data
        let db = sequelize(DB_NAME)

        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignationId as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName,emp.employeeSubCompanyId,emp.employmentLeaveType as employmentLeaveTypeId from eve_acc_employee as emp where emp.status="A"', { replacements: {}, type: QueryTypes.SELECT })

        let compPolicy = await sequelize(DB_NAME).query('select * from eve_hrm_company_policy where status="A"', {
            type: QueryTypes.SELECT
        })
        let compPolicyAccept=await db.query('select * from eve_company_policy_accept', {
            type: QueryTypes.SELECT
        })
         let policyList=[]
        await Promise.all(getData.map(async (e, i) => {
            e.policyList = []
            e.slNo = Number(i + 1)
            e.empId = e.empId.toString()


            if (e.employeeSubCompanyId != null) {
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
            compPolicy.map((x)=>{
                if(e.employeeSubCompanyId==x.subCompanyId.split(',')){
                    e.policyList.push({
                        policyId:x.id,
                        name:x.title,
                        acceptDate:'NA',
                        empId:e.empId,
                        status:'Pending'
                    })
                }
            })
            compPolicyAccept.map((k)=>{
                for(let i=0;i<e.policyList.length;i++){
                    if(e.policyList[i].policyId==k.policyId&&e.empId==k.empId){
                        e.policyList[i].acceptDate=k.submitDate
                        e.policyList[i].status='Accepted'
                        policyList.push(e.policyList[i])
                    }
                }
            })
            if(e.policyList.length==0){
                e.policyList=''
            }
                
        }))
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
            getlistArray:paginatedData,
            policyList:policyList,
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getCompanyPolicyAcceptance }